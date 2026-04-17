import rough from 'roughjs/bin/rough'
import { RoughGenerator } from 'roughjs/bin/generator'
import type { Options } from 'roughjs/bin/core'
import { shapeToPath } from './shape-to-path'
import { makeSeed } from './seed'
import { PRESETS, type Preset, type PresetConfig } from './stroke-renderer'

export type { Preset, PresetConfig, RenderMode } from './stroke-renderer'
export { PRESETS } from './stroke-renderer'

export type IconShape = [string, Record<string, string | number | undefined>]

export interface TransformInput {
  iconId: string
  shapes: IconShape[]
  preset: Preset
  roughnessMultiplier?: number
  titleText?: string
}

export interface TransformInputWithConfig {
  iconId: string
  shapes: IconShape[]
  config: PresetConfig
  seedOffset?: number
  roughnessMultiplier?: number
  titleText?: string
}

let generator: RoughGenerator | null = null
function getGenerator(): RoughGenerator {
  if (generator) return generator
  generator = rough.generator({ options: {} })
  return generator
}

function render(
  iconId: string,
  shapes: IconShape[],
  cfg: PresetConfig,
  seedOffset = 0,
  roughnessMultiplier = 1,
  titleText?: string,
): string {
  const seed = (makeSeed(iconId, cfg.label) + seedOffset) >>> 0
  if (cfg.mode === 'filter') {
    return renderFilter(iconId, shapes, cfg, seed, roughnessMultiplier, titleText)
  }
  return renderRough(iconId, shapes, cfg, seed, roughnessMultiplier, titleText)
}

// ---------- Filter mode: clean path + feTurbulence displacement ----------
// Produces Craft-style output: geometric shape stays clean, stroke edges
// pick up organic pen-on-paper texture from the displacement filter.
function renderFilter(
  iconId: string,
  shapes: IconShape[],
  cfg: PresetConfig,
  seed: number,
  roughnessMultiplier: number,
  titleText: string | undefined,
): string {
  const baseFreq = cfg.baseFrequency ?? 0.85
  const octaves = cfg.numOctaves ?? 2
  const scale = (cfg.displacementScale ?? 0.4) * roughnessMultiplier
  const filterId = `brush-${iconId.replace(/[^a-z0-9-]/gi, '')}-${cfg.label.toLowerCase()}-${seed}`

  const paths: string[] = []
  for (const [tag, attrs] of shapes) {
    const d = shapeToPath(tag, attrs)
    if (!d) continue
    paths.push(
      `<path d="${d}" stroke="${cfg.color}" stroke-width="${cfg.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
    )
  }

  // Expand filter region so displaced pixels at the edges aren't clipped.
  const filterDef = `<filter id="${filterId}" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="${baseFreq}" numOctaves="${octaves}" seed="${seed}" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="${scale}"/></filter>`

  return wrapSvg([`<defs>${filterDef}</defs><g filter="url(#${filterId})">${paths.join('')}</g>`], titleText)
}

// ---------- Rough mode: rough.js path distortion (existing behavior) ------
function renderRough(
  iconId: string,
  shapes: IconShape[],
  cfg: PresetConfig,
  seed: number,
  roughnessMultiplier: number,
  titleText: string | undefined,
): string {
  const gen = getGenerator()
  const options: Options = {
    seed,
    roughness: (cfg.roughness ?? 1.0) * roughnessMultiplier,
    bowing: cfg.bowing ?? 1.0,
    stroke: cfg.color,
    strokeWidth: cfg.strokeWidth,
    fill: undefined,
    preserveVertices: false,
    disableMultiStroke: cfg.disableMultiStroke ?? false,
  }
  const paths: string[] = []
  for (const [tag, attrs] of shapes) {
    const d = shapeToPath(tag, attrs)
    if (!d) continue
    try {
      const drawable = gen.path(d, options)
      for (const op of drawable.sets) {
        if (op.type !== 'path' && op.type !== 'fillSketch') continue
        const pathD = opsToPath(op.ops)
        if (!pathD) continue
        paths.push(
          `<path d="${pathD}" stroke="${cfg.color}" stroke-width="${cfg.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
        )
      }
    } catch (err) {
      console.warn(`[transform] rough.path failed for ${iconId}:`, err)
    }
  }
  return wrapSvg(paths, titleText)
}

export function transformIcon({
  iconId,
  shapes,
  preset,
  roughnessMultiplier,
  titleText,
}: TransformInput): string {
  return render(iconId, shapes, PRESETS[preset], 0, roughnessMultiplier, titleText)
}

export function transformIconWithConfig({
  iconId,
  shapes,
  config,
  seedOffset,
  roughnessMultiplier,
  titleText,
}: TransformInputWithConfig): string {
  return render(iconId, shapes, config, seedOffset, roughnessMultiplier, titleText)
}

type Op = { op: string; data: number[] }

function opsToPath(ops: readonly Op[]): string {
  const parts: string[] = []
  for (const { op, data } of ops) {
    if (op === 'move') {
      parts.push(`M${fmt(data[0])} ${fmt(data[1])}`)
    } else if (op === 'lineTo') {
      parts.push(`L${fmt(data[0])} ${fmt(data[1])}`)
    } else if (op === 'bcurveTo') {
      parts.push(
        `C${fmt(data[0])} ${fmt(data[1])} ${fmt(data[2])} ${fmt(data[3])} ${fmt(data[4])} ${fmt(data[5])}`,
      )
    }
  }
  return parts.join(' ')
}

function fmt(n: number): string {
  return n.toFixed(2)
}

function wrapSvg(paths: string[], titleText?: string): string {
  const title = titleText ? `<title>${escapeXml(titleText)}</title>` : ''
  const role = titleText ? ' role="img"' : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none"${role}>${title}${paths.join('')}</svg>`
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

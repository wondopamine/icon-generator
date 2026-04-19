export type Preset = 'pencil' | 'ink' | 'marker' | 'charcoal' | 'sketchy'

export type RenderMode = 'filter' | 'rough'

export interface PresetConfig {
  label: string
  color: string
  strokeWidth: number
  mode: RenderMode

  // Filter-mode params (rough-baked stroke + feTurbulence + feDisplacementMap)
  // Higher baseFrequency = finer grain. Higher scale = more edge wobble.
  baseFrequency?: number
  numOctaves?: number
  displacementScale?: number
  // Rough.js distortion applied BEFORE the filter so exports stay hand-drawn
  // even in tools that don't render SVG filters (Figma, Finder Quick Look).
  // Keep these subtle — the filter adds organic texture on top in browsers.
  bakeRoughness?: number
  bakeBowing?: number

  // Rough-mode params (rough.js path distortion, no filter)
  roughness?: number
  bowing?: number
  disableMultiStroke?: boolean
}

export const PRESETS: Record<Preset, PresetConfig> = {
  ink: {
    label: 'Ink',
    color: '#0f0f0f',
    strokeWidth: 1.4,
    mode: 'filter',
    baseFrequency: 0.85,
    numOctaves: 2,
    displacementScale: 0.35,
    // Keep bake values tiny — the filter does most of the work in-browser,
    // and any deviation here gets 10× magnified at /tune's 240px preview.
    bakeRoughness: 0.18,
    bakeBowing: 0.35,
  },
  pencil: {
    label: 'Pencil',
    color: '#4b4b4b',
    strokeWidth: 1.15,
    mode: 'filter',
    baseFrequency: 1.2,
    numOctaves: 2,
    displacementScale: 0.55,
    bakeRoughness: 0.22,
    bakeBowing: 0.45,
  },
  marker: {
    label: 'Marker',
    color: '#14213d',
    strokeWidth: 2.1,
    mode: 'filter',
    baseFrequency: 0.45,
    numOctaves: 2,
    displacementScale: 0.2,
    bakeRoughness: 0.18,
    bakeBowing: 0.5,
  },
  charcoal: {
    label: 'Charcoal',
    color: '#2a2a2a',
    strokeWidth: 1.7,
    mode: 'rough',
    roughness: 2.4,
    bowing: 2.3,
    disableMultiStroke: false,
  },
  sketchy: {
    label: 'Sketchy',
    color: '#111111',
    strokeWidth: 1.5,
    mode: 'rough',
    roughness: 1.4,
    bowing: 1.8,
    disableMultiStroke: false,
  },
}

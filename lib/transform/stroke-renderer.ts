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

  // Portable-export overrides (filter-mode only). The filter carries most of
  // the hand-drawn character in browsers; tools like Figma/Finder either don't
  // render feTurbulence or sample it differently, so the export looks clean.
  // When rendering for portable export we drop the filter and swap in these
  // amplified values so the SVG reads as hand-drawn everywhere.
  portableRoughness?: number
  portableBowing?: number
  portableMultiStroke?: boolean

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
    portableRoughness: 0.35,
    portableBowing: 0.65,
    portableMultiStroke: false,
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
    portableRoughness: 0.4,
    portableBowing: 0.75,
    portableMultiStroke: false,
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
    portableRoughness: 0.3,
    portableBowing: 0.8,
    portableMultiStroke: true,
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

import { loadIconShapes } from '@/lib/icon-loader'
import { transformIcon, type Preset } from '@/lib/transform'

export async function buildSvg(
  iconId: string,
  preset: Preset,
  roughnessMultiplier = 1,
  titleText?: string,
): Promise<string | null> {
  const shapes = await loadIconShapes(iconId)
  if (!shapes) return null
  return transformIcon({ iconId, shapes, preset, roughnessMultiplier, titleText })
}

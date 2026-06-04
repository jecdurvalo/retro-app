export const EVOLUTION_STORAGE_KEY = 'leadership-evolution-evidence'

export const evolutionAreas = ['Modelo de gestão', 'Desenvolvimento do time', 'Exposição estratégica', 'Governança e decisões'] as const
export const leadershipPrinciples = ['Time melhor que você', 'Care to Dare', 'Assuma o front', 'HQA', 'Cultura', 'Eficiência'] as const
export type EvolutionArea = (typeof evolutionAreas)[number]
export type LeadershipPrinciple = (typeof leadershipPrinciples)[number]

export type EvolutionEvidence = {
  id: string
  description: string
  date: string
  area: EvolutionArea
  principle: LeadershipPrinciple
  frontId: string
  personId: string
  decision: string
  ritual: string
  learning: string
}

export const initialEvidence: EvolutionEvidence[] = []

export function createEmptyEvidence(): EvolutionEvidence {
  return { id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `evidence-${Date.now()}`, description: '', date: new Date().toISOString().slice(0, 10), area: 'Modelo de gestão', principle: 'Assuma o front', frontId: '', personId: '', decision: '', ritual: '', learning: '' }
}
export function loadEvolutionEvidence(): EvolutionEvidence[] {
  if (typeof window === 'undefined') return []
  try { const value = JSON.parse(localStorage.getItem(EVOLUTION_STORAGE_KEY) || 'null'); return Array.isArray(value) ? value : [] } catch { return [] }
}
export function saveEvolutionEvidence(items: EvolutionEvidence[]) { if (typeof window !== 'undefined') localStorage.setItem(EVOLUTION_STORAGE_KEY, JSON.stringify(items)) }

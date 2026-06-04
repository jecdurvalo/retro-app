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

export const initialEvidence: EvolutionEvidence[] = [
  { id: 'evo-governance', description: 'Estruturei checkpoints das frentes críticas com donos e próximos passos.', date: '2026-06-03', area: 'Modelo de gestão', principle: 'Eficiência', frontId: 'front-data', personId: '', decision: '', ritual: 'Checkpoint semanal de frentes', learning: 'Cadência simples reduz cobrança reativa.' },
  { id: 'evo-kiki', description: 'Dei autonomia para Kiki conduzir uma recomendação executiva.', date: '2026-06-02', area: 'Desenvolvimento do time', principle: 'Time melhor que você', frontId: 'front-data', personId: 'person-kiki', decision: 'Regra oficial de receita líquida', ritual: '1:1', learning: 'Delegar contexto e critério funcionou melhor que delegar tarefa.' },
  { id: 'evo-strategy', description: 'Conduzi alinhamento com stakeholders seniores sobre capacidade e trade-offs.', date: '2026-05-29', area: 'Exposição estratégica', principle: 'Assuma o front', frontId: 'front-support', personId: '', decision: 'Reforço temporário de suporte', ritual: 'Sync com liderança', learning: 'A recomendação precisa aparecer antes dos detalhes.' },
  { id: 'evo-hqa', description: 'Passei a registrar HQA e checkpoints nas decisões de maior impacto.', date: '2026-05-27', area: 'Governança e decisões', principle: 'HQA', frontId: 'front-onboarding', personId: '', decision: 'Priorizar eventos do onboarding', ritual: 'Revisão de decisões', learning: '' },
]

export function createEmptyEvidence(): EvolutionEvidence {
  return { id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `evidence-${Date.now()}`, description: '', date: new Date().toISOString().slice(0, 10), area: 'Modelo de gestão', principle: 'Assuma o front', frontId: '', personId: '', decision: '', ritual: '', learning: '' }
}
export function loadEvolutionEvidence(): EvolutionEvidence[] {
  if (typeof window === 'undefined') return initialEvidence
  try { const value = JSON.parse(localStorage.getItem(EVOLUTION_STORAGE_KEY) || 'null'); return Array.isArray(value) ? value : initialEvidence } catch { return initialEvidence }
}
export function saveEvolutionEvidence(items: EvolutionEvidence[]) { if (typeof window !== 'undefined') localStorage.setItem(EVOLUTION_STORAGE_KEY, JSON.stringify(items)) }

export const DECISIONS_STORAGE_KEY = 'leadership-decisions'

export const decisionStatuses = ['Pendente', 'Em alinhamento', 'Decidida', 'Escalada'] as const
export type DecisionStatus = (typeof decisionStatuses)[number]

export type LeadershipDecision = {
  id: string
  title: string
  context: string
  tradeOff: string
  owner: string
  stakeholders: string[]
  frontIds: string[]
  hqa: boolean
  hqaNote: string
  nextCheckpoint: string
  noCheckpointReason: string
  status: DecisionStatus
  createdAt: string
  updatedAt: string
}

export const initialDecisions: LeadershipDecision[] = [
  {
    id: 'decision-revenue-rule',
    title: 'Definir regra oficial de receita líquida',
    context: 'Financeiro e Dados usam regras diferentes nos painéis executivos.',
    tradeOff: 'Comparabilidade histórica versus aderência à leitura financeira atual.',
    owner: 'Joana',
    stakeholders: ['Financeiro', 'Dados', 'Diretoria Comercial'],
    frontIds: ['front-data'],
    hqa: false,
    hqaNote: 'Ainda falta validação final do Financeiro.',
    nextCheckpoint: '2026-06-06',
    noCheckpointReason: '',
    status: 'Em alinhamento',
    createdAt: '2026-06-01T12:00:00.000Z',
    updatedAt: '2026-06-04T12:00:00.000Z',
  },
  {
    id: 'decision-support-capacity',
    title: 'Alocar reforço temporário para suporte',
    context: 'A fila crítica continua acima da capacidade semanal de resolução.',
    tradeOff: 'Acelerar recuperação do SLA reduz capacidade de uma entrega planejada.',
    owner: 'Camila Freitas',
    stakeholders: ['Suporte', 'Engenharia de Plataforma'],
    frontIds: ['front-support'],
    hqa: true,
    hqaNote: 'Impactos, limites e duração alinhados entre as áreas.',
    nextCheckpoint: '2026-06-05',
    noCheckpointReason: '',
    status: 'Decidida',
    createdAt: '2026-06-02T12:00:00.000Z',
    updatedAt: '2026-06-04T10:00:00.000Z',
  },
  {
    id: 'decision-pricing-owner',
    title: 'Nomear dono da revisão de pricing',
    context: 'A frente precisa iniciar antes do planejamento do segundo semestre.',
    tradeOff: '',
    owner: '',
    stakeholders: ['Diretoria Comercial', 'Financeiro', 'Produto'],
    frontIds: ['front-pricing'],
    hqa: false,
    hqaNote: '',
    nextCheckpoint: '',
    noCheckpointReason: '',
    status: 'Pendente',
    createdAt: '2026-05-28T12:00:00.000Z',
    updatedAt: '2026-06-02T12:00:00.000Z',
  },
  {
    id: 'decision-onboarding-events',
    title: 'Priorizar eventos do onboarding no próximo ciclo',
    context: 'O piloto depende de instrumentação mínima para medir ativação.',
    tradeOff: 'Adiar melhoria de baixa criticidade para garantir evidência do piloto.',
    owner: 'Marina Costa',
    stakeholders: ['Produto', 'Engenharia', 'Customer Success'],
    frontIds: ['front-onboarding'],
    hqa: true,
    hqaNote: 'Áreas concordaram com escopo, impacto e critério de revisão.',
    nextCheckpoint: '2026-06-09',
    noCheckpointReason: '',
    status: 'Decidida',
    createdAt: '2026-05-30T12:00:00.000Z',
    updatedAt: '2026-06-03T12:00:00.000Z',
  },
]

function cloneDecision(decision: LeadershipDecision): LeadershipDecision {
  return { ...decision, stakeholders: [...decision.stakeholders], frontIds: [...decision.frontIds] }
}

export function createEmptyDecision(): LeadershipDecision {
  const now = new Date().toISOString()
  return {
    id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `decision-${Date.now()}`,
    title: 'Nova decisão',
    context: '',
    tradeOff: '',
    owner: '',
    stakeholders: [],
    frontIds: [],
    hqa: false,
    hqaNote: '',
    nextCheckpoint: '',
    noCheckpointReason: '',
    status: 'Pendente',
    createdAt: now,
    updatedAt: now,
  }
}

export function loadDecisions(): LeadershipDecision[] {
  if (typeof window === 'undefined') return initialDecisions.map(cloneDecision)
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DECISIONS_STORAGE_KEY) || 'null')
    return Array.isArray(parsed) ? parsed.map(cloneDecision) : initialDecisions.map(cloneDecision)
  } catch {
    return initialDecisions.map(cloneDecision)
  }
}

export function saveDecisions(decisions: LeadershipDecision[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(DECISIONS_STORAGE_KEY, JSON.stringify(decisions))
}

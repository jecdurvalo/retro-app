export const RITUALS_STORAGE_KEY = 'leadership-rituals'
export const MONTHLY_CLOSE_STORAGE_KEY = 'leadership-monthly-close'

export const ritualTypes = ['Checkpoint de frente', '1:1', 'Retro mensal', 'Sync com liderança', 'Revisão de decisões', 'Fechamento mensal'] as const
export const ritualCadences = ['Semanal', 'Quinzenal', 'Mensal', 'Trimestral', 'Pontual'] as const
export type RitualType = (typeof ritualTypes)[number]

export type LeadershipRitual = {
  id: string
  name: string
  type: RitualType
  cadence: (typeof ritualCadences)[number]
  nextDate: string
  purpose: string
  preparation: string
  frontId: string
  personId: string
  outputs: string[]
  createdAt: string
}

export type MonthlyClose = {
  progress: number
  checklist: { label: string; done: boolean }[]
  improved: string
  worsened: string
  stalled: string
  leadershipAction: string
  nextSteps: string[]
  updatedAt: string
}

export const initialRituals: LeadershipRitual[] = [
  { id: 'ritual-fronts', name: 'Checkpoint semanal de frentes', type: 'Checkpoint de frente', cadence: 'Semanal', nextDate: '2026-06-08', purpose: 'Desbloquear frentes e confirmar próximos passos.', preparation: 'Revisar críticas, bloqueios e checkpoints.', frontId: 'front-data', personId: '', outputs: ['Atualização de frente', 'Decisão'], createdAt: '2026-05-01T12:00:00.000Z' },
  { id: 'ritual-kiki', name: '1:1 com Kiki', type: '1:1', cadence: 'Quinzenal', nextDate: '2026-06-08', purpose: 'Acompanhar trilha de especialista e autonomia.', preparation: 'Separar evidências e próximo desafio.', frontId: 'front-data', personId: 'person-kiki', outputs: ['PDI', 'Checkpoint'], createdAt: '2026-05-01T12:00:00.000Z' },
  { id: 'ritual-retro', name: 'Retro qualitativa mensal', type: 'Retro mensal', cadence: 'Mensal', nextDate: '2026-06-26', purpose: 'Ler sinais do time e transformar em acompanhamento.', preparation: 'Consolidar mood e temas recorrentes.', frontId: '', personId: '', outputs: ['Task', 'Frente', 'Monitoramento'], createdAt: '2026-04-01T12:00:00.000Z' },
  { id: 'ritual-leadership', name: 'Sync com liderança', type: 'Sync com liderança', cadence: 'Quinzenal', nextDate: '2026-06-11', purpose: 'Alinhar trade-offs, riscos e exposição estratégica.', preparation: 'Selecionar decisões e riscos que pedem patrocínio.', frontId: 'front-pricing', personId: '', outputs: ['Decisão'], createdAt: '2026-05-01T12:00:00.000Z' },
  { id: 'ritual-decisions', name: 'Revisão de decisões', type: 'Revisão de decisões', cadence: 'Semanal', nextDate: '2026-06-09', purpose: 'Confirmar HQA, donos e checkpoints.', preparation: 'Revisar decisões pendentes e escaladas.', frontId: '', personId: '', outputs: ['Checkpoint', 'Decisão'], createdAt: '2026-05-01T12:00:00.000Z' },
  { id: 'ritual-close', name: 'Fechamento mensal de gestão', type: 'Fechamento mensal', cadence: 'Mensal', nextDate: '2026-06-30', purpose: 'Consolidar aprendizados e preparar o próximo ciclo.', preparation: 'Revisar frentes, pessoas, decisões e evidências.', frontId: '', personId: '', outputs: ['Próximos passos'], createdAt: '2026-04-01T12:00:00.000Z' },
]

export const initialMonthlyClose: MonthlyClose = {
  progress: 60,
  checklist: [
    { label: 'Revisar frentes críticas', done: true },
    { label: 'Consolidar decisões do mês', done: true },
    { label: 'Registrar evolução das pessoas', done: false },
    { label: 'Definir focos do próximo ciclo', done: false },
  ],
  improved: 'Mais clareza de donos e checkpoints nas frentes críticas.',
  worsened: 'Capacidade do time de suporte continua pressionada.',
  stalled: 'Revisão de pricing ainda sem dono.',
  leadershipAction: 'Desbloquear capacidade e nomear dono da revisão de pricing.',
  nextSteps: ['Agendar alinhamento de capacidade', 'Definir dono da frente de pricing'],
  updatedAt: '2026-06-04T12:00:00.000Z',
}

export function createEmptyRitual(): LeadershipRitual {
  return { id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `ritual-${Date.now()}`, name: 'Novo ritual', type: 'Checkpoint de frente', cadence: 'Semanal', nextDate: '', purpose: '', preparation: '', frontId: '', personId: '', outputs: [], createdAt: new Date().toISOString() }
}

export function loadRituals(): LeadershipRitual[] {
  if (typeof window === 'undefined') return initialRituals.map(item => ({ ...item, outputs: [...item.outputs] }))
  try { const value = JSON.parse(localStorage.getItem(RITUALS_STORAGE_KEY) || 'null'); return Array.isArray(value) ? value : initialRituals } catch { return initialRituals }
}
export function saveRituals(items: LeadershipRitual[]) { if (typeof window !== 'undefined') localStorage.setItem(RITUALS_STORAGE_KEY, JSON.stringify(items)) }
export function loadMonthlyClose(): MonthlyClose {
  if (typeof window === 'undefined') return initialMonthlyClose
  try { return JSON.parse(localStorage.getItem(MONTHLY_CLOSE_STORAGE_KEY) || 'null') || initialMonthlyClose } catch { return initialMonthlyClose }
}
export function saveMonthlyClose(item: MonthlyClose) { if (typeof window !== 'undefined') localStorage.setItem(MONTHLY_CLOSE_STORAGE_KEY, JSON.stringify(item)) }

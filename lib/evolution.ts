// lib/evolution.ts - Gestão da evolução de carreira e desenvolvimento do time

export const EVOLUTION_STORAGE_KEY = 'leadership-evolution-evidence'

export const evolutionAreas = ['Modelo de gestão', 'Desenvolvimento do time', 'Exposição estratégica', 'Governança e decisões'] as const
export const leadershipPrinciples = ['Time melhor que você', 'Care to Dare', 'Assuma o front', 'HQA', 'Cultura', 'Eficiência'] as const
export type EvolutionArea = (typeof evolutionAreas)[number]
export type LeadershipPrinciple = (typeof leadershipPrinciples)[number]

// === EVIDÊNCIAS DE EVOLUÇÃO ===
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
  return { 
    id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `evidence-${Date.now()}`, 
    description: '', 
    date: new Date().toISOString().slice(0, 10), 
    area: 'Modelo de gestão', 
    principle: 'Assuma o front', 
    frontId: '', 
    personId: '', 
    decision: '', 
    ritual: '', 
    learning: '' 
  }
}

// === CHECKPOINTS COM LIDERANÇA ===
export interface Checkpoint {
  id: string
  date: string
  with: string // ex: "Katia"
  topics: string[]
  decisions: string[]
  nextSteps: string[]
  mood: '😀' | '🙂' | '😐' | '😟' | '😫'
}

export const initialCheckpoints: Checkpoint[] = []

export function createEmptyCheckpoint(): Checkpoint {
  return {
    id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `checkpoint-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    with: '',
    topics: [],
    decisions: [],
    nextSteps: [],
    mood: '🙂'
  }
}

// === METAS DE EVOLUÇÃO PARA ESPEC ===
export interface SpecGoal {
  id: string
  category: 'lideranca' | 'estrategia' | 'governanca' | 'tecnico' | 'cultura'
  title: string
  description: string
  progress: number // 0-100
  evidences: string[] // IDs das evidências
  targetDate?: string
  status: 'not-started' | 'in-progress' | 'completed'
}

export const initialSpecGoals: SpecGoal[] = [
  {
    id: '1',
    category: 'lideranca',
    title: 'Desenvolver Kiki e Paulo para próximo nível',
    description: 'Criar PDI personalizado, acompanhar evolução semanal e garantir promoções',
    progress: 30,
    evidences: [],
    status: 'in-progress'
  },
  {
    id: '2',
    category: 'estrategia',
    title: 'Transição do operacional para estratégico',
    description: 'Reduzir tempo em operações diárias e aumentar participação em decisões estratégicas',
    progress: 45,
    evidences: [],
    status: 'in-progress'
  },
  {
    id: '3',
    category: 'governanca',
    title: 'Excelência em governança de antifraude',
    description: 'Estabelecer processos claros de decisão, indicadores e documentação',
    progress: 60,
    evidences: [],
    status: 'in-progress'
  },
  {
    id: '4',
    category: 'cultura',
    title: 'Garantir cultura iFood no time emprestado',
    description: 'Desafiar Bia e Nati a sair do operacional e olhar estratégico',
    progress: 25,
    evidences: [],
    status: 'in-progress'
  },
  {
    id: '5',
    category: 'tecnico',
    title: 'Especialização técnica em AI First',
    description: 'Liderar cadência de AI First e estabelecer melhores práticas',
    progress: 40,
    evidences: [],
    status: 'in-progress'
  }
]

// === FUNÇÕES DE STORAGE ===
function getStorageKey(key: string): string {
  return `retro_sync_${key}`
}

export function loadEvolutionData() {
  if (typeof window === 'undefined') {
    return {
      evidences: [] as EvolutionEvidence[],
      checkpoints: [] as Checkpoint[],
      goals: [...initialSpecGoals]
    }
  }
  
  try {
    const evidencesStr = localStorage.getItem(getStorageKey('evidences'))
    const checkpointsStr = localStorage.getItem(getStorageKey('checkpoints'))
    const goalsStr = localStorage.getItem(getStorageKey('spec_goals'))

    return {
      evidences: evidencesStr ? JSON.parse(evidencesStr) : [] as EvolutionEvidence[],
      checkpoints: checkpointsStr ? JSON.parse(checkpointsStr) : [] as Checkpoint[],
      goals: goalsStr ? JSON.parse(goalsStr) : [...initialSpecGoals]
    }
  } catch (error) {
    console.error('Erro ao carregar dados de evolução:', error)
    return {
      evidences: [] as EvolutionEvidence[],
      checkpoints: [] as Checkpoint[],
      goals: [...initialSpecGoals]
    }
  }
}

export function saveEvolutionEvidence(items: EvolutionEvidence[]) { 
  if (typeof window !== 'undefined') {
    localStorage.setItem(EVOLUTION_STORAGE_KEY, JSON.stringify(items))
  }
}

// Evidence CRUD
export function saveEvidence(evidence: EvolutionEvidence) {
  const data = loadEvolutionData()
  data.evidences.push(evidence)
  localStorage.setItem(getStorageKey('evidences'), JSON.stringify(data.evidences))
  return evidence
}

export function updateEvidence(evidence: EvolutionEvidence) {
  const data = loadEvolutionData()
  const index = data.evidences.findIndex(e => e.id === evidence.id)
  if (index !== -1) {
    data.evidences[index] = evidence
    localStorage.setItem(getStorageKey('evidences'), JSON.stringify(data.evidences))
  }
  return evidence
}

export function deleteEvidence(id: string) {
  const data = loadEvolutionData()
  data.evidences = data.evidences.filter(e => e.id !== id)
  localStorage.setItem(getStorageKey('evidences'), JSON.stringify(data.evidences))
}

// Checkpoint CRUD
export function saveCheckpoint(checkpoint: Checkpoint) {
  const data = loadEvolutionData()
  data.checkpoints.push(checkpoint)
  localStorage.setItem(getStorageKey('checkpoints'), JSON.stringify(data.checkpoints))
  return checkpoint
}

export function updateCheckpoint(checkpoint: Checkpoint) {
  const data = loadEvolutionData()
  const index = data.checkpoints.findIndex(c => c.id === checkpoint.id)
  if (index !== -1) {
    data.checkpoints[index] = checkpoint
    localStorage.setItem(getStorageKey('checkpoints'), JSON.stringify(data.checkpoints))
  }
  return checkpoint
}

export function deleteCheckpoint(id: string) {
  const data = loadEvolutionData()
  data.checkpoints = data.checkpoints.filter(c => c.id !== id)
  localStorage.setItem(getStorageKey('checkpoints'), JSON.stringify(data.checkpoints))
}

// Spec Goal CRUD
export function updateSpecGoal(goal: SpecGoal) {
  const data = loadEvolutionData()
  const index = data.goals.findIndex(g => g.id === goal.id)
  if (index !== -1) {
    data.goals[index] = goal
    localStorage.setItem(getStorageKey('spec_goals'), JSON.stringify(data.goals))
  }
  return goal
}

export function addEvidenceToGoal(goalId: string, evidenceId: string) {
  const data = loadEvolutionData()
  const goal = data.goals.find(g => g.id === goalId)
  if (goal && !goal.evidences.includes(evidenceId)) {
    goal.evidences.push(evidenceId)
    localStorage.setItem(getStorageKey('spec_goals'), JSON.stringify(data.goals))
  }
}

// Helpers
export function getRecentCheckpoints(limit = 5) {
  const data = loadEvolutionData()
  return data.checkpoints
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
}

export function getEvidencesByType(type?: EvolutionEvidence['area']) {
  const data = loadEvolutionData()
  if (!type) return data.evidences
  return data.evidences.filter(e => e.area === type)
}

export function getOverallProgress(): number {
  const data = loadEvolutionData()
  if (data.goals.length === 0) return 0
  const total = data.goals.reduce((sum, goal) => sum + goal.progress, 0)
  return Math.round(total / data.goals.length)
}

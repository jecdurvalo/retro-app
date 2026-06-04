export const PEOPLE_STORAGE_KEY = 'leadership-people'

export const attentionTypes = ['Dar autonomia', 'Desafiar', 'Cuidar', 'Desenvolver', 'Monitorar carga'] as const
export type AttentionType = (typeof attentionTypes)[number]

export type LeadershipPerson = {
  id: string
  name: string
  role: string
  relationship: 'Liderado direto' | 'Liderada emprestada'
  moment: string
  frontIds: string[]
  nextLeap: string
  nextOneOnOne: string
  attention: AttentionType
  pdiTitle: string
  pdiStatus: 'Ativo' | 'Em revisão' | 'Sem PDI'
  evidence: string[]
  risks: string[]
  levers: string[]
  updatedAt: string
}

export const initialPeople: LeadershipPerson[] = [
  {
    id: 'person-kiki',
    name: 'Kiki',
    role: 'Analista sênior',
    relationship: 'Liderado direto',
    moment: 'Trilha para especialista · consolidando profundidade',
    frontIds: ['front-data'],
    nextLeap: 'Ser referência técnica e influenciar decisões além da própria entrega.',
    nextOneOnOne: '2026-06-08',
    attention: 'Dar autonomia',
    pdiTitle: 'Especialista: influência técnica e visão sistêmica',
    pdiStatus: 'Ativo',
    evidence: ['Conduziu diagnóstico dos indicadores com autonomia', 'Recomendação técnica usada no comitê'],
    risks: ['Assumir execução demais e reduzir espaço para influência'],
    levers: ['Apresentar recomendação executiva', 'Mentorar uma pessoa no diagnóstico'],
    updatedAt: '2026-06-03T12:00:00.000Z',
  },
  {
    id: 'person-paulo',
    name: 'Paulo',
    role: 'Analista pleno',
    relationship: 'Liderado direto',
    moment: 'Trilha para especialista · construindo consistência',
    frontIds: ['front-support'],
    nextLeap: 'Transformar conhecimento operacional em padrões replicáveis.',
    nextOneOnOne: '2026-06-10',
    attention: 'Desenvolver',
    pdiTitle: 'Especialista: método, evidência e comunicação',
    pdiStatus: 'Ativo',
    evidence: ['Criou rotina de leitura da fila crítica', 'Antecipou um risco de capacidade'],
    risks: ['Ainda depende de validação para decisões de maior impacto'],
    levers: ['Liderar checkpoint semanal', 'Documentar padrão de recuperação'],
    updatedAt: '2026-06-02T12:00:00.000Z',
  },
  {
    id: 'person-bia',
    name: 'Bia',
    role: 'Liderada emprestada · Operações',
    relationship: 'Liderada emprestada',
    moment: 'Alta entrega operacional · ampliar visão estratégica',
    frontIds: ['front-onboarding'],
    nextLeap: 'Sair da execução recorrente e desenhar automações para a operação.',
    nextOneOnOne: '2026-06-09',
    attention: 'Desafiar',
    pdiTitle: 'Automação e visão estratégica da operação',
    pdiStatus: 'Em revisão',
    evidence: ['Mapeou gargalos do onboarding', 'Reduziu retrabalho com checklist simples'],
    risks: ['Sobrecarga por centralizar conhecimento operacional'],
    levers: ['Propor automação prioritária', 'Delegar rotina e medir ganho'],
    updatedAt: '2026-06-04T10:00:00.000Z',
  },
  {
    id: 'person-nati',
    name: 'Nati',
    role: 'Liderada emprestada · Cultura e Operações',
    relationship: 'Liderada emprestada',
    moment: 'Influência informal forte · sustentar cultura em escala',
    frontIds: ['front-development', 'front-pricing'],
    nextLeap: 'Conectar cultura, estratégia e escolhas operacionais do time.',
    nextOneOnOne: '2026-06-12',
    attention: 'Desafiar',
    pdiTitle: 'Influência estratégica e sustentação de cultura',
    pdiStatus: 'Ativo',
    evidence: ['Facilitou alinhamento entre áreas', 'Transformou feedback do time em proposta prática'],
    risks: ['Ser acionada apenas para resolver urgências operacionais'],
    levers: ['Liderar uma decisão transversal', 'Definir mecanismo de cultura observável'],
    updatedAt: '2026-06-03T15:00:00.000Z',
  },
  {
    id: 'person-lucas',
    name: 'Lucas',
    role: 'Liderança de suporte',
    relationship: 'Liderado direto',
    moment: 'Expansão de responsabilidade sob alta demanda',
    frontIds: ['front-support'],
    nextLeap: 'Sustentar performance sem centralizar decisões.',
    nextOneOnOne: '2026-06-05',
    attention: 'Cuidar',
    pdiTitle: 'Delegação sob pressão',
    pdiStatus: 'Ativo',
    evidence: ['Criou acordos claros com engenharia'],
    risks: ['Sinais de sobrecarga e pouco tempo para desenvolvimento'],
    levers: ['Reduzir carga operacional', 'Delegar gestão da fila'],
    updatedAt: '2026-06-04T11:00:00.000Z',
  },
]

function clonePerson(person: LeadershipPerson): LeadershipPerson {
  return { ...person, frontIds: [...person.frontIds], evidence: [...person.evidence], risks: [...person.risks], levers: [...person.levers] }
}

export function loadPeople(): LeadershipPerson[] {
  if (typeof window === 'undefined') return initialPeople.map(clonePerson)
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PEOPLE_STORAGE_KEY) || 'null')
    return Array.isArray(parsed) ? parsed.map(clonePerson) : initialPeople.map(clonePerson)
  } catch {
    return initialPeople.map(clonePerson)
  }
}

export function savePeople(people: LeadershipPerson[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people))
}

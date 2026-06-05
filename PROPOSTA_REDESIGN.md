# 🎯 Proposta de Redesign - Retro Sync

## Contexto Real da Joana

### Seu Cenário de Gestão

**Time direto (2 pessoas):**
- **Kiki e Paulo** → Em desenvolvimento, próximos passos como espec, PDIs diferentes, níveis de experiência diferentes

**Time emprestado (2 pessoas):**
- **Bia e Nati** (da Elaine) → Precisa desafiar, garantir cultura iFood, sair do operacional para estratégico, automatizar operação

**Sua evolução:**
- **Katia** te envolvendo mais em decisões estratégicas
- Exposição a stakeholders de alto nível
- Modelo de gestão e governança de decisões/indicadores/processos de antifraude

---

## 🔥 Temas que Você Acompanha de Perto

1. **Cadência do AI First**
2. **Blindagem Pago**
3. **Lexia e Cerberus**
4. **Automação da Operação**

**Outros temas:** Confia plenamente no básico do dia-a-dia do time

---

## ❌ Problemas Atuais do App

### 1. **Tasks Muito Pobres**
- Hoje: apenas texto, status, data, responsável
- Falta: prioridade, tipo de task, esforço, dependências, vínculo com objetivos maiores
- Não diferencia task operacional de task estratégica

### 2. **Não Reflete Sua Realidade de Gestão**
- Não há distinção entre liderados diretos vs. emprestados
- Não há acompanhamento de maturidade por pessoa
- Não há link entre tasks e desenvolvimento de carreira (sua e do time)

### 3. **FCA Forçado Demais**
- Nem tudo vira FCA (tema qualitativo de retro)
- Às vezes é só uma task conectada a uma frente maior
- Exemplos reais:
  - "Garantir processo OK de conta a pagar de fornecedor" → task operacional
  - "Criar roadmap cross" → task estratégica
  - "Desenhar E2E do impacto da blindagem por área" → task de análise

### 4. **Não Há Histórico Qualitativo**
- Top temas das últimas retros?
- Mood do time ao longo do tempo?
- Evolução dos temas quentes?

### 5. **Difícil de Usar no Dia-a-Dia**
- Onde crio minhas tasks rápidas?
- Onde registro insights soltos?
- Onde vejo o que EU preciso fazer hoje?

---

## ✅ Proposta de Solução

### **Pilar 1: Gestão de Tasks Rica e Flexível**

#### Novo Modelo de Task
```typescript
type Task = {
  id: string
  text: string
  status: 'Aberta' | 'Em andamento' | 'Concluída' | 'Bloqueada'
  
  // NOVO: Prioridade (não existe hoje)
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica'
  
  // NOVO: Tipo de task (não existe hoje)
  type: 'Operacional' | 'Estratégica' | 'Desenvolvimento' | 'Governança'
  
  // NOVO: Esforço estimado (não existe hoje)
  effort: '15min' | '1h' | '2h' | '4h' | '1d' | '>1d'
  
  dueDate: string
  assignee: string
  frontId: string  // vínculo com frente maior (opcional)
  fcaId: string    // vínculo com FCA (opcional)
  
  // NOVO: Tags livres (não existe hoje)
  tags: string[]   // ex: ['ai-first', 'blindagem', 'pdi-kiki']
  
  // NOVO: Checklist dentro da task (não existe hoje)
  subtasks: { id: string; text: string; done: boolean }[]
  
  // NOVO: Notas/contexto (não existe hoje)
  notes: string
  
  createdAt: string
  updatedAt: string
}
```

#### Views de Tasks
1. **"Minhas Tasks"** (nova página)
   - Filtro automático: `assignee === 'Joana'` ou `assignee === ''` (não atribuído)
   - Agrupamento por: Hoje | Esta semana | Posteriormente
   - Destaque para tasks críticas/atrasadas
   
2. **"Tasks do Time"** (nova página)
   - Todas as tasks atribuídas ao time
   - Filtros por pessoa, tipo, prioridade
   - Visão de carga por pessoa

3. **"Backlog de Ideias"** (nova página)
   - Insights soltos que ainda não viraram tasks
   - Quick capture: "criar roadmap cross", "conversar com Katia sobre X"
   - Depois você transforma em task ou frente

---

### **Pilar 2: Gestão de Pessoas com Contexto**

#### Novo Modelo de Pessoa
```typescript
type LeadershipPerson = {
  id: string
  name: string
  role: string
  
  // NOVO: Tipo de relação (não existe hoje)
  relationship: 'Direto' | 'Emprestado' | 'Matricial'
  
  // NOVO: Nível de senioridade (não existe hoje)
  level: 'Júnior' | 'Pleno' | 'Sênior' | 'Espec' | 'Liderança'
  
  // NOVO: Momento de desenvolvimento (não existe hoje)
  developmentFocus: 'Autonomia' | 'Estratégia' | 'Governança' | 'Técnico'
  
  // Mantém o que já existe
  attentionType: 'Dar autonomia' | 'Desafiar' | 'Cuidar' | 'Desenvolver' | 'Monitorar carga'
  pdi: { goals: string[]; progress: number }
  oneOnOneSchedule: string
  notes: NoteEntry[]
}
```

#### Página de Pessoas Redesenhada
- **Cards diferenciados** por tipo de relação (cor/borda)
- **Badge de momento**: "Próximo: Espec", "Foco: Estratégia"
- **Quick actions**: 
  - "Registrar feedback"
  - "Agendar 1:1"
  - "Criar task de desenvolvimento"

---

### **Pilar 3: Frentes Mais Flexíveis**

#### Novo Modelo de Frente
```typescript
type ManagementFront = {
  id: string
  name: string
  description: string
  type: 'Tema Quente' | 'Projeto' | 'Processo' | 'Desenvolvimento'
  temperature: 'Saudável' | 'Atenção' | 'Crítica'
  
  // NOVO: Categoria de acompanhamento (não existe hoje)
  trackingMode: 'Proximo' | 'Basico'  // Próximo = você acompanha de perto, Básico = confia no time
  
  // NOVO: Lista de temas relacionados (não existe hoje)
  relatedThemes: string[]  // ex: ['ai-first', 'blindagem-pago']
  
  owner: string
  involvedPeople: string[]
  status: 'Ativa' | 'Bloqueada' | 'Concluída' | 'Arquivada'
  
  // Mantém FCA como opcional (não obrigatório)
  fcas?: FCA[]
  
  nextCheckpoint: string
  nextStep: string
  managerIntervention: 'Decidir' | 'Desbloquear' | 'Alinhar stakeholders' | 'Desenvolver dono' | 'Monitorar' | 'Nenhuma'
  
  createdAt: string
  updatedAt: string
}
```

#### Página de Frentes Redesenhada
- **Filtros rápidos**: "Temas Quentes" | "Confio no Time" | "Preciso Acompanhar"
- **Visualização em Kanban** (opcional): colunas por temperatura ou status
- **Indicador de saúde**: mostra quantas tasks estão atrasadas/em aberto por frente

---

### **Pilar 4: Retrospectiva com Histórico**

#### Nova Página: "Histórico de Retros"
- **Timeline mensal**: cada retro como um card
- **Ao clicar**: expande e mostra
  - Mood do time (gráfico de evolução)
  - Top 3 temas mais citados
  - FCAs gerados
  - Tasks criadas a partir daquela retro
  - Decisões tomadas

#### Dashboard de Mood
- Gráfico de linha: mood ao longo dos meses
- Heatmap de temas: quais temas aparecem mais em cada mês
- Correlação: quando o mood cai, quais temas aparecem?

---

### **Pilar 5: Minha Evolução (Carreira)**

#### Página "Minha Evolução" (já existe, mas precisa de ajustes)
- **Objetivo claro**: mostrar progresso rumo a "Espec"
- **Evidências vinculadas a tasks**: quando completa uma task estratégica, vira evidência
- **Checkpoints com Katia**: registrar o que foi discutido, próximos passos
- **Gap analysis**: onde estou hoje vs. onde preciso chegar

#### Novo Modelo de Evolução
```typescript
type EvolutionEvidence = {
  id: string
  title: string
  description: string
  date: string
  
  // NOVO: Área de evolução
  area: 'Modelo de gestão' | 'Desenvolvimento do time' | 'Exposição estratégica' | 'Governança'
  
  // NOVO: Vínculo com tasks/frentes (não existe hoje)
  linkedTaskIds: string[]
  linkedFrontIds: string[]
  
  // NOVO: Nível de impacto (não existe hoje)
  impactLevel: 'Time' | 'Área' | 'Cross' | 'Empresa'
  
  learning: string
}
```

---

### **Pilar 6: Captura Rápida no Dia-a-Dia**

#### Nova Feature: "Quick Capture" (flutuante em todas as páginas)
- Botão flutuante no canto inferior direito
- Ao clicar: modal com 3 opções
  1. **Nova Task** → texto rápido, já cria como "Aberta"
  2. **Novo Insight** → vai para backlog de ideias
  3. **Nova Frente** → se for algo maior

#### Notificações Leves
- Toast ao criar task: "Task criada ✅"
- Lembrete suave: "Você tem 3 tasks vencendo hoje"
- Sem notificações intrusivas, só feedback visual

---

## 🎨 Melhorias de UI/UX

### 1. **Menos Minimalismo, Mais Personalidade**
- Cores mais vibrantes (mantendo wine como primária)
- Ilustrações sutis em empty states
- Ícones mais expressivos

### 2. **Hierarquia Visual Clara**
- Tasks críticas: card vermelho suave
- Tasks estratégicas: badge dourado
- Tasks operacionais: badge azul

### 3. **Empty States Amigáveis**
- Em vez de "Sem tasks", mostrar:
  - "Nada por aqui! 🎉"
  - "Que tal planejar sua semana?"
  - Botão: "Criar primeira task"

### 4. **Loading States**
- Skeletons enquanto carrega
- Transições suaves entre estados

### 5. **Feedback de Ações**
- Toast notifications
- Confirmação antes de excluir
- Undo por 5 segundos após excluir

---

## 📋 Roadmap de Implementação

### Fase 1: Tasks Ricas (1-2 semanas)
- [ ] Adicionar campos: priority, type, effort, tags, subtasks, notes
- [ ] Criar página "Minhas Tasks"
- [ ] Criar página "Backlog de Ideias"
- [ ] Melhorar TaskRow com novos campos
- [ ] Adicionar Quick Capture

### Fase 2: Pessoas com Contexto (1 semana)
- [ ] Adicionar campos: relationship, level, developmentFocus
- [ ] Redesenhar cards de pessoas
- [ ] Adicionar filtros por tipo de relação

### Fase 3: Frentes Flexíveis (1 semana)
- [ ] Adicionar campos: trackingMode, relatedThemes
- [ ] Adicionar view Kanban (opcional)
- [ ] Melhorar filtros de frentes

### Fase 4: Histórico de Retros (1 semana)
- [ ] Criar página "Histórico de Retros"
- [ ] Salvar mood e temas por retro
- [ ] Gráficos de evolução

### Fase 5: Minha Evolução (1 semana)
- [ ] Vincular evidências a tasks/frentes
- [ ] Adicionar campo impactLevel
- [ ] Dashboard de progresso

### Fase 6: Polish de UI/UX (1 semana)
- [ ] Toast notifications
- [ ] Skeletons/loading states
- [ ] Empty states amigáveis
- [ ] Undo após exclusão

---

## 🎯 Critérios de Sucesso

1. **Facilidade de uso**: consigo criar uma task em <10 segundos
2. **Contexto real**: o app reflete minha gestão (direto vs. emprestado, próximo vs. básico)
3. **Flexibilidade**: nem tudo precisa virar FCA, posso ter tasks soltas
4. **Histórico**: consigo ver evolução do mood e temas ao longo do tempo
5. **Carreira**: vejo meu progresso rumo a espec e do time rumo a autonomia/estratégia

---

## 💡 Princípios de Design

1. **Qualitativo > Quantitativo**: números ajudam, mas o foco é contexto
2. **Flexível > Rígido**: o app se adapta ao seu fluxo, não o contrário
3. **Leve > Pesado**: sem burocracia, sem workflows complexos
4. **Pessoal > Genérico**: feito para SUA realidade de gestão
5. **Evolução > Perfeição**: começa simples, cresce com você

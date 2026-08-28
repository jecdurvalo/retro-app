-- Retro Sync — carga inicial a partir do localStorage
-- Rode isso DEPOIS de 0001_init.sql, no mesmo SQL Editor. Popula o banco novo com
-- os dados reais que estavam salvos no navegador (extraídos via
-- `copy(JSON.stringify(Object.fromEntries(Object.entries(localStorage))))`).
-- Seguro de rodar mais de uma vez: todo insert usa "on conflict" pela chave
-- primária, então rodar de novo só atualiza os mesmos registros, não duplica.
--
-- session_id usado abaixo (para retro_board_settings e retro_snapshots) é o que
-- já estava nas chaves "retro-board-header-<id>" / "retro-theme-groups-<id>" do
-- localStorage: 8bdf0a25-1e61-4c40-8ee8-b7330346b5a5. Se o seu NEXT_PUBLIC_SESSION_ID
-- no projeto novo for diferente disso, troque nas duas linhas marcadas abaixo.
--
-- Ficou de fora (sem dado nenhum no localStorage exportado): leadership_decisions,
-- leadership_tasks, leadership_rituals, e a coluna "evidences" de leadership_evolution.

-- ─── leadership_captured_inputs ─────────────────────────────────────────────────
-- Essa tabela não existia em 0001 — "Capturar input" (components/capture-input.tsx)
-- ainda só grava no localStorage, então ela não tinha lugar no banco. Criando aqui
-- para não perder esse dado; o código que lê/escreve nela ainda precisa ser
-- conectado depois (avise se quiser que eu faça isso também).

create table if not exists public.leadership_captured_inputs (
  id         text primary key,
  data       jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.leadership_captured_inputs enable row level security;

drop policy if exists "leadership_captured_inputs: acesso público" on public.leadership_captured_inputs;
create policy "leadership_captured_inputs: acesso público"
  on public.leadership_captured_inputs for all
  using (true)
  with check (true);

-- ─── leadership_fronts (5 frentes) ──────────────────────────────────────────────

insert into public.leadership_fronts (id, data, created_at, updated_at) values
('b3872b42-4f6a-45ad-b50e-c8afa1b8ce50', $j${"id":"b3872b42-4f6a-45ad-b50e-c8afa1b8ce50","name":"iFood Beneficios","description":"","type":"Projeto","owner":"Kieslen Assumpcao","involvedPeople":[],"stakeholders":[],"temperature":"Atenção","status":"Em andamento","origin":"Outro","managerIntervention":"Monitorar","nextCheckpoint":"2026-09-04","nextStep":"","risks":[],"relatedDecisions":[],"relatedTasks":[],"evidence":[],"fcas":[],"tags":[],"progressOverride":50,"createdAt":"2026-08-28T01:33:58.417Z","updatedAt":"2026-08-28T02:00:33.079Z"}$j$::jsonb, '2026-08-28T01:33:58.417Z', '2026-08-28T02:00:33.079Z'),
('f9fc018f-c2b3-4b68-9b20-13ae53110a76', $j${"id":"f9fc018f-c2b3-4b68-9b20-13ae53110a76","name":"AI First","description":"","type":"Projeto","owner":"Marco Leite","involvedPeople":[],"stakeholders":[],"temperature":"Atenção","status":"Em andamento","origin":"Outro","managerIntervention":"Monitorar","nextCheckpoint":"2026-09-10","nextStep":"","risks":[],"relatedDecisions":[],"relatedTasks":[],"evidence":[],"fcas":[],"tags":[],"progressOverride":50,"createdAt":"2026-08-28T01:32:16.434Z","updatedAt":"2026-08-28T02:00:18.479Z"}$j$::jsonb, '2026-08-28T01:32:16.434Z', '2026-08-28T02:00:18.479Z'),
('ba05883d-46f8-4193-919e-90345640a795', $j${"id":"ba05883d-46f8-4193-919e-90345640a795","name":"Tolerância Zero","description":"","type":"Projeto","owner":"Jaisa Orsolin","involvedPeople":[],"stakeholders":[],"temperature":"Atenção","status":"Em andamento","origin":"Outro","managerIntervention":"Monitorar","nextCheckpoint":"2026-09-03","nextStep":"","risks":[],"relatedDecisions":[],"relatedTasks":[],"evidence":[],"fcas":[],"tags":[],"progressOverride":80,"createdAt":"2026-08-28T01:31:56.267Z","updatedAt":"2026-08-28T02:00:14.379Z"}$j$::jsonb, '2026-08-28T01:31:56.267Z', '2026-08-28T02:00:14.379Z'),
('181fb9d2-a20f-4003-991c-68231641882b', $j${"id":"181fb9d2-a20f-4003-991c-68231641882b","name":"Cartões","description":"","type":"Projeto","owner":"Wemerson Lima","involvedPeople":[],"stakeholders":[],"temperature":"Crítica","status":"Em andamento","origin":"Outro","managerIntervention":"Monitorar","nextCheckpoint":"2026-09-08","nextStep":"","risks":[],"relatedDecisions":[],"relatedTasks":[],"evidence":[],"fcas":[],"tags":[],"progressOverride":30,"createdAt":"2026-08-28T01:31:12.034Z","updatedAt":"2026-08-28T02:00:10.372Z"}$j$::jsonb, '2026-08-28T01:31:12.034Z', '2026-08-28T02:00:10.372Z'),
('c4a58850-60da-45f9-b289-9301cb05dd06', $j${"id":"c4a58850-60da-45f9-b289-9301cb05dd06","name":"Blindagem Pago","description":"","type":"Projeto","owner":"Paulo Campos","involvedPeople":[],"stakeholders":[],"temperature":"Saudável","status":"Em andamento","origin":"Outro","managerIntervention":"Monitorar","nextCheckpoint":"2026-09-02","nextStep":"","risks":[],"relatedDecisions":[],"relatedTasks":[],"evidence":[],"fcas":[],"tags":[],"progressOverride":90,"createdAt":"2026-08-28T01:30:50.100Z","updatedAt":"2026-08-28T02:00:27.062Z"}$j$::jsonb, '2026-08-28T01:30:50.100Z', '2026-08-28T02:00:27.062Z')
on conflict (id) do update set data = excluded.data, updated_at = excluded.updated_at;

-- ─── leadership_people (6 pessoas) ───────────────────────────────────────────────

insert into public.leadership_people (id, data, updated_at) values
('person-1787876761384', $j${"id":"person-1787876761384","name":"Kieslen Assumpcao","role":"Analista Senior","relationship":"Liderado direto","moment":"","visionSummary":"","careerMoment":"Preparação próximo nível","startDate":"","leaderName":"Joana Durvalo","nextLeap":"Tocando uma frente sozinha","nextLeapEvidence":[],"leaderActions":[],"frontIds":["b3872b42-4f6a-45ad-b50e-c8afa1b8ce50"],"projectRoles":{"b3872b42-4f6a-45ad-b50e-c8afa1b8ce50":"Protagonismo"},"nextOneOnOne":"2026-09-02","oneOnOnes":[],"attention":"Desenvolver","pdi":{"title":"Virar espec","status":"Ativo","goals":"","nextStep":"oi\n","updatedAt":"2026-08-28T00:26:01.384Z"},"notes":[],"feedback":[],"risks":["Baixa visibilidade"],"levers":["Garra","Protagonismo"],"updatedAt":"2026-08-28T02:36:30.311Z"}$j$::jsonb, '2026-08-28T02:36:30.311Z'),
('person-1787876780749', $j${"id":"person-1787876780749","name":"Marco Leite","role":"Especialista","relationship":"Liderado direto","moment":"","visionSummary":"","careerMoment":"Consolidação no cargo","startDate":"","leaderName":"Joana Durvalo","nextLeap":"","nextLeapEvidence":[],"leaderActions":[],"frontIds":[],"projectRoles":{},"nextOneOnOne":"2026-08-28","oneOnOnes":[],"attention":"Dar autonomia","pdi":{"title":"","status":"Sem PDI","goals":"","nextStep":"","updatedAt":"2026-08-28T00:26:20.750Z"},"notes":[],"feedback":[],"risks":[],"levers":[],"updatedAt":"2026-08-28T02:28:08.861Z"}$j$::jsonb, '2026-08-28T02:28:08.861Z'),
('person-1787876789215', $j${"id":"person-1787876789215","name":"Jaisa Orsolin","role":"Especialista","relationship":"Liderado direto","moment":"","visionSummary":"","careerMoment":"Alta performance","startDate":"","leaderName":"Joana Durvalo","nextLeap":"","nextLeapEvidence":[],"leaderActions":[],"frontIds":[],"projectRoles":{},"nextOneOnOne":"2026-08-28","oneOnOnes":[],"attention":"Desafiar","pdi":{"title":"","status":"Sem PDI","goals":"","nextStep":"","updatedAt":"2026-08-28T00:26:29.215Z"},"notes":[],"feedback":[],"risks":[],"levers":[],"updatedAt":"2026-08-28T02:28:25.877Z"}$j$::jsonb, '2026-08-28T02:28:25.877Z'),
('person-1787876798015', $j${"id":"person-1787876798015","name":"Natalia Lima","role":"Analista Pleno","relationship":"Liderado direto","moment":"","visionSummary":"","careerMoment":"Recuperação","startDate":"","leaderName":"Joana Durvalo","nextLeap":"","nextLeapEvidence":[],"leaderActions":[],"frontIds":[],"projectRoles":{},"nextOneOnOne":"2026-08-28","oneOnOnes":[],"attention":"Monitorar carga","pdi":{"title":"","status":"Sem PDI","goals":"","nextStep":"","updatedAt":"2026-08-28T00:26:38.015Z"},"notes":[],"feedback":[],"risks":[],"levers":[],"updatedAt":"2026-08-28T02:28:32.127Z"}$j$::jsonb, '2026-08-28T02:28:32.127Z'),
('person-1787876810133', $j${"id":"person-1787876810133","name":"Wemerson Lima","role":"Analista Senior","relationship":"Liderado direto","moment":"","visionSummary":"","careerMoment":"Mudança de escopo","startDate":"","leaderName":"Joana Durvalo","nextLeap":"","nextLeapEvidence":[],"leaderActions":[],"frontIds":[],"projectRoles":{},"nextOneOnOne":"","oneOnOnes":[],"attention":"Desenvolver","pdi":{"title":"","status":"Sem PDI","goals":"","nextStep":"","updatedAt":"2026-08-28T00:26:50.133Z"},"notes":[],"feedback":[],"risks":[],"levers":[],"updatedAt":"2026-08-28T01:53:59.966Z"}$j$::jsonb, '2026-08-28T01:53:59.966Z'),
('person-1787881998818', $j${"id":"person-1787881998818","name":"Paulo Campos","role":"Analista Senior","relationship":"Liderado direto","moment":"","visionSummary":"","careerMoment":"Alta performance","startDate":"","leaderName":"Joana Durvalo","nextLeap":"","nextLeapEvidence":[],"leaderActions":[],"frontIds":[],"projectRoles":{},"nextOneOnOne":"2026-09-01","oneOnOnes":[],"attention":"Dar autonomia","pdi":{"title":"","status":"Sem PDI","goals":"","nextStep":"","updatedAt":"2026-08-28T01:53:18.818Z"},"notes":[],"feedback":[],"risks":[],"levers":[],"updatedAt":"2026-08-28T02:28:41.792Z"}$j$::jsonb, '2026-08-28T02:28:41.792Z')
on conflict (id) do update set data = excluded.data, updated_at = excluded.updated_at;

-- ─── leadership_monthly_close (1 linha, singleton) ──────────────────────────────

insert into public.leadership_monthly_close (singleton, data, updated_at) values
(true, $j${"progress":0,"checklist":[{"label":"Revisar frentes críticas","done":false},{"label":"Consolidar decisões do mês","done":false},{"label":"Registrar evolução das pessoas","done":false},{"label":"Definir focos do próximo ciclo","done":false}],"improved":"","worsened":"","stalled":"","leadershipAction":"","nextSteps":[],"updatedAt":"2026-08-28T02:11:24.703Z"}$j$::jsonb, '2026-08-28T02:11:24.703Z')
on conflict (singleton) do update set data = excluded.data, updated_at = excluded.updated_at;

-- ─── leadership_evolution (1 linha, singleton) ──────────────────────────────────
-- "evidences" não tinha dado no localStorage exportado, então fica como '[]'.

insert into public.leadership_evolution (singleton, evidences, focuses, commitments, cycle, updated_at) values
(
  true,
  '[]'::jsonb,
  $j$[{"id":"af7aa41d-42eb-4c34-a343-bbb588407c1c","title":"Estruturar visibilidade cartões","description":"","priority":"Alta","done":false,"createdAt":"2026-08-28T02:30:17.521Z","updatedAt":"2026-08-28T02:30:17.521Z"}]$j$::jsonb,
  $j$[{"id":"cd20e5e0-5dfd-49df-b1cc-3cca7f76f894","text":"Toda frente ativa precisa ter dono, próximo passo e checkpoint.","done":false,"createdAt":"2026-08-28T01:29:18.285Z"},{"id":"c504c38e-23bb-4492-a449-a251c5f442e5","text":"Todo ponto relevante da retro deve virar frente, task, FCA, decisão ou evidência de desenvolvimento.","done":false,"createdAt":"2026-08-28T01:29:18.285Z"},{"id":"d633718c-8aff-4932-bcb7-1911b32f635d","text":"Todo FCA aberto deve ter ação corretiva, responsável e prazo.","done":false,"createdAt":"2026-08-28T01:29:18.285Z"}]$j$::jsonb,
  $j${"label":"MB1 FY26","startDate":"2026-04-01","endDate":"2026-09-30"}$j$::jsonb,
  now()
)
on conflict (singleton) do update set
  focuses = excluded.focuses,
  commitments = excluded.commitments,
  cycle = excluded.cycle,
  updated_at = excluded.updated_at;

-- ─── retro_board_settings (1 linha, board header + grupos de tema) ─────────────
-- Troque o session_id abaixo se o seu NEXT_PUBLIC_SESSION_ID no projeto novo for
-- diferente de 8bdf0a25-1e61-4c40-8ee8-b7330346b5a5.

insert into public.retro_board_settings (session_id, board_header, theme_groups, updated_at) values
(
  '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5',
  $j${"title":"Retrospectiva Time","subtitle":"Acompanhe os cards do time em tempo real."}$j$::jsonb,
  $j$[{"id":"group-1787873434919","category":"went_well","title":"Parceria","itemIds":["2d28236f-8f69-4aa3-8650-f21db9bce40c","4e24592f-2dfe-427a-9a92-b1d8a0612b70","eda1fb94-42e9-406e-acf4-dcbc4c3e12b9","e08bcdb5-0136-42f7-81f7-f85a4c0072fe"]},{"id":"group-1787873458101","category":"went_well","title":"Alinhamento","itemIds":["f54e45e6-c1bb-49eb-a786-89b6e6954a9e","32bdbb24-0f14-4fc7-8c92-795af6ee7d10","0486355c-b08d-49ea-ab6e-29bb70e870e5"]},{"id":"group-1787873470151","category":"went_well","title":"Projetos","itemIds":["8dd63c8c-dec5-47dc-9d64-f83bf8a18065","37e562a7-9f75-488b-bcfb-23e9e1837fb5","811f0bab-ab0e-4f55-95da-3425e66a9663"]},{"id":"group-1787873538601","category":"to_improve","title":"Direcional","itemIds":["b8038e28-75c4-48ca-89f5-b5df6dea4320","5195154c-b885-4328-bfe9-5ac263b30af3"]},{"id":"group-1787873559901","category":"to_improve","title":"Desenvolvimento","itemIds":["4dc341c1-808d-4a0b-859e-aa6c07b5ab0b","0a1ec689-b125-40aa-b9ea-2b819a829861"]},{"id":"group-1787873586268","category":"to_improve","title":"Relacionamento entre times","itemIds":["141f6df1-2aac-461a-95bd-a94fe532cb3a","db326ff9-20f5-478d-a6d4-8c0a68428977","a45af3e8-2c7b-4d52-b619-ff80279f44f9"]},{"id":"group-1787873603768","category":"to_improve","title":"Protocolo crises","itemIds":["c2c2af65-2ab0-4b4c-a8e2-26455771a8f1","65981345-fff3-4d8e-9b24-abc5f6e8a150","de031a0d-c65c-466d-94b3-8221a77addde"]},{"id":"group-1787873623218","category":"action_items","title":"Incidentes","itemIds":["2bc52ee9-d710-4667-b865-556149c173be","ba68afcc-e3e9-4504-92fc-62040b8de899"]}]$j$::jsonb,
  now()
)
on conflict (session_id) do update set
  board_header = excluded.board_header,
  theme_groups = excluded.theme_groups,
  updated_at = excluded.updated_at;

-- ─── retro_snapshots (1 retro finalizada: maio de 2026) ─────────────────────────
-- Mesma observação de session_id acima.

insert into public.retro_snapshots (
  id, session_id, title, date, mood_average, mood_count, item_count, open_plan_count,
  themes, items, leader_name, participant_names, bookmarked, created_at
) values (
  'snapshot-1787874860361',
  '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5',
  'Retro de maio de 2026',
  '2026-05-29',
  3.4,
  5,
  28,
  0,
  array['Mandamos muito bem', 'Precisamos melhorar', 'Vamos parar'],
  $j$[{"category":"Precisamos melhorar · Relacionamento entre times","content":"Percepção das áreas de que queremos dificultar a vida deles","authorName":null},{"category":"Mandamos muito bem","content":"Autonomia","authorName":null},{"category":"Mandamos muito bem · Projetos","content":"Aceleramos muito a agenda de blindagem do pago 🔥","authorName":null},{"category":"Precisamos melhorar · Protocolo crises","content":"Playbooks de crise: o que fazer, quando e como","authorName":null},{"category":"Precisamos melhorar · Desenvolvimento","content":"Clareza do que esperam de mim na senioridade que estou.","authorName":"Kieslen"},{"category":"Precisamos melhorar · Relacionamento entre times","content":"Mais entrosamento com o time de payments, depois que houve a separação parecem que são duas áreas totalmente apertadas","authorName":null},{"category":"Precisamos melhorar · Direcional","content":"Mapa dos nossos produtos e processos como north star","authorName":null},{"category":"Precisamos melhorar","content":"Trazer mais indicadores para nossas discussões","authorName":null},{"category":"Precisamos melhorar · Protocolo crises","content":"Acionamentos fora do horário comercial durante a semana.","authorName":"Kieslen"},{"category":"Mandamos muito bem · Projetos","content":"Engajamento com agenda de agents","authorName":null},{"category":"Vamos parar","content":"Falando por mim, acredito que não devo continuar fazendo as coisas apenas porque “sempre foi assim”. Ter um pensamento mais crítico e estar aberta a mudanças será essencial para o meu crescimento.","authorName":null},{"category":"Precisamos melhorar · Direcional","content":"Clareza do que precisa ser feito logo no começo do ciclo.","authorName":"Kieslen"},{"category":"Precisamos melhorar · Relacionamento entre times","content":"‘Sinergia’ e alinhamento de prioridades com data","authorName":null},{"category":"Mandamos muito bem · Alinhamento","content":"Gosto das interações e criticidade na avaliação das decisões e entregas, sinto que isso tem me ajudado a evoluir no meu desenvolvimento.","authorName":"Kieslen"},{"category":"Precisamos melhorar · Desenvolvimento","content":"Feedback de desenvolvimento","authorName":null},{"category":"Vamos parar","content":"Ter tantas agendas de alinhamento, sinto que nem todas são produtivas","authorName":null},{"category":"Mandamos muito bem","content":"Errar e corrigir rápido","authorName":null},{"category":"Mandamos muito bem · Parceria","content":"Ajuda entre pessoas do time","authorName":null},{"category":"Mandamos muito bem · Alinhamento","content":"Adoro nossos alinhamentos, sempre saio esclarecida no que devo priorizar. \nGosto do nível de sinceridade ao falar dos problemas e o que pode ser melhorado.","authorName":"Kieslen"},{"category":"Vamos parar · Incidentes","content":"Pouca visibilidade em momentos de incidente","authorName":null},{"category":"Precisamos melhorar","content":"Acredito que estamos no caminho certo e devido as mudanças, já estamos no foco de melhoria","authorName":null},{"category":"Vamos parar · Incidentes","content":"Acionamentos de fim de semana e após o horário","authorName":null},{"category":"Mandamos muito bem · Alinhamento","content":"Melhor direcionamento da expectativa","authorName":null},{"category":"Mandamos muito bem · Parceria","content":"Proximidade interna","authorName":null},{"category":"Mandamos muito bem · Projetos","content":"Automatizamos o help!!","authorName":null},{"category":"Mandamos muito bem · Parceria","content":"Parceria","authorName":null},{"category":"Precisamos melhorar · Protocolo crises","content":"Volume de coisas em paralelo","authorName":null},{"category":"Mandamos muito bem · Parceria","content":"A parceria da equipe e a vontade de fazer acontecer","authorName":null}]$j$::jsonb,
  null,
  array[]::text[],
  false,
  '2026-08-27T23:54:20.362Z'
)
on conflict (id) do update set
  title = excluded.title,
  items = excluded.items;

-- ─── leadership_captured_inputs (1 registro capturado) ──────────────────────────

insert into public.leadership_captured_inputs (id, data, created_at) values
(
  'ffd534ff-0c87-4456-9657-ad3fed8a042e',
  $j${"id":"ffd534ff-0c87-4456-9657-ad3fed8a042e","text":"Feedback Thais sobre Cartões - maior visibilidade da frente","origin":"Reunião","people":"Thais Redondo, Katia Costa","relatedFrontId":"181fb9d2-a20f-4003-991c-68231641882b","relatedFrontName":"Cartões","urgency":"Crítica","notes":"","classification":"Insight qualitativo","relatedDecision":"","createdAt":"2026-08-28T02:03:07.953Z"}$j$::jsonb,
  '2026-08-28T02:03:07.953Z'
)
on conflict (id) do update set data = excluded.data;

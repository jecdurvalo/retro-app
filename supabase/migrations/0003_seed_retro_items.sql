-- Retro Sync — reconstrução de retro_items (retro de maio/2026)
-- Rode depois de 0001_init.sql e 0002_seed_from_localstorage.sql.
--
-- Esses 28 cards não vinham do localStorage (retro_items nunca teve cópia local —
-- ver conversa anterior). Foram remontados a partir do conteúdo que você colou
-- (a mesma retro já arquivada em retro_snapshots), cruzando cada item com os ids
-- que os grupos de tema (retro_board_settings.theme_groups, já inserido em 0002)
-- já referenciavam — por isso os 22 itens que pertencem a algum tema usam
-- exatamente esses ids, e os 6 sem tema recebem um id novo fixo (fica idempotente:
-- rodar de novo não duplica).
--
-- Trocar o session_id abaixo se o seu NEXT_PUBLIC_SESSION_ID for diferente de
-- 8bdf0a25-1e61-4c40-8ee8-b7330346b5a5 (o mesmo usado em 0002 para board/snapshot).

insert into public.retro_items (id, session_id, category, content, author_name, created_at) values

-- Mandamos muito bem (12) — 🏷 Projetos (3)
('8dd63c8c-dec5-47dc-9d64-f83bf8a18065', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'went_well', 'Aceleramos muito a agenda de blindagem do pago 🔥', null, '2026-05-29T12:00:00Z'),
('37e562a7-9f75-488b-bcfb-23e9e1837fb5', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'went_well', 'Engajamento com agenda de agents', null, '2026-05-29T12:00:00Z'),
('811f0bab-ab0e-4f55-95da-3425e66a9663', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'went_well', 'Automatizamos o help!!', null, '2026-05-29T12:00:00Z'),

-- Mandamos muito bem — 🏷 Alinhamento (3)
('f54e45e6-c1bb-49eb-a786-89b6e6954a9e', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'went_well', 'Gosto das interações e criticidade na avaliação das decisões e entregas, sinto que isso tem me ajudado a evoluir no meu desenvolvimento.', 'Kieslen', '2026-05-29T12:00:00Z'),
('32bdbb24-0f14-4fc7-8c92-795af6ee7d10', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'went_well', 'Adoro nossos alinhamentos, sempre saio esclarecida no que devo priorizar.
Gosto do nível de sinceridade ao falar dos problemas e o que pode ser melhorado.', 'Kieslen', '2026-05-29T12:00:00Z'),
('0486355c-b08d-49ea-ab6e-29bb70e870e5', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'went_well', 'Melhor direcionamento da expectativa', null, '2026-05-29T12:00:00Z'),

-- Mandamos muito bem — 🏷 Parceria (4)
('2d28236f-8f69-4aa3-8650-f21db9bce40c', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'went_well', 'Ajuda entre pessoas do time', null, '2026-05-29T12:00:00Z'),
('4e24592f-2dfe-427a-9a92-b1d8a0612b70', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'went_well', 'Proximidade interna', null, '2026-05-29T12:00:00Z'),
('eda1fb94-42e9-406e-acf4-dcbc4c3e12b9', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'went_well', 'Parceria', null, '2026-05-29T12:00:00Z'),
('e08bcdb5-0136-42f7-81f7-f85a4c0072fe', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'went_well', 'A parceria da equipe e a vontade de fazer acontecer', null, '2026-05-29T12:00:00Z'),

-- Mandamos muito bem — sem tema (2)
('6a1b2c3d-0001-4a11-8b11-aa1122334401', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'went_well', 'Autonomia', null, '2026-05-29T12:00:00Z'),
('6a1b2c3d-0002-4a11-8b11-aa1122334402', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'went_well', 'Errar e corrigir rápido', null, '2026-05-29T12:00:00Z'),

-- Precisamos melhorar (12) — 🏷 Relacionamento entre times (3)
('141f6df1-2aac-461a-95bd-a94fe532cb3a', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'to_improve', 'Percepção das áreas de que queremos dificultar a vida deles', null, '2026-05-29T12:00:00Z'),
('db326ff9-20f5-478d-a6d4-8c0a68428977', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'to_improve', 'Mais entrosamento com o time de payments, depois que houve a separação parecem que são duas áreas totalmente apertadas', null, '2026-05-29T12:00:00Z'),
('a45af3e8-2c7b-4d52-b619-ff80279f44f9', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'to_improve', '‘Sinergia’ e alinhamento de prioridades com data', null, '2026-05-29T12:00:00Z'),

-- Precisamos melhorar — 🏷 Protocolo crises (3)
('c2c2af65-2ab0-4b4c-a8e2-26455771a8f1', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'to_improve', 'Playbooks de crise: o que fazer, quando e como', null, '2026-05-29T12:00:00Z'),
('65981345-fff3-4d8e-9b24-abc5f6e8a150', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'to_improve', 'Acionamentos fora do horário comercial durante a semana.', 'Kieslen', '2026-05-29T12:00:00Z'),
('de031a0d-c65c-466d-94b3-8221a77addde', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'to_improve', 'Volume de coisas em paralelo', null, '2026-05-29T12:00:00Z'),

-- Precisamos melhorar — 🏷 Desenvolvimento (2)
('4dc341c1-808d-4a0b-859e-aa6c07b5ab0b', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'to_improve', 'Clareza do que esperam de mim na senioridade que estou.', 'Kieslen', '2026-05-29T12:00:00Z'),
('0a1ec689-b125-40aa-b9ea-2b819a829861', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'to_improve', 'Feedback de desenvolvimento', null, '2026-05-29T12:00:00Z'),

-- Precisamos melhorar — 🏷 Direcional (2)
('b8038e28-75c4-48ca-89f5-b5df6dea4320', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'to_improve', 'Mapa dos nossos produtos e processos como north star', null, '2026-05-29T12:00:00Z'),
('5195154c-b885-4328-bfe9-5ac263b30af3', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'to_improve', 'Clareza do que precisa ser feito logo no começo do ciclo.', 'Kieslen', '2026-05-29T12:00:00Z'),

-- Precisamos melhorar — sem tema (2)
('6a1b2c3d-0003-4a11-8b11-aa1122334403', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'to_improve', 'Trazer mais indicadores para nossas discussões', null, '2026-05-29T12:00:00Z'),
('6a1b2c3d-0004-4a11-8b11-aa1122334404', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'to_improve', 'Acredito que estamos no caminho certo e devido as mudanças, já estamos no foco de melhoria', null, '2026-05-29T12:00:00Z'),

-- Vamos parar (4) — 🏷 Incidentes (2)
('2bc52ee9-d710-4667-b865-556149c173be', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'action_items', 'Pouca visibilidade em momentos de incidente', null, '2026-05-29T12:00:00Z'),
('ba68afcc-e3e9-4504-92fc-62040b8de899', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'action_items', 'Acionamentos de fim de semana e após o horário', null, '2026-05-29T12:00:00Z'),

-- Vamos parar — sem tema (2)
('6a1b2c3d-0005-4a11-8b11-aa1122334405', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'action_items', 'Falando por mim, acredito que não devo continuar fazendo as coisas apenas porque “sempre foi assim”. Ter um pensamento mais crítico e estar aberta a mudanças será essencial para o meu crescimento.', null, '2026-05-29T12:00:00Z'),
('6a1b2c3d-0006-4a11-8b11-aa1122334406', '8bdf0a25-1e61-4c40-8ee8-b7330346b5a5', 'action_items', 'Ter tantas agendas de alinhamento, sinto que nem todas são produtivas', null, '2026-05-29T12:00:00Z')

on conflict (id) do update set
  category = excluded.category,
  content = excluded.content,
  author_name = excluded.author_name;

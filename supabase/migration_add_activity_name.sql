-- Adiciona o campo "Nome da Atividade" (curto), mantendo o campo "title"
-- existente como a descrição longa. Nullable por enquanto — o script de
-- backfill preenche todas as linhas existentes, e só depois travamos como
-- NOT NULL.
alter table activities add column if not exists name text;

-- Vínculo com a Fundação (servidor, terceirizado, convidado).
--
-- As respostas já gravadas vieram antes de a pergunta existir, e nessa altura
-- o sistema era divulgado a quem trabalha na unidade. Marcamos como
-- 'servidor' em vez de inventar um valor neutro: os escores delas incluem a
-- área de estresse ocupacional, que só é perguntada a quem trabalha ali.
ALTER TABLE "Resposta" ADD COLUMN "vinculo" TEXT NOT NULL DEFAULT 'servidor';

CREATE INDEX IF NOT EXISTS "Resposta_vinculo_idx" ON "Resposta"("vinculo");

import { ROTULOS_NIVEL, type Nivel } from "@/lib/avaliacao";

const CLASSES: Record<Nivel, { barra: string; texto: string; fundo: string }> = {
  bom: { barra: "bg-bom", texto: "text-bom", fundo: "bg-bom-fundo" },
  atencao: { barra: "bg-atencao", texto: "text-atencao", fundo: "bg-atencao-fundo" },
  prioridade: {
    barra: "bg-prioridade",
    texto: "text-prioridade",
    fundo: "bg-prioridade-fundo",
  },
};

export function classesDoNivel(nivel: Nivel) {
  return CLASSES[nivel];
}

/**
 * Barra de escore de uma dimensão.
 *
 * A cor é reforço, nunca a única informação: o rótulo do nível vem escrito ao
 * lado e o valor numérico também, para quem não distingue as cores e para quem
 * imprime o resultado em preto e branco.
 */
export function Medidor({
  escore,
  nivel,
  rotulo,
}: {
  escore: number;
  nivel: Nivel;
  rotulo?: string;
}) {
  const classes = CLASSES[nivel];

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className={`font-semibold ${classes.texto}`}>
          {rotulo ?? ROTULOS_NIVEL[nivel]}
        </span>
        <span className="text-texto-suave tabular-nums">{escore}/100</span>
      </div>
      <div
        className={`mt-1.5 h-2.5 overflow-hidden rounded-full ${classes.fundo}`}
        role="img"
        aria-label={`${escore} de 100 — ${ROTULOS_NIVEL[nivel]}`}
      >
        <div
          className={`h-full rounded-full ${classes.barra}`}
          style={{ width: `${Math.max(escore, 2)}%` }}
        />
      </div>
    </div>
  );
}

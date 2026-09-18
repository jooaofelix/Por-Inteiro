/**
 * Símbolo e assinatura do Por Inteiro.
 *
 * O símbolo é vetorial e desenhado em código, não uma imagem: ele aparece em
 * tamanhos muito diferentes (favicon de 16px, cabeçalho, topo do resultado
 * impresso) e precisa continuar nítido em todos, sem peso extra de download.
 *
 * As três cores da marca fazem o mesmo papel do manual: marinho na massa
 * principal, azul-vivo no movimento e azul-claro no respiro. O vão branco
 * entre as formas é traçado explícito, para que o símbolo continue legível
 * sobre fundo claro e sobre fundo marinho.
 */

const MARINHO = "#092957";
const VIVO = "#0088FF";
const CLARO = "#8BCBFA";

export function Simbolo({
  className,
  corDoVao = "#FFFFFF",
}: {
  className?: string;
  /** Cor do vão entre as formas — acompanha o fundo onde a marca é aplicada. */
  corDoVao?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Por Inteiro"
    >
      <defs>
        <clipPath id="marca-circulo">
          <circle cx="50" cy="50" r="49" />
        </clipPath>
      </defs>

      <g clipPath="url(#marca-circulo)">
        {/* Respiro: preenche o disco e sobra como crescente superior direito. */}
        <rect width="100" height="100" fill={CLARO} />

        {/* Movimento: a gota que desce pela direita, curvando para dentro. */}
        <path
          d="M106,30 C 74,44 56,60 56,79 C 56,96 68,106 88,106 L106,106 Z"
          fill={VIVO}
        />
        <path
          d="M106,30 C 74,44 56,60 56,79 C 56,96 68,106 88,106"
          fill="none"
          stroke={corDoVao}
          strokeWidth="4.5"
        />

        {/* Massa principal: a forma marinho que sustenta o conjunto. */}
        <path
          d="M-6,-6 L44,-6 C 58,12 54,32 41,47 C 27,63 27,86 46,106 L-6,106 Z"
          fill={MARINHO}
        />
        <path
          d="M44,-6 C 58,12 54,32 41,47 C 27,63 27,86 46,106"
          fill="none"
          stroke={corDoVao}
          strokeWidth="4.5"
        />
      </g>
    </svg>
  );
}

/** O sorriso da versão alternativa da marca. */
export function Sorriso({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 26" className={className} aria-hidden>
      <path
        d="M6,4 C 20,26 100,26 114,4"
        fill="none"
        stroke={VIVO}
        strokeWidth="11"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Assinatura horizontal: símbolo + logotipo.
 *
 * O logotipo é composto com a tipografia da marca em vez de ser um traçado
 * fixo, para que continue selecionável, pesquisável e lido por leitor de tela.
 */
export function Assinatura({
  className,
  comAssinaturaDeApoio = false,
}: {
  className?: string;
  comAssinaturaDeApoio?: boolean;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <Simbolo className="h-9 w-9 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="font-marca text-xl font-bold tracking-tight text-texto">
          por inteiro
        </span>
        {comAssinaturaDeApoio ? (
          <span className="mt-0.5 text-xs text-texto-suave">
            Um olhar para a saúde de quem cuida.
          </span>
        ) : null}
      </span>
    </span>
  );
}

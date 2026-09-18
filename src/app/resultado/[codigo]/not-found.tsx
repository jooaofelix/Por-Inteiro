import Link from "next/link";

export default function ResultadoNaoEncontrado() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold">Não encontramos esse resultado</h1>
      <p className="mt-3 text-texto-suave">
        O código pode ter sido digitado errado. Ele não usa as letras O, I, L e S nem os
        números 0, 1 e 5, justamente para evitar confusão — vale conferir letra por
        letra.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/acompanhar"
          className="rounded-lg bg-primaria px-6 py-3 text-center font-semibold text-white transition hover:bg-primaria-escura"
        >
          Tentar outro código
        </Link>
        <Link
          href="/questionario"
          className="rounded-lg border border-borda px-6 py-3 text-center font-medium transition hover:border-primaria"
        >
          Responder de novo
        </Link>
      </div>
    </div>
  );
}

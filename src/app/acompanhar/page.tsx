import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { hashCodigo, normalizarCodigo } from "@/lib/codigo";
import { dentroDoLimite, origemAtual } from "@/lib/limite-requisicoes";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Reabrir meu resultado",
};

/** Tentativas de código por origem a cada 10 minutos. */
const MAXIMO_TENTATIVAS = 10;

const MENSAGENS: Record<string, string> = {
  invalido: "Esse código não está no formato certo. Ele é parecido com PI-A2C4-K7M9.",
  naoencontrado:
    "Não encontramos um resultado com esse código. Confira letra por letra — o código não usa as letras O, I, L e S nem os números 0, 1 e 5.",
  limite: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.",
};

export default async function PaginaAcompanhar({
  searchParams,
}: PageProps<"/acompanhar">) {
  const { erro } = await searchParams;
  const mensagem = typeof erro === "string" ? MENSAGENS[erro] : undefined;

  async function buscar(dados: FormData) {
    "use server";

    if (!dentroDoLimite(`codigo:${await origemAtual()}`, MAXIMO_TENTATIVAS)) {
      redirect("/acompanhar?erro=limite");
    }

    const codigo = normalizarCodigo(String(dados.get("codigo") ?? ""));
    if (!codigo) redirect("/acompanhar?erro=invalido");

    const existe = await prisma.resposta.findUnique({
      where: { codigoHash: hashCodigo(codigo) },
      select: { id: true },
    });
    if (!existe) redirect("/acompanhar?erro=naoencontrado");

    redirect(`/resultado/${codigo}`);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-bold">Reabrir meu resultado</h1>
      <p className="mt-3 text-texto-suave">
        Digite o código que apareceu quando você terminou o questionário. Ele é a única
        forma de chegar ao seu resultado — não está ligado ao seu nome e não pedimos
        mais nada.
      </p>

      <form action={buscar} className="mt-8">
        <label htmlFor="codigo" className="block font-medium">
          Seu código
        </label>
        <input
          id="codigo"
          name="codigo"
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="PI-A2C4-K7M9"
          className="mt-2 w-full rounded-lg border border-borda bg-cartao px-4 py-3 font-mono text-lg tracking-widest"
        />

        {mensagem ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-prioridade bg-prioridade-fundo p-3 text-sm text-prioridade"
          >
            {mensagem}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-5 w-full rounded-lg bg-primaria px-6 py-3 font-semibold text-white transition hover:bg-primaria-escura"
        >
          Ver meu resultado
        </button>
      </form>

      <div className="mt-10 rounded-xl border border-borda bg-suave p-4 text-sm text-texto-suave">
        <p className="font-medium text-texto">Perdeu o código?</p>
        <p className="mt-1">
          Não há como recuperar: como não guardamos nome nem e-mail, não existe nada
          que ligue você àquela resposta. É o preço do anonimato de verdade — e ele
          vale a pena. Você pode responder de novo quando quiser.
        </p>
      </div>
    </div>
  );
}

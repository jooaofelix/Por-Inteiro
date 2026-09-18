import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { adminConfigurado, sessaoAtiva } from "@/lib/admin";

import { entrar } from "../acoes";

export const metadata: Metadata = {
  title: "Acesso da gestão",
};

const MENSAGENS: Record<string, string> = {
  senha: "Senha incorreta.",
  limite: "Muitas tentativas seguidas. Espere alguns minutos.",
  indisponivel:
    "O acesso da gestão ainda não foi configurado neste servidor (falta a variável ADMIN_SENHA).",
};

export default async function PaginaLogin({ searchParams }: PageProps<"/admin/login">) {
  if (await sessaoAtiva()) redirect("/admin");

  const { erro } = await searchParams;
  const mensagem = typeof erro === "string" ? MENSAGENS[erro] : undefined;

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">Acesso da gestão</h1>
      <p className="mt-2 text-sm text-texto-suave">
        Este painel mostra somente dados agregados. Não existe tela que abra a resposta
        de uma pessoa.
      </p>

      <form action={entrar} className="mt-8">
        <label htmlFor="senha" className="block font-medium">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          autoComplete="current-password"
          className="mt-2 w-full rounded-lg border border-borda bg-cartao px-4 py-3"
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
          disabled={!adminConfigurado()}
          className="mt-5 w-full rounded-lg bg-primaria px-6 py-3 font-semibold text-white transition hover:bg-primaria-escura disabled:opacity-60"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}

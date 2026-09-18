"use server";

import { redirect } from "next/navigation";

import { abrirSessao, adminConfigurado, fecharSessao, senhaCorreta } from "@/lib/admin";
import { dentroDoLimite, origemAtual } from "@/lib/limite-requisicoes";

/** Tentativas de senha por origem a cada 10 minutos. */
const MAXIMO_TENTATIVAS = 8;

export async function entrar(dados: FormData): Promise<void> {
  if (!adminConfigurado()) redirect("/admin/login?erro=indisponivel");

  if (!dentroDoLimite(`admin:${await origemAtual()}`, MAXIMO_TENTATIVAS)) {
    redirect("/admin/login?erro=limite");
  }

  if (!senhaCorreta(String(dados.get("senha") ?? ""))) {
    redirect("/admin/login?erro=senha");
  }

  await abrirSessao();
  redirect("/admin");
}

export async function sair(): Promise<void> {
  await fecharSessao();
  redirect("/admin/login");
}

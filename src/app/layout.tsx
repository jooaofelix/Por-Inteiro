import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Nunito, Quicksand } from "next/font/google";

import { Assinatura } from "@/components/Marca";

import "./globals.css";

/* Tipografia geométrica e arredondada, conforme o manual da marca. */
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });
const quicksand = Quicksand({ variable: "--font-quicksand", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Por Inteiro — um olhar para a saúde de quem cuida",
    template: "%s · Por Inteiro",
  },
  description:
    "Autodiagnóstico de saúde anônimo para profissionais da Fundação CASA, com orientações práticas e rede de apoio na sua região.",
  // O conteúdo é de uso interno e sempre associado a dados de saúde: nada aqui
  // deve ser indexado por buscador.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#092957",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${nunito.variable} ${quicksand.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <header className="sem-impressao border-b border-borda bg-cartao">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" aria-label="Por Inteiro — início">
              <Assinatura />
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/acompanhar" className="text-texto-suave hover:text-acento-texto">
                Já tenho um código
              </Link>
              <Link href="/privacidade" className="text-texto-suave hover:text-acento-texto">
                Privacidade
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="sem-impressao border-t border-borda bg-cartao">
          <div className="mx-auto max-w-5xl space-y-3 px-4 py-6 text-sm text-texto-suave">
            <p className="font-semibold text-texto">
              Se você está em sofrimento agora, ligue 188 (CVV). É gratuito, sigiloso e
              funciona 24 horas. Em emergência, ligue 192 (SAMU).
            </p>
            <p>
              O Por Inteiro é uma ferramenta de autocuidado e encaminhamento. Não faz
              diagnóstico nem substitui atendimento profissional.
            </p>
            <p className="pt-2">
              <Link href="/admin" className="hover:text-acento-texto">
                Acesso da gestão
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

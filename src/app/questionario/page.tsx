import type { Metadata } from "next";

import { Formulario } from "./formulario";

export const metadata: Metadata = {
  title: "Questionário",
};

export default function PaginaQuestionario() {
  return <Formulario />;
}

import { z } from "zod";

/** Validação do registro de uma contribuição (declaração de intenção de presente). */
export const ContribuicaoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Diga seu nome, por favor.")
    .max(120, "Nome muito longo."),
  experiencia: z.string().trim().min(2).max(120),
  valor: z
    .number({ invalid_type_error: "Informe um valor." })
    .positive("O valor precisa ser maior que zero.")
    .max(1_000_000, "Valor acima do permitido."),
  metodo: z.enum(["pix", "cartao"]),
  mensagem: z.string().trim().max(500, "Mensagem muito longa.").optional().or(z.literal("")),
});

export type ContribuicaoInput = z.infer<typeof ContribuicaoSchema>;

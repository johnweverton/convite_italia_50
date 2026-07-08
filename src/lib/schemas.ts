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

/** Validação da criação de um convite (convidado principal + vagas extras). */
export const ConviteSchema = z.object({
  nome_principal: z
    .string()
    .trim()
    .min(2, "Diga o nome do convidado.")
    .max(120, "Nome muito longo."),
  email: z.string().trim().email("E-mail inválido."),
  vagas_extras: z
    .number({ invalid_type_error: "Informe o número de vagas extras." })
    .int()
    .min(0)
    .max(5, "No máximo 5 vagas extras."),
});

export type ConviteInput = z.infer<typeof ConviteSchema>;

/** Validação da confirmação de acompanhantes feita pelo próprio convidado. */
export const ConfirmacaoSchema = z.object({
  acompanhantes: z
    .array(
      z
        .string()
        .trim()
        .min(2, "Nome muito curto.")
        .max(120, "Nome muito longo."),
    )
    .max(5, "No máximo 5 acompanhantes."),
});

export type ConfirmacaoInput = z.infer<typeof ConfirmacaoSchema>;

import { Resend } from "resend";
import { gerarPdfIngresso } from "@/lib/pdf-ingresso";

/** Client Resend. Só deve ser usado server-side (rotas de API). */
function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("E-mail não configurado: defina RESEND_API_KEY.");
  }
  return new Resend(apiKey);
}

function getRemetente(): string {
  return process.env.EMAIL_FROM ?? "Carmem Cavalcante <onboarding@resend.dev>";
}

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

type Ingresso = {
  nome: string;
  token: string;
  tipo?: "principal" | "acompanhante";
};

/** Gera o PDF do ingresso e retorna o objeto de anexo para o Resend. */
async function pdfDoIngresso(
  ingresso: Ingresso & { tipo: "principal" | "acompanhante" },
) {
  const buffer = await gerarPdfIngresso({
    nome: ingresso.nome,
    token: ingresso.token,
    tipo: ingresso.tipo,
  });
  const primeiroNome = ingresso.nome.split(" ")[0].toLowerCase();
  return {
    filename: `ingresso-${primeiroNome}.pdf`,
    content: buffer.toString("base64"),
    content_type: "application/pdf",
  };
}

/** URL da logo para uso nos e-mails. */
function getLogoUrl(): string {
  return `${getSiteUrl()}/cenas/logo-carmem.png`;
}

/** 
 * Template base do e-mail focado em UI/UX premium.
 * Fundo em creme suave, texto em sépia escuro (mesma cor da assinatura).
 */
function layoutEmail(corpo: string): string {
  const logoUrl = getLogoUrl();
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <style>
    :root { color-scheme: light only; }
    body { margin: 0; padding: 0; background-color: #fbf7ef; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #fbf7ef; -webkit-text-size-adjust: 100%;">
  <div style="font-family:'Georgia', serif; max-width: 520px; margin: 0 auto; background-color: #fbf7ef; color: #3d2f1f; overflow: hidden; padding-bottom: 40px;">
    
    <!-- Cabeçalho -->
    <div style="padding: 40px 32px 20px; text-align: center;">
      <img src="${logoUrl}" alt="Carmem Cavalcante - Festa di 50 Anni" style="max-width: 280px; height: auto; margin: 0 auto;" />
    </div>

    <!-- Corpo -->
    <div style="padding: 0 40px;">
      ${corpo}
    </div>

    <!-- Rodapé Minimalista -->
    <div style="margin-top: 40px; padding: 20px 40px 0; text-align: center; border-top: 1px solid rgba(61, 47, 31, 0.1);">
      <p style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: rgba(61, 47, 31, 0.5); letter-spacing: 0.05em; text-transform: uppercase;">
        Convite individual e intransferível
      </p>
    </div>

  </div>
</body>
</html>`;
}

/**
 * E-mail enviado ao convidado principal assim que a Carmem cria o convite.
 */
export async function enviarEmailConvite(params: {
  para: string;
  ingressoPrincipal: Ingresso;
  vagasExtras: number;
  tokenConvite: string;
}) {
  const { para, ingressoPrincipal, vagasExtras, tokenConvite } = params;
  const resend = getResendClient();
  const anexo = await pdfDoIngresso({
    ...ingressoPrincipal,
    tipo: "principal",
  });
  
  const linkConfirmacao = `${getSiteUrl()}/confirmar/${tokenConvite}`;
  const primeiroNome = ingressoPrincipal.nome.split(" ")[0];

  const blocoAcompanhante =
    vagasExtras > 0
      ? `
        <div style="margin-top: 40px; text-align: center;">
          <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; margin: 0 0 16px;">
            Este convite concede o direito a <strong>1 acompanhante</strong>.<br/>
            Para emitir o ingresso adicional, por favor, informe o nome.
          </p>
          <a href="${linkConfirmacao}" style="display: inline-block; background-color: #3d2f1f; color: #fbf7ef; padding: 14px 32px; border-radius: 2px; text-decoration: none; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;">
            Adicionar Acompanhante
          </a>
        </div>
      `
      : "";

  const corpo = `
    <h2 style="font-size: 18px; text-align: center; margin: 0 0 24px; font-weight: normal; font-style: italic;">
      Caro(a) ${primeiroNome},
    </h2>
    <p style="font-size: 15px; text-align: center; line-height: 1.6; margin: 0 0 16px;">
      Temos o prazer de confirmar sua presença na comemoração dos 50 anos de Carmem.
    </p>
    <p style="font-size: 15px; text-align: center; line-height: 1.6; margin: 0 0 24px;">
      Seu ingresso encontra-se em anexo a este e-mail. Solicitamos a gentileza de apresentá-lo na recepção do evento.
    </p>
    ${blocoAcompanhante}
  `;

  return resend.emails.send({
    from: getRemetente(),
    to: para,
    subject: "Seu convite - 50 anos da Carmem Cavalcante",
    html: layoutEmail(corpo),
    attachments: [anexo],
  });
}

/**
 * E-mail enviado após o convidado principal informar o acompanhante.
 */
export async function enviarEmailAcompanhantes(params: {
  para: string;
  nomePrincipal: string;
  ingressos: Ingresso[];
}) {
  const { para, nomePrincipal, ingressos } = params;
  const resend = getResendClient();

  const anexos = await Promise.all(
    ingressos.map((ingresso, i) =>
      pdfDoIngresso({
        ...ingresso,
        tipo: i === 0 ? "principal" : "acompanhante",
      }),
    ),
  );

  const acompanhante = ingressos.find((_, i) => i > 0);
  const nomeAcompanhante = acompanhante ? acompanhante.nome : "seu acompanhante";
  const primeiroNome = nomePrincipal.split(" ")[0];

  const corpo = `
    <h2 style="font-size: 18px; text-align: center; margin: 0 0 24px; font-weight: normal; font-style: italic;">
      Obrigado, ${primeiroNome}.
    </h2>
    <p style="font-size: 15px; text-align: center; line-height: 1.6; margin: 0 0 16px;">
      O ingresso do seu acompanhante, <strong>${nomeAcompanhante}</strong>, foi gerado com sucesso e encontra-se em anexo.
    </p>
    <p style="font-size: 15px; text-align: center; line-height: 1.6; margin: 0;">
      Lembramos que cada ingresso é individual. Pedimos que o arquivo respectivo seja encaminhado para apresentação na entrada.
    </p>
  `;

  return resend.emails.send({
    from: getRemetente(),
    to: para,
    subject: "Ingresso do acompanhante - 50 anos da Carmem Cavalcante",
    html: layoutEmail(corpo),
    attachments: anexos,
  });
}

/**
 * Reenvia o(s) ingresso(s) já emitidos para um novo e-mail, usado quando o e-mail
 * cadastrado do convidado é alterado no painel (ex.: caixa de entrada comprometida).
 * Mantém os mesmos tokens/QR já emitidos — só muda o destinatário.
 */
export async function enviarEmailReenvioIngressos(params: {
  para: string;
  nomePrincipal: string;
  ingressos: Ingresso[];
}) {
  const { para, nomePrincipal, ingressos } = params;
  const resend = getResendClient();

  const anexos = await Promise.all(
    ingressos.map((ingresso, i) =>
      pdfDoIngresso({
        ...ingresso,
        tipo: ingresso.tipo ?? (i === 0 ? "principal" : "acompanhante"),
      }),
    ),
  );

  const primeiroNome = nomePrincipal.split(" ")[0];
  const temMaisDeUm = ingressos.length > 1;

  const corpo = `
    <h2 style="font-size: 18px; text-align: center; margin: 0 0 24px; font-weight: normal; font-style: italic;">
      Olá, ${primeiroNome}.
    </h2>
    <p style="font-size: 15px; text-align: center; line-height: 1.6; margin: 0 0 16px;">
      A pedido, atualizamos o e-mail cadastrado do seu convite e reenviamos ${
        temMaisDeUm ? "seus ingressos" : "seu ingresso"
      } para este novo endereço.
    </p>
    <p style="font-size: 15px; text-align: center; line-height: 1.6; margin: 0 0 24px;">
      ${temMaisDeUm ? "Os ingressos encontram-se" : "Seu ingresso encontra-se"} em anexo. Solicitamos a gentileza de apresentá-lo(s) na recepção do evento.
    </p>
  `;

  return resend.emails.send({
    from: getRemetente(),
    to: para,
    subject: "Seu(s) ingresso(s) reenviado(s) - 50 anos da Carmem Cavalcante",
    html: layoutEmail(corpo),
    attachments: anexos,
  });
}

/**
 * E-mail enviado após RSVP público.
 */
export async function enviarEmailRsvpPublico(params: {
  para: string;
  nomePrincipal: string;
  ingressos: Ingresso[];
}) {
  const { para, nomePrincipal, ingressos } = params;
  const resend = getResendClient();

  const anexos = await Promise.all(
    ingressos.map((ingresso, i) =>
      pdfDoIngresso({
        ...ingresso,
        tipo: i === 0 ? "principal" : "acompanhante",
      }),
    ),
  );

  const primeiroNome = nomePrincipal.split(" ")[0];
  const temAcompanhante = ingressos.length > 1;

  const textoAcompanhante = temAcompanhante
    ? "Os ingressos - para você e seu acompanhante - encontram-se em anexo."
    : "Seu ingresso encontra-se em anexo.";

  const corpo = `
    <h2 style="font-size: 18px; text-align: center; margin: 0 0 24px; font-weight: normal; font-style: italic;">
      Obrigado por confirmar, ${primeiroNome}.
    </h2>
    <p style="font-size: 15px; text-align: center; line-height: 1.6; margin: 0 0 16px;">
      Sua presença na festa foi devidamente registrada.
    </p>
    <p style="font-size: 15px; text-align: center; line-height: 1.6; margin: 0 0 24px;">
      ${textoAcompanhante} Solicitamos a gentileza de apresentá-los na recepção do evento.
    </p>
  `;

  return resend.emails.send({
    from: getRemetente(),
    to: para,
    subject: "Presença Confirmada - 50 anos da Carmem Cavalcante",
    html: layoutEmail(corpo),
    attachments: anexos,
  });
}

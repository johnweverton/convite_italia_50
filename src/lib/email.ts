import { Resend } from "resend";
import { gerarQrBuffer } from "@/lib/tickets";

/** Client Resend. Só deve ser usado server-side (rotas de API). */
function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("E-mail não configurado: defina RESEND_API_KEY.");
  }
  return new Resend(apiKey);
}

function getRemetente(): string {
  return process.env.EMAIL_FROM ?? "Carmem na Itália <onboarding@resend.dev>";
}

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

type Ingresso = {
  nome: string;
  token: string;
};

async function anexoDoIngresso(ingresso: Ingresso, contentId: string) {
  const buffer = await gerarQrBuffer(ingresso.token);
  return {
    filename: `ingresso-${ingresso.nome.split(" ")[0].toLowerCase()}.png`,
    content: buffer.toString("base64"),
    content_id: contentId,
  };
}

function blocoIngresso(nome: string, contentId: string) {
  return `
    <div style="margin:24px 0;padding:20px;border:1px solid #e2d9c8;border-radius:4px;text-align:center;">
      <p style="margin:0 0 12px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#8a6d3b;">Ingresso nominal</p>
      <img src="cid:${contentId}" alt="QR code de ${nome}" width="220" height="220" style="display:block;margin:0 auto;" />
      <p style="margin:16px 0 0;font-size:18px;color:#3d2f1f;">${nome}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#8a7a63;">Intransferível — apresente este QR code na entrada.</p>
    </div>
  `;
}

/**
 * E-mail enviado ao convidado principal assim que a Carmem cria o convite.
 * Contém o ingresso dele e, se houver vagas extras, o link para informar acompanhantes.
 */
export async function enviarEmailConvite(params: {
  para: string;
  ingressoPrincipal: Ingresso;
  vagasExtras: number;
  tokenConvite: string;
}) {
  const { para, ingressoPrincipal, vagasExtras, tokenConvite } = params;
  const resend = getResendClient();
  const anexo = await anexoDoIngresso(ingressoPrincipal, "ingresso-principal");
  const linkConfirmacao = `${getSiteUrl()}/confirmar/${tokenConvite}`;

  const blocoAcompanhantes =
    vagasExtras > 0
      ? `
        <p style="margin:24px 0 0;font-size:15px;color:#3d2f1f;">
          Você pode levar até <strong>${vagasExtras}</strong> pessoa${vagasExtras > 1 ? "s" : ""} com você.
          Informe os nomes para gerarmos o ingresso de cada uma:
        </p>
        <p style="text-align:center;margin:16px 0;">
          <a href="${linkConfirmacao}" style="display:inline-block;background:#b5652f;color:#fdf8f0;padding:12px 28px;border-radius:4px;text-decoration:none;font-size:14px;letter-spacing:0.05em;text-transform:uppercase;">
            Informar acompanhantes
          </a>
        </p>
      `
      : "";

  return resend.emails.send({
    from: getRemetente(),
    to: para,
    subject: "Seu ingresso — Carmem na Itália 2026",
    html: `
      <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#3d2f1f;">
        <h1 style="font-size:22px;text-align:center;">Você está convidado(a)!</h1>
        ${blocoIngresso(ingressoPrincipal.nome, "ingresso-principal")}
        ${blocoAcompanhantes}
      </div>
    `,
    attachments: [anexo],
  });
}

/**
 * E-mail enviado após o convidado principal informar os acompanhantes,
 * com um ingresso individual para cada um.
 */
export async function enviarEmailAcompanhantes(params: {
  para: string;
  nomePrincipal: string;
  ingressos: Ingresso[];
}) {
  const { para, nomePrincipal, ingressos } = params;
  const resend = getResendClient();

  const anexos = await Promise.all(
    ingressos.map((ingresso, i) => anexoDoIngresso(ingresso, `ingresso-${i}`)),
  );
  const blocos = ingressos
    .map((ingresso, i) => blocoIngresso(ingresso.nome, `ingresso-${i}`))
    .join("");

  return resend.emails.send({
    from: getRemetente(),
    to: para,
    subject: "Ingressos dos acompanhantes — Carmem na Itália 2026",
    html: `
      <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#3d2f1f;">
        <h1 style="font-size:22px;text-align:center;">Prontinho, ${nomePrincipal.split(" ")[0]}!</h1>
        <p style="text-align:center;font-size:15px;">
          Seguem os ingressos de quem vai com você. Cada QR code é individual e intransferível —
          o ideal é encaminhar cada um para a respectiva pessoa apresentar na entrada.
        </p>
        ${blocos}
      </div>
    `,
    attachments: anexos,
  });
}

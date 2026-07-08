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
  return process.env.EMAIL_FROM ?? "Carmem - 50 ANOS <onboarding@resend.dev>";
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

/** Template base do e-mail com o layout geral da festa. */
function layoutEmail(titulo: string, corpo: string): string {
  const logoUrl = getLogoUrl();
  return `
    <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#fdf8f0;border:1px solid #e2d9c8;border-radius:6px;overflow:hidden;">
      <!-- Cabeçalho com logo -->
      <div style="background:#8A4C14;padding:28px 32px;text-align:center;">
        <img src="${logoUrl}" alt="Carmem Cavalcante - Festa di 50 Anni" style="max-width:280px;height:auto;margin:0 auto;" />
      </div>
      <!-- Corpo -->
      <div style="padding:32px;">
        <h2 style="font-size:20px;text-align:center;color:#3d2f1f;margin:0 0 8px;">
          ${titulo}
        </h2>
        ${corpo}
      </div>
      <!-- Rodapé -->
      <div style="border-top:1px solid #e2d9c8;padding:16px 32px;text-align:center;background:#fdf8f0;">
        <p style="margin:0;font-size:11px;color:#8a7a63;">
          Este e-mail foi enviado pelo sistema de convites.<br/>
          Cada ingresso é individual, nominal e intransferivel.
        </p>
      </div>
    </div>
  `;
}

/**
 * E-mail enviado ao convidado principal assim que a Carmem cria o convite.
 * Contém o ingresso dele em PDF e, se houver vagas extras, o link para informar acompanhantes.
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

  const blocoAcompanhantes =
    vagasExtras > 0
      ? `
        <p style="margin:24px 0 0;font-size:15px;color:#3d2f1f;text-align:center;">
          Voce pode trazer ate <strong>${vagasExtras}</strong> pessoa${vagasExtras > 1 ? "s" : ""} com voce.<br/>
          Clique no botao abaixo para informar os nomes e gerar os ingressos:
        </p>
        <p style="text-align:center;margin:16px 0 0;">
          <a href="${linkConfirmacao}" style="display:inline-block;background:#8A4C14;color:#fdf8f0;padding:12px 28px;border-radius:4px;text-decoration:none;font-size:14px;letter-spacing:0.05em;text-transform:uppercase;">
            Informar acompanhantes
          </a>
        </p>
      `
      : "";

  const corpo = `
    <p style="text-align:center;font-size:15px;color:#3d2f1f;margin:0 0 20px;">
      Seu ingresso esta em anexo neste e-mail (PDF).<br/>
      Apresente na entrada da festa.
    </p>
    ${blocoAcompanhantes}
  `;

  return resend.emails.send({
    from: getRemetente(),
    to: para,
    subject: "Seu ingresso para a festa da Carmem!",
    html: layoutEmail(`Voce esta convidado(a)!`, corpo),
    attachments: [anexo],
  });
}

/**
 * E-mail enviado após o convidado principal informar os acompanhantes,
 * com um PDF de ingresso individual para cada um.
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

  const listaIngressos = ingressos
    .map(
      (ing, i) => `
      <div style="background:#fdf3e7;border:1px solid #e2d9c8;border-radius:4px;padding:12px 16px;margin:8px 0;display:flex;align-items:center;">
        <span style="font-size:18px;margin-right:10px;">📄</span>
        <div>
          <p style="margin:0;font-size:14px;font-weight:bold;color:#3d2f1f;">${ing.nome}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#8a7a63;">${i === 0 ? "Titular" : "Acompanhante"} (ingresso em PDF em anexo)</p>
        </div>
      </div>
    `,
    )
    .join("");

  const corpo = `
    <p style="text-align:center;font-size:15px;color:#3d2f1f;line-height:1.6;margin:0 0 20px;">
      Aqui estao os ingressos de quem vai com voce.<br/>
      Cada PDF e individual. Encaminhe para a pessoa certa apresentar na entrada.
    </p>
    ${listaIngressos}
  `;

  return resend.emails.send({
    from: getRemetente(),
    to: para,
    subject: "Ingressos dos acompanhantes - Festa da Carmem",
    html: layoutEmail(
      `Tudo certo, ${nomePrincipal.split(" ")[0]}!`,
      corpo,
    ),
    attachments: anexos,
  });
}

/**
 * E-mail único enviado após a pessoa preencher o formulário público de RSVP (se for comparecer).
 * Cada ingresso (titular + acompanhantes) vem como um PDF separado em anexo.
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

  const listaIngressos = ingressos
    .map(
      (ing, i) => `
      <div style="background:#fdf3e7;border:1px solid #e2d9c8;border-radius:4px;padding:12px 16px;margin:8px 0;">
        <p style="margin:0;font-size:14px;font-weight:bold;color:#3d2f1f;">📄 ${ing.nome}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#8a7a63;">
          ${i === 0 ? "Titular" : "Acompanhante"} (ingresso individual em PDF)
        </p>
        <p style="margin:4px 0 0;font-size:12px;color:#8a7a63;">
          ${i > 0 ? "Encaminhe este PDF para a pessoa." : "Guarde este PDF e apresente na entrada."}
        </p>
      </div>
    `,
    )
    .join("");

  const textoIntro =
    ingressos.length > 1
      ? `Aqui estao os seus ingressos e os de quem vai com voce.<br/>
         Cada PDF e individual. Encaminhe cada um para a pessoa certa apresentar na entrada.`
      : `Seu ingresso esta em anexo.<br/>
         Apresente o PDF na entrada da festa.`;

  const corpo = `
    <p style="text-align:center;font-size:15px;color:#3d2f1f;line-height:1.6;margin:0 0 20px;">
      ${textoIntro}
    </p>
    ${listaIngressos}
    <p style="text-align:center;margin:24px 0 0;font-size:13px;color:#8a7a63;">
      Nos vemos na festa! ✨
    </p>
  `;

  return resend.emails.send({
    from: getRemetente(),
    to: para,
    subject: "Presenca confirmada! Festa da Carmem",
    html: layoutEmail(
      `Que bom, ${nomePrincipal.split(" ")[0]}! 🎉`,
      corpo,
    ),
    attachments: anexos,
  });
}

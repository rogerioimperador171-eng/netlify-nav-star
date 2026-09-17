/**
 * Cliente ProPixBR usado pelas Netlify Functions.
 * Roda apenas no servidor: as credenciais ficam nas variáveis de ambiente.
 */
const BASE_URL = process.env.PROPAY_BASE_URL || "https://api.propixbr.com";
const TIMEOUT_MS = 20000;

export const json = (body: unknown, status = 200) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const sanitizeDocument = (value: string) => value.replace(/\D/g, "");

type ApiResult = { ok: true; data: Record<string, unknown> } | { ok: false; status: number; message: string };

async function callApi(path: string, payload: unknown): Promise<ApiResult> {
  const clientId = process.env.PROPAY_CLIENT_ID;
  const clientSecret = process.env.PROPAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return {
      ok: false,
      status: 503,
      message: "Pagamento indisponível: configure PROPAY_CLIENT_ID e PROPAY_CLIENT_SECRET.",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    if (!response.ok) {
      const message =
        (typeof data.message === "string" && data.message) ||
        (typeof data.error === "string" && data.error) ||
        "Não foi possível falar com o provedor de pagamento.";
      return { ok: false, status: response.status >= 500 ? 502 : 400, message };
    }
    return { ok: true, data };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      status: aborted ? 504 : 502,
      message: aborted
        ? "O provedor de pagamento demorou para responder. Tente novamente."
        : "Falha de conexão com o provedor de pagamento. Tente novamente.",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function createPix(input: {
  amount: number;
  description: string;
  payerName: string;
  payerDocument: string;
}) {
  const result = await callApi("/api/v1/deposit", {
    amount: Number(input.amount.toFixed(2)),
    description: input.description,
    payerName: input.payerName,
    payerDocument: sanitizeDocument(input.payerDocument),
  });
  if (!result.ok) return result;

  const data = result.data;
  const transactionId = typeof data.transactionId === "string" ? data.transactionId : "";
  const copyPaste = typeof data.copyPaste === "string" ? data.copyPaste : "";
  const qrcodeUrl = typeof data.qrcodeUrl === "string" ? data.qrcodeUrl : "";
  if (!transactionId || !copyPaste) {
    return { ok: false as const, status: 502, message: "O provedor não retornou o código PIX. Tente novamente." };
  }

  return {
    ok: true as const,
    data: {
      transactionId,
      copyPaste,
      qrcodeUrl:
        qrcodeUrl ||
        `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(copyPaste)}`,
      status: typeof data.status === "string" ? data.status : "PENDENTE",
    },
  };
}

export async function checkPix(transactionId: string) {
  const result = await callApi("/api/v1/check", { transactionId });
  if (!result.ok) return result;

  const transaction = (result.data.transaction ?? result.data) as Record<string, unknown>;
  const state =
    (typeof transaction.transactionState === "string" && transaction.transactionState) ||
    (typeof transaction.status === "string" && transaction.status) ||
    "PENDENTE";
  const normalized = state.toUpperCase();

  return {
    ok: true as const,
    data: {
      transactionId,
      transactionState: normalized,
      paid: ["COMPLETO", "COMPLETED", "PAID", "PAGO"].includes(normalized),
    },
  };
}

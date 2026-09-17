/**
 * Integração com a API ProPixBR (https://api.propixbr.com).
 * Este arquivo só roda no servidor — as credenciais nunca chegam ao navegador.
 */

const BASE_URL = process.env["PROPAY_BASE_URL"] ?? "https://api.propixbr.com";
const TIMEOUT_MS = 20000;

export type CreatePixInput = {
  amount: number;
  description: string;
  payerName: string;
  payerDocument: string;
};

export type CreatePixResult = {
  transactionId: string;
  copyPaste: string;
  qrcodeUrl: string;
  status: string;
};

export type CheckPixResult = {
  transactionId: string;
  transactionState: string;
  paid: boolean;
};

export class PropayError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "PropayError";
    this.status = status;
  }
}

function credentials() {
  const clientId = process.env["PROPAY_CLIENT_ID"];
  const clientSecret = process.env["PROPAY_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    throw new PropayError(
      "Pagamento indisponível no momento. Configure as credenciais PROPAY_CLIENT_ID e PROPAY_CLIENT_SECRET.",
      503,
    );
  }
  return { clientId, clientSecret };
}

async function callApi(path: string, body: unknown): Promise<Record<string, unknown>> {
  const { clientId, clientSecret } = credentials();
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
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    let payload: Record<string, unknown> = {};
    try {
      payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      payload = {};
    }

    if (!response.ok) {
      const message =
        (typeof payload["message"] === "string" && payload["message"]) ||
        (typeof payload["error"] === "string" && payload["error"]) ||
        "Não foi possível falar com o provedor de pagamento.";
      throw new PropayError(message, response.status >= 500 ? 502 : 400);
    }

    return payload;
  } catch (error) {
    if (error instanceof PropayError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new PropayError("O provedor de pagamento demorou para responder. Tente novamente.", 504);
    }
    throw new PropayError("Falha de conexão com o provedor de pagamento. Tente novamente.", 502);
  } finally {
    clearTimeout(timer);
  }
}

export function sanitizeDocument(value: string): string {
  return value.replace(/\D/g, "");
}

export async function createPix(input: CreatePixInput): Promise<CreatePixResult> {
  const payload = await callApi("/api/v1/deposit", {
    amount: Number(input.amount.toFixed(2)),
    description: input.description,
    payerName: input.payerName,
    payerDocument: sanitizeDocument(input.payerDocument),
  });

  const transactionId = typeof payload["transactionId"] === "string" ? payload["transactionId"] : "";
  const copyPaste = typeof payload["copyPaste"] === "string" ? payload["copyPaste"] : "";
  const qrcodeUrl = typeof payload["qrcodeUrl"] === "string" ? payload["qrcodeUrl"] : "";

  if (!transactionId || !copyPaste) {
    throw new PropayError("O provedor não retornou o código PIX. Tente novamente.", 502);
  }

  return {
    transactionId,
    copyPaste,
    qrcodeUrl: qrcodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(copyPaste)}`,
    status: typeof payload["status"] === "string" ? payload["status"] : "PENDENTE",
  };
}

export async function checkPix(transactionId: string): Promise<CheckPixResult> {
  const payload = await callApi("/api/v1/check", { transactionId });
  const transaction = (payload["transaction"] ?? payload) as Record<string, unknown>;
  const state =
    (typeof transaction["transactionState"] === "string" && transaction["transactionState"]) ||
    (typeof transaction["status"] === "string" && transaction["status"]) ||
    "PENDENTE";
  const normalized = state.toUpperCase();

  return {
    transactionId,
    transactionState: normalized,
    paid: normalized === "COMPLETO" || normalized === "COMPLETED" || normalized === "PAID" || normalized === "PAGO",
  };
}

import { buildFallbackPix } from "./pix-fallback";
import { createPix, json, sanitizeDocument } from "./propay";

export const handler = async (event: { httpMethod: string; body?: string | null }) => {
  if (event.httpMethod !== "POST") return json({ error: "Método não permitido." }, 405);

  let amount = 0;
  try {
    const body = JSON.parse(event.body || "{}") as Record<string, unknown>;
    amount = Number(body.amount);
    const description = String(body.description ?? "Pedido MiniKo");
    const payerName = String(body.payerName ?? "").trim();
    const payerDocument = sanitizeDocument(String(body.payerDocument ?? ""));

    if (!Number.isFinite(amount) || amount <= 0) return json({ error: "Valor do pedido inválido." }, 400);
    if (payerName.length < 3) return json({ error: "Informe seu nome completo." }, 400);
    if (payerDocument.length !== 11 && payerDocument.length !== 14) {
      return json({ error: "Informe um CPF válido (11 dígitos)." }, 400);
    }

    const result = await createPix({ amount, description, payerName, payerDocument });
    if (result.ok) return json(result.data);

    // API sem credenciais, fora do ar ou lenta: entrega um PIX estático
    console.warn("ProPixBR indisponível, usando PIX de fallback:", result.message);
    return json(buildFallbackPix(amount, process.env.PROPAY_PIX_FALLBACK_KEY));
  } catch (error) {
    console.error(error);
    if (Number.isFinite(amount) && amount > 0) {
      return json(buildFallbackPix(amount, process.env.PROPAY_PIX_FALLBACK_KEY));
    }
    return json({ error: "Não foi possível gerar o PIX. Tente novamente." }, 400);
  }
};

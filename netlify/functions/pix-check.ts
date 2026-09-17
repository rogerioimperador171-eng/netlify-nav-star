import { isFallbackTransaction } from "./pix-fallback";
import { checkPix, json } from "./propay";

export const handler = async (event: { httpMethod: string; body?: string | null }) => {
  if (event.httpMethod !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const body = JSON.parse(event.body || "{}") as Record<string, unknown>;
    const transactionId = String(body.transactionId ?? "").trim();
    if (!transactionId) return json({ error: "transactionId é obrigatório." }, 400);

    if (isFallbackTransaction(transactionId)) {
      return json({ transactionId, transactionState: "PENDENTE", paid: false, fallback: true });
    }

    const result = await checkPix(transactionId);
    if (!result.ok) {
      // nunca derruba o checkout: segue como pendente e o polling tenta de novo
      return json({ transactionId, transactionState: "PENDENTE", paid: false });
    }
    return json(result.data);
  } catch (error) {
    console.error(error);
    return json({ transactionId: "", transactionState: "PENDENTE", paid: false });
  }
};

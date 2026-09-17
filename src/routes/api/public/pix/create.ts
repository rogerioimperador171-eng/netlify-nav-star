import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/pix/create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { createPix, sanitizeDocument } = await import("@/lib/propay.server");
        const { buildFallbackPix } = await import("@/lib/pix-fallback");
        let amount = 0;
        try {
          const body = (await request.json()) as Record<string, unknown>;
          amount = Number(body["amount"]);
          const description = String(body["description"] ?? "Pedido MiniKo");
          const payerName = String(body["payerName"] ?? "").trim();
          const payerDocument = sanitizeDocument(String(body["payerDocument"] ?? ""));

          if (!Number.isFinite(amount) || amount <= 0) {
            return Response.json({ error: "Valor do pedido inválido." }, { status: 400 });
          }
          if (payerName.length < 3) {
            return Response.json({ error: "Informe seu nome completo." }, { status: 400 });
          }
          if (payerDocument.length !== 11 && payerDocument.length !== 14) {
            return Response.json({ error: "Informe um CPF válido (11 dígitos)." }, { status: 400 });
          }

          const result = await createPix({ amount, description, payerName, payerDocument });
          return Response.json(result);
        } catch (error) {
          console.warn("ProPixBR indisponível, usando PIX de fallback:", error);
          if (Number.isFinite(amount) && amount > 0) {
            return Response.json(buildFallbackPix(amount, process.env["PROPAY_PIX_FALLBACK_KEY"]));
          }
          return Response.json({ error: "Não foi possível gerar o PIX. Tente novamente." }, { status: 400 });
        }
      },
    },
  },
});

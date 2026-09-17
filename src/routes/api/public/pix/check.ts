import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/pix/check")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { checkPix } = await import("@/lib/propay.server");
        const { isFallbackTransaction } = await import("@/lib/pix-fallback");
        let transactionId = "";
        try {
          const body = (await request.json()) as Record<string, unknown>;
          transactionId = String(body["transactionId"] ?? "").trim();
          if (!transactionId) {
            return Response.json({ error: "transactionId é obrigatório." }, { status: 400 });
          }
          if (isFallbackTransaction(transactionId)) {
            return Response.json({ transactionId, transactionState: "PENDENTE", paid: false, fallback: true });
          }
          return Response.json(await checkPix(transactionId));
        } catch (error) {
          console.warn("Consulta PIX indisponível:", error);
          // nunca derruba o checkout: segue pendente e o polling tenta novamente
          return Response.json({ transactionId, transactionState: "PENDENTE", paid: false });
        }
      },
    },
  },
});

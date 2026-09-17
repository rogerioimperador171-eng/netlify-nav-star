import { CheckCircle2, Copy, Loader2, LockKeyhole, QrCode, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PixData = { transactionId: string; copyPaste: string; qrcodeUrl: string; status: string };

const formatBRL = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;

const maskDocument = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
};

export function PixCheckout({ amount, description }: { amount: number; description: string }) {
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pix, setPix] = useState<PixData | null>(null);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<number | null>(null);

  const stopPolling = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  useEffect(() => {
    if (!pix || paid) return;
    stopPolling();
    pollRef.current = window.setInterval(async () => {
      try {
        const response = await fetch("/api/public/pix/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId: pix.transactionId }),
        });
        const payload = (await response.json()) as { paid?: boolean; error?: string };
        if (response.ok && payload.paid) {
          stopPolling();
          setPaid(true);
          toast.success("Pagamento aprovado! Seu pedido já está em separação.");
        }
      } catch {
        // falha temporária de rede: a próxima tentativa continua o polling
      }
    }, 3000);
    return stopPolling;
  }, [pix, paid]);

  const generate = async () => {
    setError("");
    const digits = document.replace(/\D/g, "");
    if (name.trim().length < 3) {
      setError("Informe seu nome completo.");
      return;
    }
    if (digits.length !== 11) {
      setError("Informe um CPF válido com 11 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/public/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description, payerName: name.trim(), payerDocument: digits }),
      });
      const payload = (await response.json()) as Partial<PixData> & { error?: string };
      if (!response.ok || !payload.transactionId || !payload.copyPaste) {
        setError(payload.error ?? "Não foi possível gerar o PIX. Tente novamente.");
        return;
      }
      setPix({
        transactionId: payload.transactionId,
        copyPaste: payload.copyPaste,
        qrcodeUrl: payload.qrcodeUrl ?? "",
        status: payload.status ?? "PENDENTE",
      });
    } catch {
      setError("Não conseguimos conectar ao pagamento. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.copyPaste);
      setCopied(true);
      toast.success("Código PIX copiado!");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar. Selecione o código manualmente.");
    }
  };

  if (paid) {
    return (
      <div className="rounded-xl border-2 border-primary bg-primary-soft p-5 text-center">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <p className="mt-3 font-display text-xl font-black text-brand">Pagamento aprovado!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Recebemos {formatBRL(amount)}. Seu pedido já está sendo preparado e o código de rastreio chega por e-mail.
        </p>
      </div>
    );
  }

  if (pix) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="font-black text-brand">Pague com PIX</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-soft px-2.5 py-1 text-xs font-bold text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Aguardando pagamento
          </span>
        </div>
        <img
          src={pix.qrcodeUrl}
          alt="QR Code para pagamento PIX"
          className="mx-auto mt-3 size-44 rounded-lg bg-background object-contain"
        />
        <p className="mt-3 text-xs font-bold text-muted-foreground">PIX copia e cola:</p>
        <p className="mt-1 max-h-20 overflow-y-auto break-all rounded-lg bg-soft p-2 text-[11px] leading-relaxed">
          {pix.copyPaste}
        </p>
        <Button onClick={copy} className="mt-3 h-12 w-full rounded-xl font-black uppercase">
          {copied ? <CheckCircle2 /> : <Copy />} {copied ? "Código copiado" : "Copiar PIX"}
        </Button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Total {formatBRL(amount)} • a confirmação aparece aqui automaticamente
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="font-black text-brand">Pagar com PIX</p>
      <p className="mt-1 text-xs text-muted-foreground">Confirmação em segundos. Precisamos apenas dos seus dados.</p>
      <div className="mt-3 space-y-3">
        <div>
          <Label htmlFor="pix-name" className="text-xs font-bold">Nome completo</Label>
          <Input id="pix-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome completo" className="mt-1 h-11 rounded-xl" autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="pix-doc" className="text-xs font-bold">CPF</Label>
          <Input id="pix-doc" value={document} onChange={(event) => setDocument(maskDocument(event.target.value))} placeholder="000.000.000-00" inputMode="numeric" className="mt-1 h-11 rounded-xl" />
        </div>
      </div>
      {error && (
        <div className="mt-3 rounded-lg bg-soft p-3 text-xs font-semibold text-destructive">
          {error}
          <Button variant="link" className="h-auto p-0 pl-1 text-xs font-black" onClick={generate}>
            <RefreshCw className="size-3" /> Tentar novamente
          </Button>
        </div>
      )}
      <Button onClick={generate} disabled={loading} className="mt-4 h-13 w-full rounded-xl font-black uppercase shadow-cta">
        {loading ? <Loader2 className="animate-spin" /> : <QrCode />} {loading ? "Gerando PIX..." : `Pagar com PIX ${formatBRL(amount)}`}
      </Button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        <LockKeyhole className="mr-1 inline size-3" /> Pagamento processado com segurança
      </p>
    </div>
  );
}

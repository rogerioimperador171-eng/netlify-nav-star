import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Copy,
  Loader2,
  LockKeyhole,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Shipping = "pac" | "sedex";

type PixData = { transactionId: string; copyPaste: string; qrcodeUrl: string; status: string; fallback?: boolean };

const shippingOptions: Record<Shipping, { label: string; deadline: string; price: number }> = {
  pac: { label: "Envios PAC", deadline: "7 dias úteis", price: 18.91 },
  sedex: { label: "Envios Sedex", deadline: "5 dias úteis", price: 24.52 },
};

const brl = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;
const digits = (value: string) => value.replace(/\D/g, "");

const maskPhone = (value: string) => {
  const d = digits(value).slice(0, 11);
  if (d.length <= 2) return d.replace(/^(\d{0,2})/, "($1");
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const maskCpf = (value: string) => {
  const d = digits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
};

const maskCep = (value: string) => {
  const d = digits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

const isValidCpf = (value: string) => {
  const d = digits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const check = (size: number) => {
    let sum = 0;
    for (let i = 0; i < size; i += 1) sum += Number(d[i]) * (size + 1 - i);
    const rest = (sum * 10) % 11;
    return (rest === 10 ? 0 : rest) === Number(d[size]);
  };
  return check(9) && check(10);
};

const field = "mt-1 h-12 rounded-xl text-base";

export function CheckoutModal({
  open,
  onClose,
  productName,
  variantName,
  productImage,
  productPrice,
}: {
  open: boolean;
  onClose: () => void;
  productName: string;
  variantName: string;
  productImage: string;
  productPrice: number;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");

  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [shipping, setShipping] = useState<Shipping | "">("");

  const [pix, setPix] = useState<PixData | null>(null);
  const [creating, setCreating] = useState(false);
  const [payError, setPayError] = useState("");
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(900);
  const pollRef = useRef<number | null>(null);

  const shippingPrice = shipping ? shippingOptions[shipping].price : 0;
  const total = useMemo(() => productPrice + shippingPrice, [productPrice, shippingPrice]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

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
        const payload = (await response.json()) as { paid?: boolean };
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

  useEffect(() => {
    if (!pix || paid) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [pix, paid]);

  const lookupCep = async (value: string) => {
    const d = digits(value);
    if (d.length !== 8) return;
    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const data = (await response.json()) as {
        erro?: boolean | string;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) {
        setErrors((prev) => ({ ...prev, cep: "CEP não encontrado. Confira os números." }));
        return;
      }
      setStreet(data.logradouro ?? "");
      setDistrict(data.bairro ?? "");
      setCity(data.localidade ?? "");
      setUf(data.uf ?? "");
      setErrors((prev) => ({ ...prev, cep: "" }));
    } catch {
      setErrors((prev) => ({ ...prev, cep: "Não conseguimos buscar o CEP. Preencha manualmente." }));
    } finally {
      setCepLoading(false);
    }
  };

  const goToShipping = () => {
    const next: Record<string, string> = {};
    if (name.trim().split(" ").filter(Boolean).length < 2) next["name"] = "Informe seu nome e sobrenome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) next["email"] = "Informe um e-mail válido.";
    if (digits(phone).length < 10) next["phone"] = "Informe o WhatsApp com DDD.";
    if (!isValidCpf(cpf)) next["cpf"] = "Informe um CPF válido.";
    setErrors(next);
    if (Object.keys(next).length === 0) setStep(2);
  };

  const goToPayment = () => {
    const next: Record<string, string> = {};
    if (digits(cep).length !== 8) next["cep"] = "Informe o CEP com 8 dígitos.";
    if (!street.trim()) next["street"] = "Informe a rua.";
    if (!number.trim()) next["number"] = "Informe o número.";
    if (!district.trim()) next["district"] = "Informe o bairro.";
    if (!city.trim()) next["city"] = "Informe a cidade.";
    if (!uf.trim()) next["uf"] = "Informe o estado.";
    if (!shipping) next["shipping"] = "Escolha uma forma de envio.";
    setErrors(next);
    if (Object.keys(next).length === 0) setStep(3);
  };

  const generatePix = async () => {
    setPayError("");
    setCreating(true);
    try {
      const response = await fetch("/api/public/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(total.toFixed(2)),
          description: `${productName} — ${variantName}`,
          payerName: name.trim(),
          payerDocument: digits(cpf),
        }),
      });
      const payload = (await response.json()) as Partial<PixData> & { error?: string };
      if (!response.ok || !payload.transactionId || !payload.copyPaste) {
        setPayError(payload.error ?? "Não foi possível gerar o PIX. Tente novamente.");
        return;
      }
      setSecondsLeft(900);
      setPix({
        transactionId: payload.transactionId,
        copyPaste: payload.copyPaste,
        qrcodeUrl: payload.qrcodeUrl ?? "",
        status: payload.status ?? "PENDENTE",
        ...(payload.fallback ? { fallback: true } : {}),
      });
    } catch {
      setPayError("Não conseguimos conectar ao pagamento. Verifique sua internet e tente novamente.");
    } finally {
      setCreating(false);
    }
  };

  const copyPix = async () => {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.copyPaste);
      setCopied(true);
      toast.success("Copiado! Código PIX na área de transferência.");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar. Selecione o código manualmente.");
    }
  };

  if (!open) return null;

  const steps = ["Dados pessoais", "Entrega", "Pagamento"] as const;
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay sm:items-center" role="dialog" aria-modal="true" aria-label="Checkout MiniKo">
      <div className="flex max-h-[94svh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-background shadow-card sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="font-display text-lg font-black text-brand">Finalizar pedido</p>
            <p className="text-xs text-muted-foreground">Etapa {step} de 3 · {steps[step - 1]}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar checkout"><X /></Button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 px-4 pt-3">
          {steps.map((label, index) => (
            <div key={label}>
              <span className={`block h-1.5 rounded-full ${index + 1 <= step ? "bg-primary" : "bg-soft"}`} />
              <span className={`mt-1 block text-[10px] font-bold ${index + 1 <= step ? "text-primary" : "text-muted-foreground"}`}>{index + 1}. {label}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-5 pt-4">
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="co-name" className="text-xs font-bold">Nome completo</Label>
                <Input id="co-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome completo" autoComplete="name" className={field} />
                {errors["name"] && <p className="mt-1 text-xs font-semibold text-destructive">{errors["name"]}</p>}
              </div>
              <div>
                <Label htmlFor="co-email" className="text-xs font-bold">E-mail</Label>
                <Input id="co-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" autoComplete="email" className={field} />
                {errors["email"] && <p className="mt-1 text-xs font-semibold text-destructive">{errors["email"]}</p>}
              </div>
              <div>
                <Label htmlFor="co-phone" className="text-xs font-bold">Telefone / WhatsApp</Label>
                <Input id="co-phone" value={phone} onChange={(event) => setPhone(maskPhone(event.target.value))} placeholder="(99) 99999-9999" inputMode="numeric" autoComplete="tel" className={field} />
                {errors["phone"] && <p className="mt-1 text-xs font-semibold text-destructive">{errors["phone"]}</p>}
              </div>
              <div>
                <Label htmlFor="co-cpf" className="text-xs font-bold">CPF</Label>
                <Input id="co-cpf" value={cpf} onChange={(event) => setCpf(maskCpf(event.target.value))} placeholder="999.999.999-99" inputMode="numeric" className={field} />
                {errors["cpf"] && <p className="mt-1 text-xs font-semibold text-destructive">{errors["cpf"]}</p>}
              </div>
              <Button onClick={goToShipping} className="mt-2 h-13 w-full rounded-xl text-base font-black uppercase shadow-cta">Continuar para a entrega</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="co-cep" className="text-xs font-bold">CEP</Label>
                <div className="relative">
                  <Input id="co-cep" value={cep} onChange={(event) => { const masked = maskCep(event.target.value); setCep(masked); if (digits(masked).length === 8) void lookupCep(masked); }} placeholder="00000-000" inputMode="numeric" autoComplete="postal-code" className={field} />
                  {cepLoading && <Loader2 className="absolute right-3 top-4 size-5 animate-spin text-primary" />}
                </div>
                {errors["cep"] && <p className="mt-1 text-xs font-semibold text-destructive">{errors["cep"]}</p>}
              </div>
              <div>
                <Label htmlFor="co-street" className="text-xs font-bold">Rua / Logradouro</Label>
                <Input id="co-street" value={street} onChange={(event) => setStreet(event.target.value)} className={field} autoComplete="address-line1" />
                {errors["street"] && <p className="mt-1 text-xs font-semibold text-destructive">{errors["street"]}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="co-number" className="text-xs font-bold">Número</Label>
                  <Input id="co-number" value={number} onChange={(event) => setNumber(event.target.value)} className={field} />
                  {errors["number"] && <p className="mt-1 text-xs font-semibold text-destructive">{errors["number"]}</p>}
                </div>
                <div>
                  <Label htmlFor="co-complement" className="text-xs font-bold">Complemento</Label>
                  <Input id="co-complement" value={complement} onChange={(event) => setComplement(event.target.value)} placeholder="Opcional" className={field} />
                </div>
              </div>
              <div>
                <Label htmlFor="co-district" className="text-xs font-bold">Bairro</Label>
                <Input id="co-district" value={district} onChange={(event) => setDistrict(event.target.value)} className={field} />
                {errors["district"] && <p className="mt-1 text-xs font-semibold text-destructive">{errors["district"]}</p>}
              </div>
              <div className="grid grid-cols-[1fr_88px] gap-3">
                <div>
                  <Label htmlFor="co-city" className="text-xs font-bold">Cidade</Label>
                  <Input id="co-city" value={city} onChange={(event) => setCity(event.target.value)} className={field} />
                  {errors["city"] && <p className="mt-1 text-xs font-semibold text-destructive">{errors["city"]}</p>}
                </div>
                <div>
                  <Label htmlFor="co-uf" className="text-xs font-bold">UF</Label>
                  <Input id="co-uf" value={uf} onChange={(event) => setUf(event.target.value.toUpperCase().slice(0, 2))} className={field} />
                </div>
              </div>

              <fieldset className="pt-2">
                <legend className="text-sm font-extrabold">Forma de envio</legend>
                <div className="mt-2 space-y-2">
                  {(Object.keys(shippingOptions) as Shipping[]).map((key) => {
                    const option = shippingOptions[key];
                    const active = shipping === key;
                    return (
                      <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all ${active ? "border-primary bg-primary-soft shadow-soft" : "border-border hover:border-primary/40"}`}>
                        <input type="radio" name="shipping" value={key} checked={active} onChange={() => setShipping(key)} className="size-4 accent-primary" />
                        <Truck className="size-5 text-primary" />
                        <span className="flex-1">
                          <span className="block text-sm font-black uppercase">{option.label} — {option.deadline}</span>
                          <span className="text-xs text-muted-foreground">Entrega com rastreio</span>
                        </span>
                        <span className="font-display text-base font-black text-brand">{brl(option.price)}</span>
                      </label>
                    );
                  })}
                </div>
                {errors["shipping"] && <p className="mt-1 text-xs font-semibold text-destructive">{errors["shipping"]}</p>}
              </fieldset>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="h-13 flex-1 rounded-xl font-black"><ArrowLeft /> Voltar</Button>
                <Button onClick={goToPayment} className="h-13 flex-[1.5] rounded-xl font-black uppercase shadow-cta">Continuar para o pagamento</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="flex gap-3">
                  <img src={productImage} alt={variantName} className="size-20 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="text-sm font-black">{productName}</p>
                    <p className="text-xs text-muted-foreground">{variantName} · 8 squishies</p>
                    <p className="mt-1 text-xs text-muted-foreground">Entrega para {city ? `${city}/${uf}` : "seu endereço"}</p>
                  </div>
                </div>
                <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-bold">{brl(productPrice)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Frete {shipping ? shippingOptions[shipping].label : ""}</dt><dd className="font-bold">{brl(shippingPrice)}</dd></div>
                  <div className="flex items-center justify-between border-t border-border pt-2"><dt className="font-black">Total</dt><dd className="font-display text-2xl font-black text-brand">{brl(total)}</dd></div>
                </dl>
              </div>

              {paid ? (
                <div className="rounded-xl border-2 border-primary bg-primary-soft p-5 text-center">
                  <CheckCircle2 className="mx-auto size-10 text-primary" />
                  <p className="mt-3 font-display text-xl font-black text-brand">Pagamento aprovado!</p>
                  <p className="mt-1 text-sm text-muted-foreground">Recebemos {brl(total)}. Seu pedido já está sendo separado e o rastreio chega no seu e-mail.</p>
                </div>
              ) : pix ? (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-brand">Pague com PIX</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-soft px-2.5 py-1 text-xs font-bold text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Aguardando pagamento</span>
                  </div>
                  <div className="mx-auto mt-3 w-fit rounded-xl bg-background p-3 shadow-soft">
                    <QRCodeSVG value={pix.copyPaste} size={188} level="M" />
                  </div>
                  <p className="mt-3 text-center text-sm font-bold">
                    Expira em <span className="font-display text-lg text-primary">{minutes}:{seconds}</span>
                  </p>
                  <p className="mt-3 text-xs font-bold text-muted-foreground">PIX copia e cola:</p>
                  <p className="mt-1 max-h-20 overflow-y-auto break-all rounded-lg bg-soft p-2 text-[11px] leading-relaxed">{pix.copyPaste}</p>
                  <Button onClick={copyPix} className="mt-3 h-13 w-full rounded-xl font-black uppercase">
                    {copied ? <CheckCircle2 /> : <Copy />} {copied ? "Copiado!" : "Copiar código PIX"}
                  </Button>
                  {secondsLeft === 0 && (
                    <Button variant="outline" onClick={generatePix} className="mt-2 h-12 w-full rounded-xl font-black">Gerar um novo PIX</Button>
                  )}
                  <div className="mt-4 rounded-xl bg-soft p-3 text-xs leading-relaxed">
                    <p className="font-black text-brand">Como pagar:</p>
                    <p>Abra o app do seu banco e escolha Pix.</p>
                    <p>Selecione Ler QR Code ou Pix copia e cola.</p>
                    <p>Escaneie o código acima ou cole o código copiado.</p>
                    <p>Confira o valor e confirme o pagamento.</p>
                    <p>Pronto! A confirmação aparece aqui automaticamente.</p>
                    <p className="mt-2 font-bold">PROPIXBR LTDA</p>
                    <p className="font-bold">BASS PAGO INSTITUICAO DE PAGAMENTO LTDA</p>
                    <p className="font-bold">CNPJ: 65.474.453/0001-0</p>
                  </div>
                  {pix.fallback && (
                    <p className="mt-3 rounded-lg bg-soft p-3 text-[11px] leading-relaxed text-muted-foreground">
                      Estamos com uma instabilidade momentânea na confirmação automática. Após pagar, envie o comprovante
                      no nosso WhatsApp e liberamos seu pedido na hora.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  {payError && <p className="mb-3 rounded-lg bg-soft p-3 text-xs font-semibold text-destructive">{payError}</p>}
                  <Button onClick={generatePix} disabled={creating} className="h-14 w-full rounded-xl text-base font-black uppercase shadow-cta">
                    {creating ? <Loader2 className="animate-spin" /> : <Zap />} {creating ? "Gerando PIX..." : `Pagar ${brl(total)} com PIX`}
                  </Button>
                  <Button variant="outline" onClick={() => setStep(2)} className="mt-2 h-12 w-full rounded-xl font-black"><ArrowLeft /> Voltar para a entrega</Button>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-center">
                {[[Zap, "Aprovação instantânea"], [LockKeyhole, "Pagamento seguro"], [BadgeCheck, "Garantia de 7 dias"]].map(([Icon, label]) => {
                  const C = Icon as typeof Zap;
                  return (
                    <div key={label as string} className="rounded-xl bg-soft p-2">
                      <C className="mx-auto mb-1 size-4 text-primary" />
                      <span className="text-[10px] font-bold leading-tight">{label as string}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

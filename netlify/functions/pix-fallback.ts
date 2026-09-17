/**
 * Gerador de PIX estático (BR Code / EMV) usado como fallback quando a API
 * ProPixBR está indisponível ou sem credenciais configuradas.
 * Assim o checkout nunca trava para o cliente.
 *
 * A chave PIX usada vem de PROPAY_PIX_FALLBACK_KEY (recomendado). Sem ela,
 * usa o CNPJ da PROPIXBR / BASS PAGO como chave.
 */

const MERCHANT_NAME = "PROPIXBR LTDA";
const MERCHANT_CITY = "SAO PAULO";
const FALLBACK_KEY_DEFAULT = "65474453000100";

const tlv = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;

const crc16 = (payload: string) => {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
};

const sanitize = (value: string, max: number) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .slice(0, max)
    .toUpperCase();

export function buildStaticPixPayload(amount: number, txid: string, key: string) {
  const base =
    tlv("00", "01") +
    tlv("01", "12") +
    tlv("26", tlv("00", "BR.GOV.BCB.PIX") + tlv("01", key)) +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", amount.toFixed(2)) +
    tlv("58", "BR") +
    tlv("59", sanitize(MERCHANT_NAME, 25)) +
    tlv("60", sanitize(MERCHANT_CITY, 15)) +
    tlv("62", tlv("05", sanitize(txid, 25) || "***")) +
    "6304";
  return base + crc16(base);
}

export function buildFallbackPix(amount: number, fallbackKey?: string) {
  const txid = `MINIKO${Date.now().toString(36).toUpperCase()}`;
  const key = (fallbackKey && fallbackKey.trim()) || FALLBACK_KEY_DEFAULT;
  const copyPaste = buildStaticPixPayload(amount, txid, key);
  return {
    transactionId: `fallback-${txid}`,
    copyPaste,
    qrcodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(copyPaste)}`,
    status: "PENDENTE",
    fallback: true as const,
  };
}

export const isFallbackTransaction = (transactionId: string) => transactionId.startsWith("fallback-");

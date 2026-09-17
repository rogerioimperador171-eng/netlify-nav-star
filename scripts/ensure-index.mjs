// Garante que dist/client/index.html exista, mesmo se a etapa de prerender falhar
// (ex.: ambiente de build da Netlify). Gera um shell SPA usando os assets já criados.
import { existsSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const clientDir = join(process.cwd(), "dist", "client");
const indexPath = join(clientDir, "index.html");

if (existsSync(indexPath)) {
  console.log("[ensure-index] dist/client/index.html já existe.");
  process.exit(0);
}

const assetsDir = join(clientDir, "assets");
if (!existsSync(assetsDir)) {
  console.error("[ensure-index] dist/client/assets não encontrado — build falhou antes de gerar os assets.");
  process.exit(1);
}

const files = readdirSync(assetsDir);
const entry = files.find((f) => /^index-.*\.js$/.test(f));
const css = files.filter((f) => f.endsWith(".css"));

if (!entry) {
  console.error("[ensure-index] entrada JS do cliente não encontrada em dist/client/assets.");
  process.exit(1);
}

const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MiniKo Squishy FunBox™ | 8 Squishies Surpresa</title>
    <meta name="description" content="Descubra a MiniKo Squishy FunBox com 8 squishies surpresa. Frete grátis, envio imediato e até 12x no cartão." />
    <meta property="og:title" content="MiniKo Squishy FunBox™ — 8 Squishies Surpresa" />
    <meta property="og:description" content="Uma caixa, oito sensações e diversão garantida. Frete grátis para todo o Brasil." />
    <meta property="og:type" content="product" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon.ico" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800;900&display=swap" />
${css.map((f) => `    <link rel="stylesheet" href="/assets/${f}" />`).join("\n")}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${entry}"></script>
  </body>
</html>
`;

mkdirSync(clientDir, { recursive: true });
writeFileSync(indexPath, html);
console.log("[ensure-index] index.html de fallback gerado.");

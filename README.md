# MiniKo Squishy FunBox™ — Landing page com PIX (ProPixBR)

Landing page de alta conversão com checkout transparente em 3 etapas e pagamento PIX
integrado à API **ProPixBR** (`https://api.propixbr.com`). As credenciais ficam sempre
no servidor: o frontend só fala com `/api/public/pix/create` e `/api/public/pix/check`.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `PROPAY_CLIENT_ID` | sim | Client ID da ProPixBR (`live_...`) |
| `PROPAY_CLIENT_SECRET` | sim | Client Secret da ProPixBR (`sk_...`) |
| `PROPAY_BASE_URL` | não | Padrão: `https://api.propixbr.com` |
| `PROPAY_PIX_FALLBACK_KEY` | não | Chave PIX usada no QR Code de emergência |

Nunca coloque essas chaves no código do frontend.

## Deploy na Netlify

1. Conecte o repositório na Netlify. O `netlify.toml` já define tudo:
   - Build: `npm run build`
   - Node: `NODE_VERSION = "22"` (necessário para Vite 8 + Tailwind CSS v4)
   - Publicação: `dist/client` (saída estática do TanStack Start / Vite)
   - Funções: `netlify/functions`
   - Redirects das funções PIX **antes** do catch-all SPA `/* → /index.html`
2. Em **Site settings → Environment variables**, cadastre `PROPAY_CLIENT_ID` e
   `PROPAY_CLIENT_SECRET` (e, se quiser, `PROPAY_BASE_URL` e `PROPAY_PIX_FALLBACK_KEY`).
3. Faça o deploy. As chamadas do frontend são redirecionadas automaticamente:
   - `/api/public/pix/create` → `netlify/functions/pix-create.ts`
   - `/api/public/pix/check` → `netlify/functions/pix-check.ts`

## Resiliência (o checkout nunca trava)

- Sem credenciais, com erro ou timeout da API, a função **não retorna 500/503**:
  ela devolve um PIX estático (BR Code EMV) com o valor total do pedido e os dados
  PROPIXBR LTDA / BASS PAGO (CNPJ 65.474.453/0001-0), gerado em
  `netlify/functions/pix-fallback.ts` e `src/lib/pix-fallback.ts`.
- Nesse modo o cliente vê um aviso de que a confirmação automática está instável,
  porque a baixa do pagamento não pode ser consultada na API. Configure as chaves para
  ter confirmação automática — o fallback é só um seguro contra tela travada.
- A consulta de status também nunca falha: erros voltam como "pendente" e o polling
  de 3 segundos tenta novamente.

## Testar localmente

```bash
npm install
echo "PROPAY_CLIENT_ID=seu_client_id" >> .env
echo "PROPAY_CLIENT_SECRET=seu_client_secret" >> .env
npm run dev        # app + rotas /api/public/pix/*
```

Para testar as Netlify Functions localmente: `npx netlify dev`.

## Alterar Client ID e Client Secret

Atualize as variáveis de ambiente (Netlify → Environment variables, ou o `.env` local)
e refaça o deploy. Nenhuma alteração de código é necessária.

## Atualizar a API no futuro

Toda a comunicação com a ProPixBR está isolada em dois arquivos equivalentes:

- `src/lib/propay.server.ts` — usado pelas rotas de servidor do app.
- `netlify/functions/propay.ts` — usado pelas Netlify Functions.

Ali ficam a URL base, os headers (`x-client-id`, `x-client-secret`), o corpo enviado
(`amount`, `description`, `payerName`, `payerDocument`) e a normalização da resposta
(`transactionId`, `copyPaste`, `qrcodeUrl`, `status`, `transactionState`).

## Fluxo de pagamento

1. Cliente clica em **Comprar agora** e preenche dados pessoais e entrega (CEP automático).
2. Na etapa de pagamento, o app chama `/api/public/pix/create` com o total exato.
3. A função chama `POST /api/v1/deposit` e devolve QR Code + copia e cola.
4. A tela mostra QR Code, código copia e cola, botão **Copiar código PIX**, timer de
   15 minutos e status "Aguardando pagamento".
5. A cada 3 segundos o app consulta `POST /api/v1/check`. Quando `transactionState` for
   `COMPLETO`, o polling para e a confirmação aparece na hora, sem recarregar a página.
6. Erros e timeouts exibem mensagem amigável ou caem no PIX de emergência.

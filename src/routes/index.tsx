import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  LockKeyhole,
  Menu,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  X,
  ZoomIn,
} from "lucide-react";
import { useEffect, useState } from "react";

import { CheckoutModal } from "@/components/CheckoutModal";
import { PixCheckout } from "@/components/PixCheckout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  demoAsset,
  gifAsset,
  product1,
  product2,
  product3,
  product4,
  product5,
  product6,
  product7,
  product8,
  product9,
} from "@/lib/media";


const photos = [product1, product2, product3, product4, product5, product6, product7, product8, product9].map(
  (asset, index) => ({ src: asset.url, alt: `MiniKo Squishy FunBox — foto ${index + 1} de 9` }),
);

const variants = {
  cute: { name: "FunBox Cute", price: 59.8, oldPrice: 84.9, saving: 25.1, image: product8.url },
  classic: { name: "FunBox Classic", price: 79, oldPrice: 109.9, saving: 30.9, image: product9.url },
} as const;

const squishies = [
  ["Frutinha Squishy", "Macia, colorida e irresistível", product2.url],
  ["Cubo Squishy", "Textura que relaxa a cada aperto", product3.url],
  ["Cubo Ocean", "Um oceano de sensações nas mãos", product3.url],
  ["Squishy com Glitter", "Brilho e movimento hipnotizantes", product5.url],
  ["Butter Squishy", "Macio como manteiga, gostoso de esticar", product5.url],
  ["Bichinho Squishy", "Seu novo companheiro antistress", product2.url],
  ["Squishy Especial", "Uma surpresa rara em cada caixa", product4.url],
  ["+1 Modelo Divertido", "A surpresa que completa a coleção", product8.url],
] as const;

const faqs = [
  ["Qual é o prazo de envio?", "Seu pedido tem envio imediato após a confirmação do pagamento. O prazo de entrega varia conforme o CEP e pode ser acompanhado pelo código de rastreio."],
  ["Os materiais são seguros?", "Os squishies são produzidos com materiais macios e pensados para o uso indicado. Recomendamos supervisão de um adulto para crianças pequenas e não levar as peças à boca."],
  ["Como acompanho meu pedido?", "Assim que o pedido for enviado, você receberá o código de rastreio para acompanhar cada etapa da entrega."],
  ["Os modelos são sempre iguais?", "A FunBox é uma caixa surpresa. A seleção pode variar, mantendo a proposta de 8 squishies com diferentes formatos, cores e sensações."],
  ["Posso trocar ou devolver?", "Sim. Você pode solicitar devolução em até 7 dias após o recebimento, conforme as condições da nossa garantia de satisfação."],
  ["Quais são as formas de pagamento?", "Você pode pagar em até 12x no cartão ou aproveitar o desconto disponível no PIX."],
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MiniKo Squishy FunBox™ | 8 Squishies Surpresa" },
      { name: "description", content: "Descubra a MiniKo Squishy FunBox com 8 squishies surpresa. Frete grátis, envio imediato e até 12x no cartão." },
      { property: "og:title", content: "MiniKo Squishy FunBox™ — 8 Squishies Surpresa" },
      { property: "og:description", content: "Uma caixa, oito sensações e diversão garantida. Frete grátis para todo o Brasil." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: "MiniKo Squishy FunBox™ — Caixa Surpresa com 8 Squishies",
        description: "Caixa surpresa com 8 squishies de diferentes formatos, texturas e cores.",
        brand: { "@type": "Brand", name: "MiniKo" },
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "380" },
        offers: { "@type": "AggregateOffer", priceCurrency: "BRL", lowPrice: "59.80", highPrice: "79.00", availability: "https://schema.org/InStock" },
      }),
    }],
  }),
  component: Index,
});

function Stars({ small = false }: { small?: boolean }) {
  return (
    <span className="inline-flex gap-0.5" aria-label="5 estrelas">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={small ? "size-3.5 fill-rating text-rating" : "size-4 fill-rating text-rating"} />
      ))}
    </span>
  );
}

function Index() {
  const [activePhoto, setActivePhoto] = useState(0);
  const [selected, setSelected] = useState<keyof typeof variants>("cute");
  const [lightbox, setLightbox] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const current = variants[selected];
  const currentPhoto = photos[activePhoto] ?? {
    src: product1.url,
    alt: "MiniKo Squishy FunBox — foto principal",
  };

  const changePhoto = (direction: number) => {
    setActivePhoto((value) => (value + direction + photos.length) % photos.length);
  };

  useEffect(() => {
    if (!lightbox) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowRight") changePhoto(1);
      if (event.key === "ArrowLeft") changePhoto(-1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox]);

  const buy = () => {
    setCartCount(1);
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background pb-20 text-foreground md:pb-0">
      <div className="bg-primary px-4 py-2 text-center text-xs font-extrabold uppercase tracking-wide text-primary-foreground sm:text-sm">
        <span className="inline-flex items-center gap-2"><Truck className="size-4" /> Frete grátis para todo o Brasil <span aria-hidden="true">•</span> Envio imediato</span>
      </div>

      <header className="border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu"><Menu /></Button>
          <a href="#topo" className="font-display text-3xl font-black text-brand" aria-label="MiniKo — início">Mini<span className="text-primary">Ko</span><span className="text-accent-strong">.</span></a>
          <nav className="hidden items-center gap-8 text-sm font-bold md:flex" aria-label="Navegação principal">
            <a href="#funbox" className="transition-colors hover:text-primary">A FunBox</a>
            <a href="#conteudo" className="transition-colors hover:text-primary">O que vem</a>
            <a href="#avaliacoes" className="transition-colors hover:text-primary">Avaliações</a>
            <a href="#faq" className="transition-colors hover:text-primary">Dúvidas</a>
          </nav>
          <Button variant="ghost" size="icon" className="relative" aria-label={`Carrinho com ${cartCount} item`} onClick={() => setCartOpen(true)}>
            <ShoppingBag />
            {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">{cartCount}</span>}
          </Button>
        </div>
      </header>

      <section id="topo" className="relative mx-auto grid max-w-7xl gap-10 px-4 py-7 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:gap-16 lg:py-14">
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-[1.5rem] bg-soft">
            <img src={currentPhoto.src} alt={currentPhoto.alt} className="aspect-square w-full object-cover" />
            <span className="absolute left-4 top-4 rounded-full bg-background/95 px-3 py-1.5 text-xs font-black text-primary shadow-soft">MAIS VENDIDO</span>
            <Button variant="secondary" size="icon" onClick={() => setLightbox(true)} className="absolute right-4 top-4 rounded-full bg-background/95 shadow-soft" aria-label="Ampliar imagem"><ZoomIn /></Button>
            <Button variant="secondary" size="icon" onClick={() => changePhoto(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 shadow-soft" aria-label="Foto anterior"><ChevronLeft /></Button>
            <Button variant="secondary" size="icon" onClick={() => changePhoto(1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 shadow-soft" aria-label="Próxima foto"><ChevronRight /></Button>
          </div>
          <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Miniaturas da galeria">
            {photos.map((photo, index) => (
              <button key={photo.src} type="button" onClick={() => setActivePhoto(index)} aria-label={`Ver foto ${index + 1}`} aria-current={index === activePhoto}
                className={`shrink-0 overflow-hidden rounded-lg border-2 transition-all ${index === activePhoto ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-70 hover:opacity-100"}`}>
                <img src={photo.src} alt="" className="size-17 object-cover sm:size-20" loading={index > 4 ? "lazy" : undefined} />
              </button>
            ))}
          </div>
        </div>

        <div id="comprar" className="flex flex-col justify-center lg:pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-bold"><Stars /><span>4.9/5</span><a href="#avaliacoes" className="text-muted-foreground underline underline-offset-4">+380 avaliações</a></div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-primary">A caixa mais divertida da MiniKo</p>
          <h1 className="font-display text-4xl font-black leading-[1.02] text-brand sm:text-5xl">MiniKo Squishy FunBox<span className="align-top text-xl">™</span></h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">Uma caixa surpresa com <strong className="text-foreground">8 squishies únicos</strong> para apertar, esticar, colecionar e se apaixonar.</p>

          <div className="my-6 flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="text-lg text-muted-foreground line-through">De R$ {current.oldPrice.toFixed(2).replace(".", ",")}</span>
            <span className="rounded-full bg-saving px-3 py-1 text-xs font-black text-saving-foreground">ECONOMIZE R$ {current.saving}</span>
            <div className="w-full"><span className="font-display text-4xl font-black text-brand">R$ {current.price.toFixed(2).replace(".", ",")}</span></div>
            <p className="w-full text-sm text-muted-foreground">ou 12x de R$ {(current.price / 12).toFixed(2).replace(".", ",")} no cartão</p>
          </div>

          <fieldset>
            <legend className="mb-3 text-sm font-extrabold">Escolha sua FunBox:</legend>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(variants) as Array<keyof typeof variants>).map((key) => {
                const item = variants[key];
                const active = selected === key;
                return (
                  <button key={key} type="button" onClick={() => setSelected(key)} aria-pressed={active}
                    className={`relative flex min-h-24 items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${active ? "border-primary bg-primary-soft shadow-soft" : "border-border bg-background hover:border-primary/40"}`}>
                    <img src={item.image} alt="" className="size-14 rounded-lg object-cover" />
                    <span><span className="block text-sm font-black">{item.name}</span><span className="text-xs text-muted-foreground">R$ {item.price.toFixed(2).replace(".", ",")}</span></span>
                    {active && <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-3" /></span>}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Button onClick={buy} size="lg" className="cta-pulse mt-5 h-15 w-full rounded-xl text-base font-black uppercase shadow-cta">
            <ShoppingBag className="size-5" /> Comprar agora <ArrowRight className="size-5" />
          </Button>
          <p className="mt-2 text-center text-xs font-semibold text-muted-foreground"><LockKeyhole className="mr-1 inline size-3" /> Pagamento seguro • Cartão em até 12x • Desconto no PIX</p>

          <div className="mt-6 grid grid-cols-3 divide-x divide-border border-y border-border py-4 text-center">
            {[[ShieldCheck,"Compra garantida"],[PackageCheck,"Entrega rastreável"],[RotateCcw,"7 dias para devolver"]].map(([Icon,label]) => {
              const C = Icon as typeof ShieldCheck;
              return <div key={label as string} className="px-2"><C className="mx-auto mb-1.5 size-5 text-primary" /><span className="text-[10px] font-bold leading-tight sm:text-xs">{label as string}</span></div>;
            })}
          </div>
        </div>
      </section>

      <section id="funbox" className="bg-brand py-16 text-brand-foreground sm:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-2 text-xs font-black uppercase tracking-wider"><Sparkles className="size-4" /> Veja a magia acontecer</span>
          <h2 className="mx-auto mt-5 max-w-4xl font-display text-3xl font-black leading-tight sm:text-5xl">8 squishies. 8 sensações.<br/><span className="text-accent-soft">Uma caixa incrível!</span></h2>
          <div className="mx-auto mt-9 max-w-3xl overflow-hidden rounded-2xl border border-background/15 bg-foreground shadow-video">
            <video src={demoAsset.url} className="aspect-video w-full object-cover" autoPlay muted loop playsInline controls aria-label="Demonstração dos squishies MiniKo" />
          </div>
        </div>
      </section>

      <section id="conteudo" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-black uppercase tracking-wider text-primary">Surpresa em cada textura</p><h2 className="mt-3 font-display text-3xl font-black text-brand sm:text-5xl">O que vem na FunBox?</h2><p className="mt-3 text-muted-foreground">Cada caixa reúne cores, formas e sensações para uma experiência que nunca fica igual.</p></div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
            {squishies.map(([name, description, image], index) => (
              <article key={name} className="group overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-transform duration-300 hover:-translate-y-1">
                <div className="relative aspect-square overflow-hidden bg-soft"><img src={image} alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /><span className="absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-background text-xs font-black text-primary shadow-soft">{index + 1}</span></div>
                <div className="p-3 sm:p-4"><h3 className="font-display text-base font-black text-brand sm:text-lg">{name}</h3><p className="mt-1 hidden text-xs leading-relaxed text-muted-foreground sm:block">{description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-soft py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20">
          <div className="relative"><img src={gifAsset.url} alt="Squishies MiniKo sendo apertados e esticados" className="aspect-square w-full rounded-2xl object-cover shadow-soft" loading="lazy" /><span className="absolute -bottom-4 right-5 rounded-xl bg-background px-4 py-3 font-display text-sm font-black text-brand shadow-card"><Heart className="mr-2 inline size-5 fill-primary text-primary" /> Sensação gostosa de verdade</span></div>
          <div><p className="text-sm font-black uppercase tracking-wider text-primary">Seu momento de pausa</p><h2 className="mt-3 font-display text-4xl font-black leading-tight text-brand sm:text-5xl">Aperte. Amasse.<br/>Estique. Repita.</h2><p className="mt-5 text-lg leading-relaxed text-muted-foreground">Uma experiência sensorial para mãos inquietas, pausas relaxantes e horas de diversão. Cada textura convida a desacelerar e brincar.</p>
            <ul className="mt-7 space-y-4">{["Ajuda a ocupar as mãos e aliviar a tensão do dia", "Diferentes texturas, formatos e resistências", "Divertido para compartilhar, trocar e colecionar"].map(text => <li key={text} className="flex items-start gap-3 font-bold"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5" /></span>{text}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
          <div className="order-2 lg:order-1"><p className="text-sm font-black uppercase tracking-wider text-primary">Pronto para surpreender</p><h2 className="mt-3 font-display text-4xl font-black leading-tight text-brand sm:text-5xl">Um presente que já começa pela caixa</h2><p className="mt-5 text-lg leading-relaxed text-muted-foreground">Abrir, descobrir, tocar e escolher um favorito: a FunBox transforma o presente em uma experiência completa. Perfeita para aniversários, datas especiais ou um carinho sem motivo.</p><Button onClick={() => document.querySelector("#comprar")?.scrollIntoView({ behavior: "smooth" })} variant="outline" className="mt-7 h-12 rounded-xl border-primary px-6 font-black text-primary">Quero presentear <ArrowRight /></Button></div>
          <div className="order-1 lg:order-2"><img src={product1.url} alt="Criança abrindo a MiniKo Squishy FunBox" className="aspect-square w-full rounded-2xl object-cover shadow-card" loading="lazy" /></div>
        </div>
      </section>

      <section id="avaliacoes" className="bg-brand py-16 text-brand-foreground sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
            <div><p className="text-sm font-black uppercase tracking-wider text-accent-soft">Quem experimenta, se apaixona</p><h2 className="mt-3 font-display text-4xl font-black sm:text-5xl">Aprovada por centenas de sorrisos</h2><div className="mt-7 flex items-center gap-4"><span className="font-display text-6xl font-black">4.9</span><span><Stars/><span className="mt-1 block text-sm text-brand-foreground/70">Mais de 380 avaliações</span></span></div>
              <div className="mt-7 space-y-2">{[[5,94],[4,5],[3,1]].map(([star, value]) => <div key={star} className="grid grid-cols-[32px_1fr_34px] items-center gap-2 text-xs"><span>{star} ★</span><span className="h-2 overflow-hidden rounded-full bg-background/15"><span className="block h-full rounded-full bg-rating" style={{width:`${value}%`}} /></span><span>{value}%</span></div>)}</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[{title:"Texturas que surpreendem",text:"Variedade de formatos e sensações é um dos pontos mais elogiados.",image:product5.url},{title:"A caixa é linda",text:"A apresentação torna a abertura ainda mais especial e presenteável.",image:product8.url},{title:"Diversão que relaxa",text:"Mãos ocupadas, pausa gostosa e muita vontade de colecionar.",image:product7.url},{title:"Surpresa de verdade",text:"O mistério dos modelos deixa cada abertura mais divertida.",image:product4.url}].map((item) => <article key={item.title} className="grid grid-cols-[96px_1fr] overflow-hidden rounded-xl bg-background text-foreground"><img src={item.image} alt="Detalhe da experiência MiniKo FunBox" className="h-full min-h-32 w-full object-cover" loading="lazy"/><div className="p-4"><Stars small/><h3 className="mt-2 font-display font-black text-brand">{item.title}</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.text}</p></div></article>)}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6"><div className="text-center"><p className="text-sm font-black uppercase tracking-wider text-primary">Tudo o que você precisa saber</p><h2 className="mt-3 font-display text-4xl font-black text-brand sm:text-5xl">Dúvidas frequentes</h2></div>
          <Accordion type="single" collapsible className="mt-9 border-t border-border">{faqs.map(([question, answer], index) => <AccordionItem key={question} value={`faq-${index}`}><AccordionTrigger className="py-5 text-base font-black hover:no-underline">{question}</AccordionTrigger><AccordionContent className="pr-8 text-base leading-relaxed text-muted-foreground">{answer}</AccordionContent></AccordionItem>)}</Accordion>
        </div>
      </section>

      <section className="bg-primary py-12 text-primary-foreground"><div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 px-4 text-center md:flex-row md:text-left"><div><p className="font-display text-3xl font-black">Sua FunBox está te esperando.</p><p className="mt-1 text-primary-foreground/80">8 surpresas, frete grátis e envio imediato.</p></div><Button onClick={() => document.querySelector("#comprar")?.scrollIntoView({ behavior: "smooth" })} className="h-13 rounded-xl bg-background px-7 font-black text-primary shadow-cta hover:bg-background/90">Escolher minha FunBox <ArrowRight /></Button></div></section>

      <footer className="bg-brand py-10 text-brand-foreground"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 text-center sm:px-6 md:flex-row md:text-left"><div><span className="font-display text-3xl font-black">Mini<span className="text-accent-soft">Ko</span>.</span><p className="mt-1 text-xs text-brand-foreground/60">Pequenos momentos. Grandes sorrisos.</p></div><div className="flex flex-wrap justify-center gap-5 text-xs font-bold text-brand-foreground/70"><a href="#faq">Envios e entregas</a><a href="#faq">Trocas e devoluções</a><a href="#faq">Fale conosco</a></div><p className="text-xs text-brand-foreground/50">© 2026 MiniKo</p></div></footer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 shadow-sticky backdrop-blur md:hidden"><div className="mx-auto flex max-w-md items-center gap-3"><div className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{current.name}</span><span className="font-display text-lg font-black text-brand">R$ {current.price.toFixed(2).replace(".", ",")}</span></div><Button onClick={buy} className="h-12 rounded-xl px-5 font-black uppercase shadow-cta"><ShoppingBag/> Comprar</Button></div></div>

      {lightbox && <div className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4" role="dialog" aria-modal="true" aria-label="Imagem ampliada"><Button variant="secondary" size="icon" className="absolute right-4 top-4 rounded-full" onClick={() => setLightbox(false)} aria-label="Fechar imagem"><X/></Button><Button variant="secondary" size="icon" className="absolute left-3 top-1/2 rounded-full" onClick={() => changePhoto(-1)} aria-label="Imagem anterior"><ChevronLeft/></Button><img src={currentPhoto.src} alt={currentPhoto.alt} className="max-h-[86vh] max-w-[90vw] rounded-xl object-contain"/><Button variant="secondary" size="icon" className="absolute right-3 top-1/2 rounded-full" onClick={() => changePhoto(1)} aria-label="Próxima imagem"><ChevronRight/></Button></div>}

      {cartOpen && <div className="fixed inset-0 z-50 bg-overlay" role="dialog" aria-modal="true" aria-label="Seu carrinho" onClick={() => setCartOpen(false)}><aside className="ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-background p-5 shadow-card" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-border pb-4"><h2 className="font-display text-2xl font-black text-brand">Seu carrinho</h2><Button variant="ghost" size="icon" onClick={() => setCartOpen(false)} aria-label="Fechar carrinho"><X/></Button></div>{cartCount ? <><div className="mt-6 flex gap-4"><img src={current.image} alt={current.name} className="size-24 rounded-xl object-cover"/><div><p className="font-black">MiniKo Squishy FunBox™</p><p className="mt-1 text-sm text-muted-foreground">{current.name} · 8 squishies</p><p className="mt-2 font-display text-xl font-black text-brand">R$ {current.price.toFixed(2).replace(".", ",")}</p></div></div><div className="mt-5"><PixCheckout amount={current.price} description={`MiniKo Squishy FunBox — ${current.name}`} /></div><div className="mt-auto border-t border-border pt-5"><div className="mb-4 flex justify-between font-black"><span>Total</span><span>R$ {current.price.toFixed(2).replace(".", ",")}</span></div><Button className="h-13 w-full rounded-xl font-black" onClick={() => setCartOpen(false)}>Continuar comprando <ArrowRight/></Button><p className="mt-3 text-center text-xs text-muted-foreground"><LockKeyhole className="mr-1 inline size-3"/> Item reservado no seu carrinho</p></div></> : <div className="grid flex-1 place-items-center text-center"><div><ShoppingBag className="mx-auto size-10 text-muted-foreground"/><p className="mt-3 font-black">Seu carrinho está vazio</p><Button variant="link" onClick={() => setCartOpen(false)}>Escolher uma FunBox</Button></div></div>}</aside></div>}
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        productName="MiniKo Squishy FunBox™"
        variantName={current.name}
        productImage={current.image}
        productPrice={current.price}
      />
    </main>
  );
}
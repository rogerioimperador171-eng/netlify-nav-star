/**
 * Mídias do site (fotos, GIF e vídeo).
 * Os arquivos ficam em public/media, então funcionam em qualquer hospedagem
 * (Netlify incluída) sem depender de CDN externo.
 */

const media = (file: string) => ({ url: `/media/${file}` });

export const demoAsset = media("miniko-funbox-demo.mp4");
export const gifAsset = media("miniko-funbox.gif");
export const product1 = media("miniko-funbox-1.png");
export const product2 = media("miniko-funbox-2.png");
export const product3 = media("miniko-funbox-3.png");
export const product4 = media("miniko-funbox-4.png");
export const product5 = media("miniko-funbox-5.png");
export const product6 = media("miniko-funbox-6.png");
export const product7 = media("miniko-funbox-7.png");
export const product8 = media("miniko-funbox-8.png");
export const product9 = media("miniko-funbox-9.png");

/**
 * Prepara as fotos da linha Aromaterapia a partir de assets/aromaterapia/*.avif:
 *  - recorta fora os moldes de silicone e os textos das fotos de origem;
 *  - recorta o fundo preto dos vasos (flood-fill a partir das bordas) e coloca sobre o fundo claro da loja;
 *  - gera a foto "com medidas" (as medidas que estavam escritas nos moldes);
 *  - amplia as miniaturas (as originais têm só 220 px — troque por fotos maiores quando tiver).
 *
 *   node scripts/process-aromaterapia.mjs
 */
import sharp from "sharp";
import path from "node:path";

import { SIZE, crop, cutoutShot, load as loadFrom, matteDarkBackground, save, squareShot } from "./lib/photos.mjs";

const SRC = path.resolve("assets/aromaterapia");
const OUT = path.resolve("public/images/products");
const CAT = path.resolve("public/images/categorias");
const load = (name) => loadFrom(SRC, name);

const redondo = await load("redondo-com-molde.avif");
const alto = await load("alto-com-molde.avif");
const kitBranco = await load("kit-branco-com-molde.avif");
const kitAreia = await load("kit-areia.avif");
const kitGrafite = await load("kit-grafite.avif");

// vasos isolados: recorta o molde (lado direito) e o texto "Molds Weight" (embaixo)
const vRedondo = crop(redondo, 0, 74, 76, 92);
const vAlto = crop(alto, 0, 60, 76, 118);
await save(path.join(OUT, "aromaterapia-redondo-1.webp"), await cutoutShot(vRedondo, matteDarkBackground(vRedondo), 470));
await save(path.join(OUT, "aromaterapia-redondo-2.webp"), await cutoutShot(vRedondo, matteDarkBackground(vRedondo), 470, { hText: "8,6 cm", wText: "8,2 cm" }));
await save(path.join(OUT, "aromaterapia-alto-1.webp"), await cutoutShot(vAlto, matteDarkBackground(vAlto), 640));
await save(path.join(OUT, "aromaterapia-alto-2.webp"), await cutoutShot(vAlto, matteDarkBackground(vAlto), 640, { hText: "13,8 cm", wText: "6,9 cm" }));

// kits (sem molde): areia, grafite e branco (recorte da foto que trazia os moldes embaixo)
await save(path.join(OUT, "aromaterapia-kit-areia.webp"), await squareShot(kitAreia, [0, 0, 220, 220]));
await save(path.join(OUT, "aromaterapia-kit-grafite.webp"), await squareShot(kitGrafite, [0, 0, 220, 220]));
await save(path.join(OUT, "aromaterapia-kit-branco.webp"), await squareShot(kitBranco, [0, 0, 220, 146]));
// capa da categoria (4:5)
await save(path.join(CAT, "aromaterapia.webp"), await sharp(await squareShot(kitAreia, [0, 0, 220, 220])).resize(900, 1100, { fit: "cover" }).webp({ quality: 84 }).toBuffer());
console.log("ok");

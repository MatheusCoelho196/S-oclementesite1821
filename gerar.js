/**
 * gerar.js — São Clemente
 *
 * Lê os produtos de /categorias/{slug}/produtos/*.json e gera o site
 * estático completo dentro de /dist — pronto pra ser publicado.
 *
 * Uso local:
 *   node gerar.js
 *
 * No Netlify:
 *   Build command:      node gerar.js
 *   Publish directory:   dist
 *   (já configurado em netlify.toml — não precisa mexer em nada)
 *
 * Estrutura de saída (/dist):
 *   dist/
 *   ├── index.html                        <- página principal (raiz do domínio)
 *   └── armarios-cozinha/
 *       ├── index.html                    <- vitrine da categoria
 *       └── produtos/
 *           ├── armario-aereo-cisne-120.html
 *           └── ...
 *
 * COMO ADICIONAR UM PRODUTO NOVO:
 *   1. Criar um arquivo em categorias/armarios-cozinha/produtos/nome-slug.json
 *      (copiar a estrutura de um produto existente como modelo)
 *   2. git add, git commit, git push
 *   3. Netlify re-gera e publica sozinho
 *
 * COMO ADICIONAR UMA CATEGORIA NOVA:
 *   1. Criar a pasta categorias/nome-da-categoria/produtos/ com os .json
 *   2. Adicionar uma linha no array CATEGORIAS abaixo
 *   3. git push — a home page ganha o card novo automaticamente
 */

const fs = require("fs");
const path = require("path");

const WHATSAPP_NUMERO = "5519988345207";
const WHATSAPP_GENERICO = `https://wa.me/${WHATSAPP_NUMERO}`;
const WHATSAPP_MSG_PRODUTO = encodeURIComponent("Olá, gostaria de ver este produto.");
const WHATSAPP_PRODUTO = `https://wa.me/${WHATSAPP_NUMERO}?text=${WHATSAPP_MSG_PRODUTO}`;

// Uma entrada por categoria. Pra adicionar uma nova, é só somar uma linha aqui.
const CATEGORIAS = [
  { slug: "armarios-cozinha", nome: "Armários de Cozinha" },
];

// Cores conhecidas do catálogo — usadas só pra desenhar a pastilha visual
const CORES_HEX = {
  "Branco": "#FFFFFF",
  "Cinza": "#B0B0AC",
  "Preto": "#1C1C1C",
  "Grafite": "#2B2B2B",
};

function montarSwatches(cores) {
  if (!cores || !cores.length) return "";
  return cores
    .map((cor) => {
      const hex = CORES_HEX[cor] || "#CCCCCC";
      return `<button type="button" class="swatch" style="background:${hex}" title="${cor}" aria-label="Ver cor ${cor}"></button>`;
    })
    .join("");
}

const BASE_DIR = __dirname;
const DIST_DIR = path.join(__dirname, "dist");
const LOGO_SVG = fs.readFileSync(path.join(__dirname, "logo-placeholder.svg"), "utf-8");

function lerTemplate(nome) {
  return fs.readFileSync(path.join(BASE_DIR, "templates", nome), "utf-8");
}

function carregarProdutos(produtosDir) {
  return fs
    .readdirSync(produtosDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(produtosDir, f), "utf-8")));
}

function gerarLPIndividual(produto, templateProduto, outDir) {
  const cores = Object.keys(produto.fotos);
  const fotoPadrao = produto.fotos[cores[0]];

  const html = templateProduto
    .replaceAll("{{NOME}}", produto.nome)
    .replaceAll("{{PRECO}}", produto.preco)
    .replaceAll("{{DESCRICAO}}", produto.descricao || "")
    .replaceAll("{{FOTO}}", fotoPadrao)
    .replaceAll("{{SWATCHES}}", montarSwatches(cores))
    .replaceAll("{{FOTOS_JSON}}", JSON.stringify(produto.fotos))
    .replaceAll("{{LOGO_SVG}}", LOGO_SVG)
    .replaceAll("{{WHATSAPP_GENERICO}}", WHATSAPP_GENERICO)
    .replaceAll("{{WHATSAPP_PRODUTO}}", WHATSAPP_PRODUTO);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${produto.slug}.html`), html);
}

function gerarSlide(produto, cor) {
  const foto = produto.fotos[cor];
  const cores = Object.keys(produto.fotos);
  const info = Buffer.from(
    JSON.stringify({ nome: produto.nome, descricao: produto.descricao || "", cores })
  ).toString("base64");

  return `
    <a class="slide" href="./produtos/${produto.slug}.html">
      <div class="foto-container">
        <img src="${foto}" alt="${produto.nome} — ${cor}" loading="lazy"
          data-info="${info}"
          onclick="event.preventDefault(); event.stopPropagation(); abrirModalVitrine(this)" />
      </div>
      <h2>${produto.nome}</h2>
      <p class="cor">${cor}</p>
      <p class="preco">${produto.preco}</p>
    </a>`;
}

function gerarVitrine(categoria, produtos, templateVitrine, outDir) {
  const slides = produtos
    .flatMap((p) => Object.keys(p.fotos).map((cor) => gerarSlide(p, cor)))
    .join("\n");

  const html = templateVitrine
    .replaceAll("{{CATEGORIA}}", categoria.nome)
    .replaceAll("{{SLIDES}}", slides)
    .replaceAll("{{LOGO_SVG}}", LOGO_SVG)
    .replaceAll("{{WHATSAPP_GENERICO}}", WHATSAPP_GENERICO)
    .replaceAll("{{WHATSAPP_PRODUTO}}", WHATSAPP_PRODUTO);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html);

  // Foto representativa da categoria = primeira cor do primeiro produto
  const primeiro = produtos[0];
  const primeiraCor = Object.keys(primeiro.fotos)[0];
  return primeiro.fotos[primeiraCor];
}

function gerarCategoriaCard(categoria, foto) {
  return `
    <a class="categoria-card" href="/${categoria.slug}/">
      <div class="foto-container">
        <img src="${foto}" alt="${categoria.nome}" loading="lazy" />
      </div>
      <h2>${categoria.nome}</h2>
    </a>`;
}

function gerarHomepage(cards, templateHome) {
  const html = templateHome
    .replaceAll("{{CATEGORIAS_CARDS}}", cards.join("\n"))
    .replaceAll("{{LOGO_SVG}}", LOGO_SVG)
    .replaceAll("{{WHATSAPP_GENERICO}}", WHATSAPP_GENERICO);

  fs.mkdirSync(DIST_DIR, { recursive: true });
  fs.writeFileSync(path.join(DIST_DIR, "index.html"), html);
}

function main() {
  // Limpa o dist antigo pra nunca sobrar lixo de produtos removidos
  fs.rmSync(DIST_DIR, { recursive: true, force: true });

  const templateProduto = lerTemplate("template-produto.html");
  const templateVitrine = lerTemplate("template-vitrine.html");
  const templateHome = lerTemplate("template-home.html");

  const cardsHomepage = [];

  CATEGORIAS.forEach((categoria) => {
    const produtosDir = path.join(BASE_DIR, "categorias", categoria.slug, "produtos");
    const produtos = carregarProdutos(produtosDir);
    const categoriaOutDir = path.join(DIST_DIR, categoria.slug);

    produtos.forEach((p) =>
      gerarLPIndividual(p, templateProduto, path.join(categoriaOutDir, "produtos"))
    );
    const fotoRepresentativa = gerarVitrine(categoria, produtos, templateVitrine, categoriaOutDir);
    cardsHomepage.push(gerarCategoriaCard(categoria, fotoRepresentativa));

    console.log(`✅ ${produtos.length} LPs geradas em /dist/${categoria.slug}/produtos`);
    console.log(`✅ Vitrine gerada em /dist/${categoria.slug}/index.html`);
  });

  gerarHomepage(cardsHomepage, templateHome);
  console.log(`✅ Página principal gerada em /dist/index.html`);
}

main();

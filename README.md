# São Clemente — site de vendas

Site estático gerado a partir de arquivos JSON — sem banco de dados, sem CMS.
Cada produto é um arquivo, cada categoria é uma pasta.

## Estrutura

```
sao-clemente/
├── gerar.js                          <- gerador (não precisa mexer no dia a dia)
├── netlify.toml                      <- configuração de build do Netlify
├── logo-placeholder.svg              <- trocar pelo logo oficial quando tiver
├── templates/                        <- os 3 layouts do site (edita aqui pra mudar visual)
│   ├── template-home.html
│   ├── template-vitrine.html
│   └── template-produto.html
├── categorias/
│   └── armarios-cozinha/
│       └── produtos/                 <- UM ARQUIVO .JSON POR PRODUTO
│           ├── armario-aereo-cisne-120.json
│           ├── gabinete-cisne-120.json
│           └── ...
└── dist/                             <- gerado automaticamente, NÃO editar à mão
```

## Como adicionar um produto novo

1. Dentro de `categorias/armarios-cozinha/produtos/`, cria um arquivo novo, ex:
   `torre-quente-cisne.json`

2. Copia a estrutura de um produto existente:

```json
{
  "slug": "torre-quente-cisne",
  "nome": "Torre Quente em Madeira Cisne",
  "preco": "R$ 1.100,00",
  "descricao": "Descrição do produto aqui.",
  "fotos": {
    "Branco": "https://imagens-plataforma.cozimax.com.br/CODIGO_1.jpg",
    "Cinza": "https://imagens-plataforma.cozimax.com.br/CODIGO_1.jpg",
    "Preto": "https://imagens-plataforma.cozimax.com.br/CODIGO_1.jpg"
  }
}
```

3. `git add .`, `git commit -m "novo produto"`, `git push`

4. Pronto — o Netlify builda e publica sozinho. Não precisa rodar nada manualmente.

## Como adicionar uma categoria nova (ex: Banheiro)

1. Cria a pasta `categorias/banheiro/produtos/` com os `.json` dos produtos dessa categoria

2. Abre `gerar.js` e adiciona uma linha no array `CATEGORIAS`:

```js
const CATEGORIAS = [
  { slug: "armarios-cozinha", nome: "Armários de Cozinha" },
  { slug: "banheiro", nome: "Banheiro" },   // <- nova linha
];
```

3. `git push` — a página principal ganha um card novo automaticamente, com sua própria vitrine e LPs.

## Testar localmente antes de subir (opcional)

Se quiser ver o resultado antes do `git push`:

```
node gerar.js
```

Isso gera a pasta `dist/` local — abre `dist/index.html` no navegador pra conferir.

## Deploy no Netlify (configuração inicial, só uma vez)

1. Conectar o repositório do GitHub ao Netlify
2. Build command: `node gerar.js` (já vem configurado em `netlify.toml`)
3. Publish directory: `dist` (idem)
4. Não precisa mexer em mais nada — todo `git push` na branch principal already dispara um novo deploy

## Onde mexer pra mudar cada coisa

| Quero mudar...                          | Edito em...                              |
|------------------------------------------|-------------------------------------------|
| Preço, foto ou nome de um produto        | `categorias/{categoria}/produtos/*.json`  |
| Número de WhatsApp                       | `gerar.js` → `WHATSAPP_NUMERO`            |
| Mensagem pré-preenchida do WhatsApp      | `gerar.js` → `WHATSAPP_MSG_PRODUTO`       |
| Cores da marca, tipografia, layout       | `templates/*.html`                        |
| Nome/slug de uma categoria               | `gerar.js` → array `CATEGORIAS`           |
| Logo                                      | `logo-placeholder.svg`                    |

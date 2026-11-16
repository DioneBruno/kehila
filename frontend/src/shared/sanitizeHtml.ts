/**
 * Sanitizador de HTML por lista de permissões (allowlist), para conteúdo vindo do
 * editor Quill (ex.: descrição de eventos) antes de usar com v-html.
 * Remove scripts, handlers on*, URLs javascript:/data: e qualquer tag/atributo fora da lista.
 */

const TAGS_PERMITIDAS = new Set([
  "p",
  "br",
  "span",
  "div",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "sub",
  "sup",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
  "code",
  "ol",
  "ul",
  "li",
  "a",
  "img",
  "hr",
  "iframe",
]);

// Tags removidas junto com todo o conteúdo interno.
const TAGS_REMOVIDAS_COM_CONTEUDO = new Set([
  "script",
  "style",
  "noscript",
  "template",
  "object",
  "embed",
  "svg",
  "math",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "link",
  "meta",
  "base",
  "frame",
  "frameset",
]);

const ATRIBUTOS_PERMITIDOS: Record<string, Set<string>> = {
  "*": new Set(["class", "style", "data-list", "spellcheck"]),
  a: new Set(["href", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height"]),
  iframe: new Set(["src", "frameborder", "allowfullscreen", "width", "height"]),
};

const HOSTS_IFRAME_PERMITIDOS = [
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
];

function urlSegura(valor: string, permitirDataImagem = false): boolean {
  // Remove caracteres de controle/espaços usados para ofuscar "javascript:".
  const v = valor
    .trim()
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F\s]+/g, "")
    .toLowerCase();
  if (v.startsWith("javascript:") || v.startsWith("vbscript:")) return false;
  if (v.startsWith("data:"))
    return permitirDataImagem && /^data:image\/(png|jpe?g|gif|webp);/.test(v);
  return true;
}

function iframeSeguro(src: string): boolean {
  try {
    const url = new URL(src, window.location.origin);
    return url.protocol === "https:" && HOSTS_IFRAME_PERMITIDOS.includes(url.hostname);
  } catch {
    return false;
  }
}

function estiloSeguro(estilo: string): boolean {
  const v = estilo.toLowerCase();
  return (
    !v.includes("url(") &&
    !v.includes("expression") &&
    !v.includes("javascript:") &&
    !v.includes("@import")
  );
}

function limparElemento(elemento: Element): void {
  for (const filho of Array.from(elemento.children)) {
    const tag = filho.tagName.toLowerCase();

    if (TAGS_REMOVIDAS_COM_CONTEUDO.has(tag)) {
      filho.remove();
      continue;
    }

    if (!TAGS_PERMITIDAS.has(tag)) {
      // Mantém o texto/filhos, remove só a tag.
      limparElemento(filho);
      filho.replaceWith(...Array.from(filho.childNodes));
      continue;
    }

    const permitidos = ATRIBUTOS_PERMITIDOS[tag] ?? new Set<string>();
    for (const atributo of Array.from(filho.attributes)) {
      const nome = atributo.name.toLowerCase();
      const valor = atributo.value;
      const permitido = ATRIBUTOS_PERMITIDOS["*"]!.has(nome) || permitidos.has(nome);
      if (!permitido || nome.startsWith("on")) {
        filho.removeAttribute(atributo.name);
        continue;
      }
      if (nome === "href" && !urlSegura(valor)) filho.removeAttribute(atributo.name);
      if (nome === "src" && tag === "img" && !urlSegura(valor, true))
        filho.removeAttribute(atributo.name);
      if (nome === "style" && !estiloSeguro(valor)) filho.removeAttribute(atributo.name);
    }

    if (tag === "iframe" && !iframeSeguro(filho.getAttribute("src") ?? "")) {
      filho.remove();
      continue;
    }

    if (tag === "a" && filho.getAttribute("target") === "_blank") {
      filho.setAttribute("rel", "noopener noreferrer");
    }

    limparElemento(filho);
  }
}

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    // Sem DOM disponível: não renderiza HTML, apenas texto.
    return String(html).replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  const documento = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  limparElemento(documento.body);
  return documento.body.innerHTML;
}

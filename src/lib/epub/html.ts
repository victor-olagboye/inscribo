type Mark = { type: string; attrs?: Record<string, unknown> };

export type PMNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  marks?: Mark[];
  text?: string;
};

// characters that are illegal in XML 1.0
// eslint-disable-next-line no-control-regex
const ILLEGAL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;

export const esc = (s: string) =>
  s.replace(ILLEGAL, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const escAttr = (s: string) => esc(s).replace(/"/g, "&quot;");

function renderText(node: PMNode): string {
  let out = esc(node.text ?? "");
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case "bold":
        out = `<strong>${out}</strong>`;
        break;
      case "italic":
        out = `<em>${out}</em>`;
        break;
      case "underline":
        out = `<u>${out}</u>`;
        break;
      case "highlight":
        out = `<mark>${out}</mark>`;
        break;
      case "subscript":
        out = `<sub>${out}</sub>`;
        break;
      case "superscript":
        out = `<sup>${out}</sup>`;
        break;
      case "strike":
        out = `<s>${out}</s>`;
        break;
      case "code":
        out = `<code>${out}</code>`;
        break;
      case "link": {
        const href = String(mark.attrs?.href ?? "");
        if (/^(https?:|mailto:)/i.test(href))
          out = `<a href="${escAttr(href)}">${out}</a>`;
        break;
      }
      // textStyle (font family) is intentionally dropped: readers choose their own font
    }
  }
  return out;
}

function inline(nodes?: PMNode[]): string {
  return (nodes ?? [])
    .map((n) => (n.type === "text" ? renderText(n) : n.type === "hardBreak" ? "<br/>" : ""))
    .join("");
}

const ALIGNS = new Set(["center", "right", "justify"]);

function alignClass(node: PMNode): string {
  const a = node.attrs?.textAlign;
  return typeof a === "string" && ALIGNS.has(a) ? ` class="align-${a}"` : "";
}

function block(node: PMNode): string {
  const children = () => (node.content ?? []).map(block).join("");

  switch (node.type) {
    case "paragraph": {
      const html = inline(node.content);
      return html.trim() ? `<p${alignClass(node)}>${html}</p>` : "";
    }
    case "heading": {
      const level = Math.min(Math.max(Number(node.attrs?.level) || 2, 2), 6);
      return `<h${level}${alignClass(node)}>${inline(node.content)}</h${level}>`;
    }
    case "blockquote":
      return `<blockquote>${children()}</blockquote>`;
    case "bulletList":
      return `<ul>${children()}</ul>`;
    case "orderedList":
      return `<ol>${children()}</ol>`;
    case "listItem":
      return `<li>${children()}</li>`;
    case "horizontalRule":
      return `<hr class="scene-break"/>`;
    case "codeBlock":
      return `<pre><code>${esc((node.content ?? []).map((n) => n.text ?? "").join(""))}</code></pre>`;
    default:
      return children();
  }
}

export function docToXhtml(doc: unknown): string {
  const root = doc as PMNode | null;
  if (!root || !Array.isArray(root.content)) return "";
  return root.content.map(block).join("\n");
}
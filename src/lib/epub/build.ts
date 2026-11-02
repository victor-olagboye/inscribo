import JSZip from "jszip";
import { docToXhtml, esc } from "./html";

export type EpubBook = {
  id: string;
  title: string;
  subtitle: string | null;
  author: string | null;
  language: string | null;
  isbn: string | null;
};

export type EpubChapter = {
  id: string;
  title: string;
  type: string;
  content: unknown;
};

export type EpubCover = { data: ArrayBuffer; type: "image/jpeg" | "image/png" };

const CSS = `body { margin: 0 5%; line-height: 1.5; }
h1 { font-size: 1.6em; line-height: 1.2; text-align: center; margin: 2.5em 0 1.5em; }
h2 { font-size: 1.3em; line-height: 1.3; margin: 1.8em 0 0.8em; }
p { margin: 0; text-indent: 1.4em; }
h1 + p, h2 + p, hr + p, blockquote + p { text-indent: 0; }
p.align-center { text-align: center; text-indent: 0; }
p.align-right { text-align: right; text-indent: 0; }
p.align-justify { text-align: justify; }
blockquote { margin: 1.5em 1.5em; font-style: italic; }
blockquote p { text-indent: 0; }
ul, ol { margin: 1em 0; padding-left: 1.5em; }
hr.scene-break { border: 0; margin: 2em 0; text-align: center; }
hr.scene-break::after { content: "\\2042"; letter-spacing: 0.5em; }
.title-page { text-align: center; margin-top: 30%; }
.title-page h1 { margin: 0 0 0.5em; font-size: 2.2em; }
.title-page .subtitle { text-indent: 0; font-style: italic; font-size: 1.2em; margin-bottom: 3em; }
.title-page .author { text-indent: 0; letter-spacing: 0.1em; text-transform: uppercase; }
nav ol { list-style: none; padding: 0; }
nav li { margin: 0.6em 0; }
.cover { text-align: center; margin: 0; }
.cover img { max-width: 100%; max-height: 95vh; }
`;

function lang(code: string | null): string {
  return code && /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(code) ? code : "en";
}

function hasText(doc: unknown): boolean {
  return /"text":"[^"]/.test(JSON.stringify(doc ?? ""));
}

function page(title: string, body: string, language: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${language}" xml:lang="${language}">
<head>
<meta charset="utf-8"/>
<title>${esc(title)}</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
${body}
</body>
</html>`;
}

type Item = {
  id: string;
  href: string;
  title: string;
  xhtml: string;
  inToc: boolean;
  isBody: boolean;
};

export async function buildEpub(
  book: EpubBook,
  chapters: EpubChapter[],
  cover?: EpubCover,
): Promise<ArrayBuffer> {
  const language = lang(book.language);
  const items: Item[] = [];

  // auto title page unless the author wrote their own "Title Page" with content
  const own = chapters.find(
    (c) => c.type === "front" && c.title === "Title Page",
  );
  if (!own || !hasText(own.content)) {
    const body = `<div class="title-page">
<h1>${esc(book.title)}</h1>
${book.subtitle ? `<p class="subtitle">${esc(book.subtitle)}</p>` : ""}
${book.author ? `<p class="author">${esc(book.author)}</p>` : ""}
</div>`;
    items.push({
      id: "titlepage",
      href: "title.xhtml",
      title: book.title,
      xhtml: page(book.title, body, language),
      inToc: false,
      isBody: false,
    });
  }

  chapters.forEach((c, i) => {
    if (c.type === "front" && !hasText(c.content)) return; // skip empty front matter

    const heading = c.type === "front" ? "" : `<h1>${esc(c.title)}</h1>\n`;
    const body = heading + docToXhtml(c.content);

    items.push({
      id: `ch${i + 1}`,
      href: `ch${String(i + 1).padStart(3, "0")}.xhtml`,
      title: c.title,
      xhtml: page(c.title, body, language),
      inToc: c.type !== "front",
      isBody: c.type === "body",
    });
  });

  const coverExt = cover?.type === "image/png" ? "png" : "jpg";
  if (cover) {
    items.unshift({
      id: "cover",
      href: "cover.xhtml",
      title: "Cover",
      xhtml: page(
        "Cover",
        `<div class="cover"><img src="cover.${coverExt}" alt="Cover"/></div>`,
        language,
      ),
      inToc: false,
      isBody: false,
    });
  }

  const toc = items.filter((i) => i.inToc);
  const firstBody = items.find((i) => i.isBody) ?? toc[0];

  const nav = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${language}" xml:lang="${language}">
<head>
<meta charset="utf-8"/>
<title>Contents</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
<nav epub:type="toc" id="toc">
<h1>Contents</h1>
<ol>
${toc.map((i) => `<li><a href="${i.href}">${esc(i.title)}</a></li>`).join("\n")}
</ol>
</nav>
<nav epub:type="landmarks" hidden="hidden">
<ol>
<li><a epub:type="bodymatter" href="${firstBody.href}">Start of content</a></li>
</ol>
</nav>
</body>
</html>`;

  const isbn = book.isbn?.trim().replace(/-/g, "");
  const isbnTag =
    isbn && /^[\dXx]{10,13}$/.test(isbn)
      ? `<dc:identifier>urn:isbn:${esc(isbn)}</dc:identifier>`
      : "";
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${language}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="book-id">urn:uuid:${esc(book.id)}</dc:identifier>
${isbnTag}
<dc:title>${esc(book.title)}</dc:title>
${book.author ? `<dc:creator>${esc(book.author)}</dc:creator>` : ""}
<dc:language>${language}</dc:language>
${cover ? `<meta name="cover" content="cover-image"/>` : ""}
<meta property="dcterms:modified">${modified}</meta>
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="css" href="style.css" media-type="text/css"/>
${cover ? `<item id="cover-image" href="cover.${coverExt}" media-type="${cover.type}" properties="cover-image"/>` : ""}
${items.map((i) => `<item id="${i.id}" href="${i.href}" media-type="application/xhtml+xml"/>`).join("\n")}
</manifest>
<spine>
${items.map((i) => `<itemref idref="${i.id}"/>`).join("\n")}
</spine>
</package>`;

  const zip = new JSZip();
  // the mimetype file must be first and stored uncompressed
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles>
<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
</rootfiles>
</container>`,
  );
  zip.file("OEBPS/content.opf", opf);
  zip.file("OEBPS/nav.xhtml", nav);
  zip.file("OEBPS/style.css", CSS);
  if (cover) zip.file(`OEBPS/cover.${coverExt}`, cover.data);
  for (const i of items) zip.file(`OEBPS/${i.href}`, i.xhtml);

  return zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
}
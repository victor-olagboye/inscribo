import { createClient } from "@/lib/supabase/server";
import { sortChapters } from "@/lib/chapters";
import { buildEpub, type EpubCover } from "@/lib/epub/build";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: book } = await supabase
    .from("books")
    .select("id, title, subtitle, author, language, isbn, cover_path")
    .eq("id", id)
    .maybeSingle();
  if (!book) return new Response("Not found", { status: 404 });

  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, title, type, position, content")
    .eq("book_id", id)
    .order("position");
  if (error) return new Response(error.message, { status: 500 });

  const sorted = sortChapters(chapters ?? []);
  if (!sorted.some((c) => c.type === "body")) {
    return new Response("Add at least one chapter before exporting.", {
      status: 400,
    });
  }

  let cover: EpubCover | undefined;
  if (book.cover_path) {
    const { data: blob } = await supabase.storage
      .from("covers")
      .download(book.cover_path);
    if (blob) {
      cover = {
        data: await blob.arrayBuffer(),
        type: book.cover_path.endsWith(".png") ? "image/png" : "image/jpeg",
      };
    }
  }

  const file = await buildEpub(book, sorted, cover);

  const slug =
    book.title
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase() || "book";

  return new Response(file, {
    headers: {
      "Content-Type": "application/epub+zip",
      "Content-Disposition": `attachment; filename="${slug}.epub"`,
    },
  });
}

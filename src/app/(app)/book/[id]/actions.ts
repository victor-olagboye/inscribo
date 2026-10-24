"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MATTER_PRESETS } from "@/lib/chapters";

function refresh(bookId: string) {
  revalidatePath(`/book/${bookId}`);
  revalidatePath("/library");
}

function textDoc(text: string) {
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}

async function nextPosition(bookId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chapters")
    .select("position")
    .eq("book_id", bookId)
    .order("position", { ascending: false })
    .limit(1);
  return (data?.[0]?.position ?? -1) + 1;
}

export async function addChapter(bookId: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("chapters")
    .select("id", { count: "exact", head: true })
    .eq("book_id", bookId)
    .eq("type", "body");

  const { error } = await supabase.from("chapters").insert({
    book_id: bookId,
    type: "body",
    position: await nextPosition(bookId),
    title: `Chapter ${(count ?? 0) + 1}`,
  });
  if (error) throw new Error(error.message);
  refresh(bookId);
}

export async function addMatter(bookId: string, key: string) {
  const preset = MATTER_PRESETS.find((p) => p.key === key);
  if (!preset) throw new Error("Unknown section");

  const supabase = await createClient();

  let content: object | undefined;
  let word_count = 0;

  if (preset.key === "copyright") {
    const { data: book } = await supabase
      .from("books")
      .select("author")
      .eq("id", bookId)
      .maybeSingle();
    const text = `© ${new Date().getFullYear()} ${book?.author ?? "Author"}. All rights reserved.`;
    content = textDoc(text);
    word_count = text.split(/\s+/).length;
  }

  const { error } = await supabase.from("chapters").insert({
    book_id: bookId,
    type: preset.type,
    title: preset.title,
    position: await nextPosition(bookId),
    ...(content ? { content, word_count } : {}),
  });
  if (error) throw new Error(error.message);
  refresh(bookId);
}

export async function updateBook(bookId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim() || "Untitled book";
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;
  const author = String(formData.get("author") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("books")
    .update({ title, subtitle, author })
    .eq("id", bookId);
  if (error) throw new Error(error.message);
  refresh(bookId);
}

export async function deleteChapter(bookId: string, chapterId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("chapters")
    .delete()
    .eq("id", chapterId)
    .eq("book_id", bookId);
  if (error) throw new Error(error.message);
  refresh(bookId);
}

export async function moveChapter(
  bookId: string,
  chapterId: string,
  direction: "up" | "down",
) {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("chapters")
    .select("id, position, type")
    .eq("book_id", bookId)
    .order("position");
  if (error || !rows)
    throw new Error(error?.message ?? "Could not load chapters");

  const target = rows.find((r) => r.id === chapterId);
  if (!target) return;

  const group = rows.filter((r) => r.type === target.type);
  const from = group.findIndex((r) => r.id === chapterId);
  const to = direction === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= group.length) return;

  const a = group[from];
  const b = group[to];

  const results = await Promise.all([
    supabase.from("chapters").update({ position: b.position }).eq("id", a.id),
    supabase.from("chapters").update({ position: a.position }).eq("id", b.id),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  refresh(bookId);
}

export async function deleteBook(bookId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("books").delete().eq("id", bookId);
  if (error) throw new Error(error.message);
  revalidatePath("/library");
  redirect("/library");
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function refresh(bookId: string) {
  revalidatePath(`/book/${bookId}`);
  revalidatePath("/library");
}

export async function addChapter(bookId: string) {
  const supabase = await createClient();

  const { data: last } = await supabase
    .from("chapters")
    .select("position")
    .eq("book_id", bookId)
    .order("position", { ascending: false })
    .limit(1);

  const position = (last?.[0]?.position ?? -1) + 1;

  const { error } = await supabase.from("chapters").insert({
    book_id: bookId,
    position,
    title: `Chapter ${position + 1}`,
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
    .select("id")
    .eq("book_id", bookId)
    .order("position");
  if (error || !rows)
    throw new Error(error?.message ?? "Could not load chapters");

  const ids = rows.map((r) => r.id);
  const from = ids.indexOf(chapterId);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= ids.length) return;

  [ids[from], ids[to]] = [ids[to], ids[from]];

  const results = await Promise.all(
    ids.map((id, position) =>
      supabase
        .from("chapters")
        .update({ position })
        .eq("id", id)
        .eq("book_id", bookId),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  refresh(bookId);
}

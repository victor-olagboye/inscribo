import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChapterEditor } from "@/components/editor/chapter-editor";
import { sortChapters } from "@/lib/chapters";

async function Write({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>;
}) {
  const { id, chapterId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: book }, { data: chapters }, { data: chapter }] =
    await Promise.all([
      supabase.from("books").select("id, title").eq("id", id).maybeSingle(),
      supabase
        .from("chapters")
        .select("id, title, word_count type, position")
        .eq("book_id", id)
        .order("position"),
      supabase
        .from("chapters")
        .select("id, title, content, word_count")
        .eq("id", chapterId)
        .eq("book_id", id)
        .maybeSingle(),
    ]);

  if (!book || !chapter) notFound();

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 flex-shrink-0 flex flex-col bg-surface-container-low">
        <div className="p-space-lg">
          <Link
            href={`/book/${id}`}
            className="inline-flex items-center gap-1 font-ui-small text-ui-small text-on-surface-variant hover:text-primary transition-colors mb-space-md"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            book overview
          </Link>
          <span className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
            manuscript
          </span>
          <span className="block font-title-editorial text-ui-medium text-on-surface truncate">
            {book.title}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-space-sm space-y-1 pb-space-lg">
          {(() => {
            let n = 0;
            return sortChapters(chapters ?? []).map((c) => {
              const numbered = c.type === "body";
              if (numbered) n += 1;
              const active = c.id === chapterId;
              return (
                <Link
                  key={c.id}
                  href={`/book/${id}/write/${c.id}`}
                  className={`flex items-center justify-between px-space-md py-2 rounded-lg transition-colors ${
                    active
                      ? "bg-surface-container-highest text-on-surface font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className={`font-ui-small text-ui-small ${active ? "text-primary" : "text-outline"}`}
                    >
                      {numbered ? String(n).padStart(2, "0") : "·"}
                    </span>
                    <span className="font-ui-medium text-ui-medium truncate">
                      {c.title}
                    </span>
                  </span>
                </Link>
              );
            });
          })()}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-8">
        <div className="max-w-2xl mx-auto">
          <ChapterEditor
            key={chapter.id}
            chapterId={chapter.id}
            initialTitle={chapter.title}
            initialContent={chapter.content}
            initialWords={chapter.word_count}
          />
        </div>
      </main>
    </div>
  );
}

export default function WritePage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <p className="p-8 font-ui-small text-ui-small text-outline">
          loading...
        </p>
      }
    >
      <Write params={params} />
    </Suspense>
  );
}

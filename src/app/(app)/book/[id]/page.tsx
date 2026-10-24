import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MATTER_PRESETS, sortChapters } from "@/lib/chapters";
import {
  addChapter,
  addMatter,
  deleteBook,
  deleteChapter,
  moveChapter,
  updateBook,
} from "./actions";
import { ChapterActions } from "./chapter-actions";
import { DeleteBookButton } from "./delete-book-button";

async function Book({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: book } = await supabase
    .from("books")
    .select("id, title, subtitle, author, status")
    .eq("id", id)
    .maybeSingle();
  if (!book) notFound();

  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, title, word_count, position, type")
    .eq("book_id", id)
    .order("position");
  if (error) throw new Error(error.message);

  const rows = sortChapters(chapters ?? []);
  const groups = [
    {
      type: "front",
      heading: "front matter",
      items: rows.filter((r) => r.type === "front"),
    },
    {
      type: "body",
      heading: "chapters",
      items: rows.filter((r) => r.type === "body"),
    },
    {
      type: "back",
      heading: "back matter",
      items: rows.filter((r) => r.type === "back"),
    },
  ];

  const bodyCount = groups[1].items.length;
  const totalWords = rows.reduce((sum, c) => sum + c.word_count, 0);
  const existingTitles = new Set(rows.map((r) => r.title));

  const add = addChapter.bind(null, id);
  const save = updateBook.bind(null, id);
  const remove = deleteBook.bind(null, id);

  const input =
    "w-full h-10 px-space-md bg-surface-container-low focus:bg-surface-container-lowest rounded-lg font-ui-body text-ui-body text-on-surface placeholder:text-outline outline-none shadow-sm focus:shadow-md transition-colors";
  const label =
    "block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-1";

  return (
    <>
      <Link
        href="/library"
        className="inline-flex items-center gap-1 font-ui-small text-ui-small text-on-surface-variant hover:text-primary transition-colors mb-space-lg"
      >
        <span className="material-symbols-outlined text-[16px]">
          arrow_back
        </span>
        library
      </Link>

      <div className="flex flex-col gap-space-xs mb-space-xl">
        <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
          {book.status}
        </span>
        <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
          {book.title}
        </h1>
        {book.subtitle && (
          <p className="font-body-editorial-lg text-body-editorial-lg text-on-surface-variant italic">
            {book.subtitle}
          </p>
        )}
        <p className="font-ui-body text-ui-body text-on-surface-variant mt-1">
          {bodyCount} {bodyCount === 1 ? "chapter" : "chapters"} ·{" "}
          {totalWords.toLocaleString()} words
        </p>
      </div>

      <form
        action={save}
        className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg mb-space-xl grid grid-cols-1 sm:grid-cols-2 gap-space-md"
      >
        <div className="sm:col-span-2">
          <label className={label} htmlFor="title">
            title
          </label>
          <input
            id="title"
            name="title"
            defaultValue={book.title}
            className={input}
          />
        </div>
        <div>
          <label className={label} htmlFor="subtitle">
            subtitle
          </label>
          <input
            id="subtitle"
            name="subtitle"
            defaultValue={book.subtitle ?? ""}
            className={input}
          />
        </div>
        <div>
          <label className={label} htmlFor="author">
            author
          </label>
          <input
            id="author"
            name="author"
            defaultValue={book.author ?? ""}
            className={input}
          />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button className="h-9 px-space-md bg-primary hover:bg-primary-container text-on-primary font-ui-medium text-ui-small rounded-lg shadow-sm transition-all">
            save details
          </button>
        </div>
      </form>

      <div className="flex items-center justify-end gap-space-sm mb-space-md">
        <details className="relative">
          <summary className="h-9 px-space-md bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-ui-medium text-ui-small rounded-lg shadow-sm cursor-pointer list-none flex items-center gap-1.5 select-none">
            <span className="material-symbols-outlined text-[18px]">
              post_add
            </span>
            <span>front / back matter</span>
          </summary>
          <div className="absolute right-0 mt-1 w-56 bg-surface-container-lowest rounded-xl shadow-lg p-1 z-10">
            {MATTER_PRESETS.map((p) => (
              <form key={p.key} action={addMatter.bind(null, id, p.key)}>
                <button
                  disabled={existingTitles.has(p.title)}
                  className="w-full flex items-center justify-between px-space-md py-2 rounded-lg text-left font-ui-medium text-ui-small text-on-surface hover:bg-surface-container-low disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span>{p.title}</span>
                  <span className="font-label-caps text-[10px] uppercase text-outline">
                    {p.type}
                  </span>
                </button>
              </form>
            ))}
          </div>
        </details>
      </div>

      {groups.map((g) => {
        if (g.type !== "body" && g.items.length === 0) return null;
        return (
          <div
            key={g.type}
            className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg mb-space-lg"
          >
            <div className="flex items-center justify-between mb-space-md">
              <h2 className="font-title-editorial text-title-editorial text-on-surface">
                {g.heading}
              </h2>
              {g.type === "body" && (
                <form action={add}>
                  <button className="h-9 px-space-md bg-primary hover:bg-primary-container text-on-primary font-ui-medium text-ui-small rounded-lg shadow-sm transition-all flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">
                      add
                    </span>
                    <span>add chapter</span>
                  </button>
                </form>
              )}
            </div>

            {g.items.length === 0 ? (
              <p className="font-ui-small text-ui-small text-on-surface-variant py-space-lg text-center">
                no chapters yet. add your first one.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-surface-container-high/60">
                {g.items.map((c, i) => (
                  <div
                    key={c.id}
                    className="group py-2 px-2 flex items-center justify-between gap-space-md rounded-lg hover:bg-surface-container-low/50 transition-colors"
                  >
                    <Link
                      href={`/book/${id}/write/${c.id}`}
                      className="flex items-center gap-space-md min-w-0 flex-1 py-1"
                    >
                      <span className="font-label-caps text-[11px] text-on-surface-variant/70 w-6">
                        {g.type === "body"
                          ? String(i + 1).padStart(2, "0")
                          : "·"}
                      </span>
                      <span className="font-title-editorial text-[16px] text-on-surface group-hover:text-primary transition-colors truncate">
                        {c.title}
                      </span>
                    </Link>
                    <span className="font-ui-small text-ui-small text-on-surface-variant/60 shrink-0">
                      {c.word_count.toLocaleString()} words
                    </span>
                    <ChapterActions
                      title={c.title}
                      isFirst={i === 0}
                      isLast={i === g.items.length - 1}
                      up={moveChapter.bind(null, id, c.id, "up")}
                      down={moveChapter.bind(null, id, c.id, "down")}
                      remove={deleteChapter.bind(null, id, c.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-space-xl flex items-center justify-between gap-space-md rounded-xl bg-error-container/30 p-space-lg">
        <div>
          <p className="font-ui-medium text-ui-medium text-on-surface">
            delete this book
          </p>
          <p className="font-ui-small text-ui-small text-on-surface-variant">
            removes the book and all its chapters permanently.
          </p>
        </div>
        <DeleteBookButton title={book.title} action={remove} />
      </div>
    </>
  );
}

export default function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="px-gutter-lg py-space-xl max-w-4xl mx-auto w-full">
      <Suspense
        fallback={
          <p className="font-ui-small text-ui-small text-outline">loading...</p>
        }
      >
        <Book params={params} />
      </Suspense>
    </main>
  );
}

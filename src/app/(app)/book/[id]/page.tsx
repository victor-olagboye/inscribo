import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addChapter, deleteChapter, moveChapter, updateBook } from "./actions";
import { ChapterActions } from "./chapter-actions";

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
    .select("id, title, word_count, position")
    .eq("book_id", id)
    .order("position");
  if (error) throw new Error(error.message);

  const list = chapters ?? [];
  const totalWords = list.reduce((sum, c) => sum + c.word_count, 0);
  const add = addChapter.bind(null, id);
  const save = updateBook.bind(null, id);

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
          {list.length} chapters · {totalWords.toLocaleString()} words
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

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
        <div className="flex items-center justify-between mb-space-md">
          <h2 className="font-title-editorial text-title-editorial text-on-surface">
            chapters
          </h2>
          <form action={add}>
            <button className="h-9 px-space-md bg-primary hover:bg-primary-container text-on-primary font-ui-medium text-ui-small rounded-lg shadow-sm transition-all flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>add chapter</span>
            </button>
          </form>
        </div>

        {list.length === 0 ? (
          <p className="font-ui-small text-ui-small text-on-surface-variant py-space-lg text-center">
            no chapters yet. add your first one.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-surface-container-high/60">
            {list.map((c, i) => (
              <div
                key={c.id}
                className="group py-2 px-2 flex items-center justify-between gap-space-md rounded-lg hover:bg-surface-container-low/50 transition-colors"
              >
                <Link
                  href={`/book/${id}/write/${c.id}`}
                  className="flex items-center gap-space-md min-w-0 flex-1 py-1"
                >
                  <span className="font-label-caps text-[11px] text-on-surface-variant/70 w-6">
                    {String(i + 1).padStart(2, "0")}
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
                  isLast={i === list.length - 1}
                  up={moveChapter.bind(null, id, c.id, "up")}
                  down={moveChapter.bind(null, id, c.id, "down")}
                  remove={deleteChapter.bind(null, id, c.id)}
                />
              </div>
            ))}
          </div>
        )}
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

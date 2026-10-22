import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewBookButton } from "./new-book-button";
import { coverStyleFor } from "@/lib/cover-styles"; 
import Link from "next/link";
async function Library() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: books, error } = await supabase
    .from("books")
    .select("id, title, author, status, chapters(word_count)")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  const count = books?.length ?? 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-md mb-space-2xl">
        <div>
          <div className="flex items-baseline gap-space-sm">
            <h1 className="font-headline-lg text-headline-lg text-on-surface lowercase tracking-tight">
              library
            </h1>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
          </div>
          <p className="font-ui-body text-ui-body text-on-surface-variant mt-1">
            {count === 0
              ? "no books yet"
              : `${count} ${count === 1 ? "book" : "books"}`}
          </p>
        </div>
        <NewBookButton />
      </div>

      {count === 0 ? (
        <div className="rounded-xl bg-surface-container-low p-space-2xl text-center">
          <p className="font-title-editorial text-title-editorial text-on-surface">
            your shelf is empty
          </p>
          <p className="font-ui-small text-ui-small text-on-surface-variant mt-1">
            create your first book to start writing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {books!.map((book) => {
            const words = (book.chapters ?? []).reduce(
              (sum: number, c: { word_count: number }) => sum + c.word_count,
              0,
            );
            const chapters = book.chapters?.length ?? 0;
            const cover = coverStyleFor(book.id);
            return (
              <Link
                key={book.id}
                href={`/book/${book.id}`}
                className="group flex flex-col bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div
                  className="relative w-full aspect-[3/4] rounded-r-md rounded-l-sm overflow-hidden shadow-sm flex flex-col justify-between p-5 mb-4 group-hover:-translate-y-1.5 transition-transform duration-200"
                  style={{ backgroundColor: cover.bg }}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-3.5 bg-gradient-to-r ${cover.spine}`}
                  />
                  <div className="absolute left-3.5 top-0 bottom-0 w-px bg-black/10" />
                  <div className="relative z-10 pl-2">
                    <div
                      className="w-6 h-px mb-3"
                      style={{ backgroundColor: cover.rule }}
                    />
                    <h3
                      className="font-headline-md text-headline-md leading-tight line-clamp-4"
                      style={{ color: cover.title }}
                    >
                      {book.title}
                    </h3>
                  </div>
                  <p
                    className="relative z-10 pl-2 font-body-editorial text-ui-small italic"
                    style={{ color: cover.author }}
                  >
                    {book.author ?? ""}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h4 className="font-headline-md text-[17px] text-on-surface font-medium truncate">
                    {book.title}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-caps text-[10px] uppercase flex-shrink-0">
                    {book.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 bg-surface-container-low/40 rounded-lg px-2.5 py-1.5">
                  <span className="font-ui-small text-[11px] text-on-surface-variant">
                    {chapters} {chapters === 1 ? "chapter" : "chapters"}
                  </span>
                  <span className="font-ui-small text-[11px] text-on-surface-variant font-medium">
                    {words.toLocaleString()} words
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function LibraryPage() {
  return (
    <main className="px-gutter-lg py-space-xl max-w-7xl mx-auto w-full">
      <Suspense
        fallback={
          <p className="font-ui-small text-ui-small text-outline">loading...</p>
        }
      >
        <Library />
      </Suspense>
    </main>
  );
}

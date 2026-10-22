"use client";

type Action = () => Promise<void>;

export function ChapterActions({
  title,
  isFirst,
  isLast,
  up,
  down,
  remove,
}: {
  title: string;
  isFirst: boolean;
  isLast: boolean;
  up: Action;
  down: Action;
  remove: Action;
}) {
  const btn =
    "w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-30 disabled:pointer-events-none";

  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
      <form action={up}>
        <button className={btn} disabled={isFirst} title="Move up">
          <span className="material-symbols-outlined text-[18px]">
            arrow_upward
          </span>
        </button>
      </form>
      <form action={down}>
        <button className={btn} disabled={isLast} title="Move down">
          <span className="material-symbols-outlined text-[18px]">
            arrow_downward
          </span>
        </button>
      </form>
      <form
        action={remove}
        onSubmit={(e) => {
          if (!confirm(`Delete "${title}"? This can't be undone.`))
            e.preventDefault();
        }}
      >
        <button className={`${btn} hover:!text-error`} title="Delete chapter">
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </form>
    </div>
  );
}

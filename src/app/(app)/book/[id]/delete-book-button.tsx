"use client";

export function DeleteBookButton({
  title,
  action,
}: {
  title: string;
  action: () => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete "${title}" and all its chapters? This can't be undone.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button className="h-9 px-space-md rounded-lg bg-error text-on-error font-ui-medium text-ui-small hover:opacity-90 transition-opacity flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[18px]">delete</span>
        <span>delete book</span>
      </button>
    </form>
  );
}

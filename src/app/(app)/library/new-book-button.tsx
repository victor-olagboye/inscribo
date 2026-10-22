"use client";

import { useState } from "react";
import { createBook } from "./actions";

export function NewBookButton() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-9 px-space-md bg-primary hover:bg-primary-container text-on-primary font-ui-medium text-ui-small rounded-lg shadow-sm transition-all flex items-center gap-1.5 group"
      >
        <span className="material-symbols-outlined text-[18px] transition-transform group-hover:rotate-90 duration-200">
          add
        </span>
        <span>new book</span>
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        setPending(true);
        await createBook(fd);
        setPending(false);
        setOpen(false);
      }}
      className="flex items-center gap-space-sm"
    >
      <input
        name="title"
        autoFocus
        placeholder="book title"
        className="h-9 px-space-md w-56 bg-surface-container-lowest rounded-lg shadow-sm font-ui-body text-ui-small outline-none focus:shadow-md"
      />
      <button
        disabled={pending}
        className="h-9 px-space-md bg-primary text-on-primary font-ui-medium text-ui-small rounded-lg disabled:opacity-50"
      >
        {pending ? "..." : "create"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="h-9 px-space-sm text-on-surface-variant font-ui-small text-ui-small hover:text-on-surface"
      >
        cancel
      </button>
    </form>
  );
}

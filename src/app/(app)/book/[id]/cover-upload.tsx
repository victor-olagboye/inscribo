"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};
const MAX_BYTES = 5 * 1024 * 1024;

export function CoverUpload({
  bookId,
  userId,
  currentPath,
}: {
  bookId: string;
  userId: string;
  currentPath: string | null;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function onFile(file: File) {
    setError(null);
    setNote(null);

    const ext = TYPES[file.type];
    if (!ext) return setError("Use a JPG or PNG image.");
    if (file.size > MAX_BYTES) return setError("Image must be under 5 MB.");

    setBusy(true);
    const supabase = createClient();
    const path = `${userId}/${bookId}-${Date.now()}.${ext}`;

    const up = await supabase.storage
      .from("covers")
      .upload(path, file, { contentType: file.type });
    if (up.error) {
      setBusy(false);
      return setError(up.error.message);
    }

    const upd = await supabase
      .from("books")
      .update({ cover_path: path })
      .eq("id", bookId);
    if (upd.error) {
      await supabase.storage.from("covers").remove([path]);
      setBusy(false);
      return setError(upd.error.message);
    }

    if (currentPath)
      await supabase.storage.from("covers").remove([currentPath]);

    try {
      const bmp = await createImageBitmap(file);
      if (bmp.width < 1800 || bmp.height < 2700) {
        setNote(
          `${bmp.width}×${bmp.height} px: fine for ebooks, but below 300 DPI for a 6×9 in print cover (needs 1800×2700).`,
        );
      }
      bmp.close();
    } catch {
      /* size check is optional */
    }

    setBusy(false);
    router.refresh();
  }

  async function removeCover() {
    if (!currentPath) return;
    setBusy(true);
    setError(null);
    setNote(null);

    const supabase = createClient();
    const upd = await supabase
      .from("books")
      .update({ cover_path: null })
      .eq("id", bookId);
    if (upd.error) {
      setBusy(false);
      return setError(upd.error.message);
    }
    await supabase.storage.from("covers").remove([currentPath]);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-space-sm">
      <div className="flex items-center gap-space-sm">
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onFile(f);
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="h-9 px-space-md bg-primary hover:bg-primary-container text-on-primary font-ui-medium text-ui-small rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">upload</span>
          <span>
            {busy
              ? "working..."
              : currentPath
                ? "replace cover"
                : "upload cover"}
          </span>
        </button>
        {currentPath && (
          <button
            type="button"
            disabled={busy}
            onClick={removeCover}
            className="h-9 px-space-md text-on-surface-variant hover:text-error font-ui-medium text-ui-small rounded-lg transition-colors disabled:opacity-50"
          >
            remove
          </button>
        )}
      </div>
      {error && (
        <p className="font-ui-small text-ui-small text-error">{error}</p>
      )}
      {note && (
        <p className="font-ui-small text-ui-small text-on-surface-variant">
          {note}
        </p>
      )}
      <p className="font-ui-small text-[11px] text-outline">
        JPG or PNG, up to 5 MB. Portrait 2:3 fits a 6×9 in book.
      </p>
    </div>
  );
}

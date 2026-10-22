"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { createClient } from "@/lib/supabase/client";

type Props = {
  chapterId: string;
  initialTitle: string;
  initialContent: object;
  initialWords: number;
};

type Status = "saved" | "unsaved" | "saving" | "error";

const countWords = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

export function ChapterEditor({
  chapterId,
  initialTitle,
  initialContent,
  initialWords,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [title, setTitle] = useState(initialTitle);
  const [words, setWords] = useState(initialWords);
  const [status, setStatus] = useState<Status>("saved");

  const editorRef = useRef<Editor | null>(null);
  const titleRef = useRef(initialTitle);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  async function save() {
    const ed = editorRef.current;
    if (!ed) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setStatus("saving");

    const { error } = await supabase
      .from("chapters")
      .update({
        title: titleRef.current.trim() || "Untitled chapter",
        content: ed.getJSON(),
        word_count: countWords(ed.getText()),
      })
      .eq("id", chapterId);

    if (error) {
      setStatus("error");
      return;
    }
    dirty.current = false;
    setStatus("saved");
  }

  function queueSave() {
    dirty.current = true;
    setStatus("unsaved");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 1500);
  }

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    immediatelyRender: false,
    editorProps: { attributes: { class: "manuscript outline-none" } },
    onUpdate: ({ editor }) => {
      setWords(countWords(editor.getText()));
      queueSave();
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // save on leave, warn on tab close with unsaved work
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      if (dirty.current) save();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const btn =
    "w-8 h-8 rounded flex items-center justify-center hover:bg-surface-container text-on-surface transition-colors";

  const statusLabel: Record<Status, string> = {
    saved: "saved",
    unsaved: "unsaved changes",
    saving: "saving...",
    error: "couldn't save, retrying on next edit",
  };

  return (
    <div className="relative">
      <div className="sticky top-0 z-20 -mx-4 px-4 py-2 mb-space-lg bg-background/85 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-0.5 bg-surface-container-lowest rounded-lg shadow-sm px-1.5 py-1">
          <button
            className={btn}
            title="Bold"
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <span className="material-symbols-outlined text-[18px]">
              format_bold
            </span>
          </button>
          <button
            className={btn}
            title="Italic"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <span className="material-symbols-outlined text-[18px]">
              format_italic
            </span>
          </button>
          <button
            className={btn}
            title="Heading"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <span className="material-symbols-outlined text-[18px]">title</span>
          </button>
          <button
            className={btn}
            title="Quote"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <span className="material-symbols-outlined text-[18px]">
              format_quote
            </span>
          </button>
          <button
            className={btn}
            title="Bullet list"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <span className="material-symbols-outlined text-[18px]">
              format_list_bulleted
            </span>
          </button>
          <button
            className={btn}
            title="Scene break"
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          >
            <span className="material-symbols-outlined text-[18px]">
              horizontal_rule
            </span>
          </button>
        </div>

        <div className="flex items-center gap-space-sm px-3.5 py-1.5 rounded-full bg-surface-container-lowest shadow-sm font-ui-small text-ui-small text-on-surface-variant">
          <span className="font-ui-medium text-on-surface">
            {words.toLocaleString()}
          </span>
          <span>words</span>
          <span className="text-outline-variant">·</span>
          <span
            className={`flex items-center gap-1 ${status === "error" ? "text-error" : ""}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status === "saved"
                  ? "bg-emerald-600"
                  : status === "error"
                    ? "bg-error"
                    : "bg-secondary-container"
              }`}
            />
            {statusLabel[status]}
          </span>
        </div>
      </div>

      <article className="w-full bg-surface-container-lowest rounded-lg shadow-sm p-10 md:p-16 mb-24">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            titleRef.current = e.target.value;
            queueSave();
          }}
          placeholder="chapter title"
          className="w-full mb-space-xl bg-transparent outline-none font-headline-xl text-headline-xl text-on-surface tracking-tight placeholder:text-outline-variant"
        />
        <div className="w-12 h-0.5 bg-primary mb-space-xl" />
        <EditorContent editor={editor} />
      </article>
    </div>
  );
}

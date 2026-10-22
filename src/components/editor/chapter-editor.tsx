"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useEditor,
  useEditorState,
  EditorContent,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle, FontFamily } from "@tiptap/extension-text-style";
import { createClient } from "@/lib/supabase/client";

type Props = {
  chapterId: string;
  initialTitle: string;
  initialContent: object;
  initialWords: number;
};

type Status = "saved" | "unsaved" | "saving" | "error";

const FONTS = [
  { label: "Newsreader (default)", value: "" },
  { label: "Cormorant Garamond", value: "Cormorant Garamond" },
  { label: "EB Garamond", value: "EB Garamond" },
  { label: "Libre Baskerville", value: "Libre Baskerville" },
  { label: "Inter", value: "Inter" },
];

const ALIGNS = [
  { value: "left", icon: "format_align_left" },
  { value: "center", icon: "format_align_center" },
  { value: "right", icon: "format_align_right" },
  { value: "justify", icon: "format_align_justify" },
] as const;

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
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: { attributes: { class: "manuscript outline-none" } },
    onUpdate: ({ editor }) => {
      setWords(countWords(editor.getText()));
      queueSave();
    },
  });

  const ui = useEditorState({
    editor,
    selector: ({ editor }) => ({
      canUndo: editor?.can().undo() ?? false,
      canRedo: editor?.can().redo() ?? false,
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      heading: editor?.isActive("heading", { level: 2 }) ?? false,
      quote: editor?.isActive("blockquote") ?? false,
      list: editor?.isActive("bulletList") ?? false,
      align:
        ALIGNS.find((a) => editor?.isActive({ textAlign: a.value }))?.value ??
        "left",
      font: (
        (editor?.getAttributes("textStyle").fontFamily as string | undefined) ??
        ""
      ).replace(/["']/g, ""),
    }),
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

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

  const btn = (active = false) =>
    `w-8 h-8 rounded flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none ${
      active
        ? "bg-surface-container-high text-primary"
        : "text-on-surface hover:bg-surface-container"
    }`;

  const divider = <div className="h-4 w-px bg-outline-variant mx-1" />;

  const statusLabel: Record<Status, string> = {
    saved: "saved",
    unsaved: "unsaved changes",
    saving: "saving...",
    error: "couldn't save, retrying on next edit",
  };

  const run = () => editor?.chain().focus();

  return (
    <div className="relative">
      <div className="sticky top-0 z-20 -mx-4 px-4 py-2 mb-space-lg bg-background/85 backdrop-blur-md flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex flex-wrap items-center gap-0.5 bg-surface-container-lowest rounded-lg shadow-sm px-1.5 py-1">
          <button
            className={btn()}
            title="Undo (Ctrl+Z)"
            disabled={!ui?.canUndo}
            onClick={() => run()?.undo().run()}
          >
            <span className="material-symbols-outlined text-[18px]">undo</span>
          </button>
          <button
            className={btn()}
            title="Redo (Ctrl+Y)"
            disabled={!ui?.canRedo}
            onClick={() => run()?.redo().run()}
          >
            <span className="material-symbols-outlined text-[18px]">redo</span>
          </button>

          {divider}

          <select
            value={ui?.font ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v) run()?.setFontFamily(v).run();
              else run()?.unsetFontFamily().run();
            }}
            title="Font"
            className="h-8 px-2 rounded bg-transparent hover:bg-surface-container font-ui-small text-ui-small text-on-surface outline-none cursor-pointer"
          >
            {FONTS.map((f) => (
              <option key={f.label} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {divider}

          <button
            className={btn(ui?.bold)}
            title="Bold"
            onClick={() => run()?.toggleBold().run()}
          >
            <span className="material-symbols-outlined text-[18px]">
              format_bold
            </span>
          </button>
          <button
            className={btn(ui?.italic)}
            title="Italic"
            onClick={() => run()?.toggleItalic().run()}
          >
            <span className="material-symbols-outlined text-[18px]">
              format_italic
            </span>
          </button>
          <button
            className={btn(ui?.heading)}
            title="Heading"
            onClick={() => run()?.toggleHeading({ level: 2 }).run()}
          >
            <span className="material-symbols-outlined text-[18px]">title</span>
          </button>
          <button
            className={btn(ui?.quote)}
            title="Quote"
            onClick={() => run()?.toggleBlockquote().run()}
          >
            <span className="material-symbols-outlined text-[18px]">
              format_quote
            </span>
          </button>
          <button
            className={btn(ui?.list)}
            title="Bullet list"
            onClick={() => run()?.toggleBulletList().run()}
          >
            <span className="material-symbols-outlined text-[18px]">
              format_list_bulleted
            </span>
          </button>
          <button
            className={btn()}
            title="Scene break"
            onClick={() => run()?.setHorizontalRule().run()}
          >
            <span className="material-symbols-outlined text-[18px]">
              horizontal_rule
            </span>
          </button>

          {divider}

          {ALIGNS.map((a) => (
            <button
              key={a.value}
              className={btn(ui?.align === a.value)}
              title={`Align ${a.value}`}
              onClick={() => run()?.setTextAlign(a.value).run()}
            >
              <span className="material-symbols-outlined text-[18px]">
                {a.icon}
              </span>
            </button>
          ))}
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

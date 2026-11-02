"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

const PX = 96; // one CSS inch
const snap = (n: number) => Math.round(n * 8) / 8;

type Drag = { kind: "left" | "first"; left: number; first: number };

export function Ruler({
  editor,
  left,
  first,
}: {
  editor: Editor | null;
  left: number;
  first: number;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  const cur = drag ?? { left, first };
  const leftPx = cur.left * PX;
  const firstPx = (cur.left + cur.first) * PX;

  function toInches(clientX: number) {
    const rect = track.current!.getBoundingClientRect();
    const max = rect.width / PX - 0.5;
    return Math.min(Math.max(snap((clientX - rect.left) / PX), 0), max);
  }

  const start = (kind: "left" | "first") => (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ kind, left, first });
  };

  function move(e: React.PointerEvent) {
    if (!drag) return;
    const inches = toInches(e.clientX);
    if (drag.kind === "first") setDrag({ ...drag, first: inches - drag.left });
    else setDrag({ ...drag, left: Math.max(inches, -drag.first) });
  }

  function end() {
    if (!drag) return;
    editor
      ?.chain()
      .focus()
      .setIndents({ left: drag.left, first: drag.first })
      .run();
    setDrag(null);
  }

  const handle =
    "absolute -translate-x-1/2 cursor-ew-resize touch-none text-primary leading-none text-[11px]";

  return (
    <div className="mb-space-md select-none">
      <div
        ref={track}
        className="relative h-6 w-full rounded bg-surface-container-low"
      >
        <div
          className="absolute inset-0 overflow-hidden rounded"
          style={{
            backgroundImage:
              "linear-gradient(to right, #c7c4d8 1px, transparent 1px)",
            backgroundSize: `${PX / 2}px 8px`,
            backgroundRepeat: "repeat-x",
            backgroundPosition: "bottom left",
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <span
              key={n}
              className="absolute top-0.5 -translate-x-1/2 font-ui-small text-[9px] text-outline"
              style={{ left: n * PX }}
            >
              {n}
            </span>
          ))}
        </div>

        <div
          title="First-line indent"
          className={`${handle} top-0`}
          style={{ left: firstPx }}
          onPointerDown={start("first")}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          ▼
        </div>
        <div
          title="Left indent"
          className={`${handle} bottom-0`}
          style={{ left: leftPx }}
          onPointerDown={start("left")}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          ▲
        </div>
      </div>
    </div>
  );
}

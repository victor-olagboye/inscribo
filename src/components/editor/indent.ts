import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      setIndents: (v: { left?: number; first?: number }) => ReturnType;
    };
  }
}

export const Indent = Extension.create({
  name: "indent",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          indentLeft: {
            default: 0,
            parseHTML: (el: HTMLElement) =>
              parseFloat(el.style.marginLeft) || 0,
            renderHTML: (attrs: Record<string, unknown>) =>
              attrs.indentLeft
                ? { style: `margin-left:${attrs.indentLeft}in` }
                : {},
          },
          indentFirst: {
            default: 0,
            parseHTML: (el: HTMLElement) =>
              parseFloat(el.style.textIndent) || 0,
            renderHTML: (attrs: Record<string, unknown>) =>
              attrs.indentFirst
                ? { style: `text-indent:${attrs.indentFirst}in` }
                : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setIndents:
        (v) =>
        ({ chain }) => {
          const attrs: Record<string, number> = {};
          if (v.left !== undefined) attrs.indentLeft = v.left;
          if (v.first !== undefined) attrs.indentFirst = v.first;
          return chain()
            .updateAttributes("paragraph", attrs)
            .updateAttributes("heading", attrs)
            .run();
        },
    };
  },
});

// RichTextEditor (tiptap) — renders a formatting toolbar and seeds initial HTML.
// ProseMirror calls layout APIs jsdom lacks, so we stub them before mounting.
import React from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

beforeAll(() => {
  // jsdom has no layout engine; ProseMirror queries these during mount/selection.
  Range.prototype.getBoundingClientRect = () =>
    ({ bottom: 0, height: 0, left: 0, right: 0, top: 0, width: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  Range.prototype.getClientRects = () => ({ length: 0, item: () => null }) as unknown as DOMRectList;
  if (!document.elementFromPoint) {
    document.elementFromPoint = () => null;
  }
});

import { RichTextEditor } from "../RichTextEditor";

afterEach(() => cleanup());

describe("RichTextEditor", () => {
  it("renders the formatting toolbar", async () => {
    render(<RichTextEditor value="<p>Halo Dunia</p>" onChange={() => {}} />);
    expect(await screen.findByLabelText("Tebal")).toBeInTheDocument();
    expect(screen.getByLabelText("Miring")).toBeInTheDocument();
    expect(screen.getByLabelText("Daftar Butir")).toBeInTheDocument();
  });

  it("seeds the editor with the initial HTML content", async () => {
    render(<RichTextEditor value="<p>Halo Dunia</p>" onChange={() => {}} />);
    expect(await screen.findByText("Halo Dunia")).toBeInTheDocument();
  });
});

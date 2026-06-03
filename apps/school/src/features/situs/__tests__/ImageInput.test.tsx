// ImageInput: URL field for situs image fields + a live thumbnail so CMS authors
// can confirm the link resolves instead of pasting a blind URL.
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { ImageInput } from "../ImageInput";

afterEach(() => cleanup());

describe("ImageInput", () => {
  it("renders a url text input", () => {
    render(<ImageInput value="" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "url");
  });

  it("shows a thumbnail preview when a url is set", () => {
    render(<ImageInput value="https://cdn.test/foto.png" onChange={() => {}} alt="Sampul" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://cdn.test/foto.png");
    expect(img).toHaveAttribute("alt", "Sampul");
  });

  it("shows no preview when the value is empty", () => {
    render(<ImageInput value="" onChange={() => {}} />);
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("calls onChange with the typed url", () => {
    const onChange = vi.fn();
    render(<ImageInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "https://cdn.test/x.jpg" } });
    expect(onChange).toHaveBeenCalledWith("https://cdn.test/x.jpg");
  });
});

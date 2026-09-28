import { it, expect } from "vitest";
import { youtubeURL } from "../src/domain/youtube";
it("normalizes YouTube share, watch and Shorts links", () => {
  expect(youtubeURL("https://youtu.be/dQw4w9WgXcQ?t=30")).toBe(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30",
  );
  expect(youtubeURL("https://m.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  );
});
it("rejects unsafe hosts, schemes and malformed IDs", () => {
  for (const url of [
    "javascript:alert(1)",
    "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
    "https://youtube.com@evil.test/watch?v=dQw4w9WgXcQ",
    "https://youtube.com/watch?v=123",
    "https://vimeo.com/dQw4w9WgXcQ",
  ])
    expect(() => youtubeURL(url)).toThrow();
});

import { describe, expect, it } from "vitest";
import { blogThumbnailPosition } from "@/lib/blog-thumbnail";

describe("blog thumbnail framing", () => {
  it("preserves the title at the top of the current portrait Wynn artwork", () => {
    expect(blogThumbnailPosition("https://cdn.sanity.io/images/jdxbkry4/production/2b6588fc2082791b334c039e7bb914ba868a0cd7-821x957.png?w=900")).toBe("center top");
  });

  it("does not carry a legacy crop over to a new 16:9 cover", () => {
    expect(blogThumbnailPosition("https://cdn.sanity.io/images/jdxbkry4/production/2b6588fc2082791b334c039e7bb914ba868a0cd7-1920x1080.png")).toBe("center");
    expect(blogThumbnailPosition("https://cdn.sanity.io/images/jdxbkry4/production/7419705276ad12623ce38303ab5412c89a302237-1920x1080.jpg")).toBe("center");
  });

  it("centres other artwork and local fallbacks", () => {
    expect(blogThumbnailPosition("https://cdn.sanity.io/images/jdxbkry4/production/c958378aebb948112aab5fdfb3e5d5c530a3b0d2-1920x1280.jpg")).toBe("center");
    expect(blogThumbnailPosition("/blog/fallback.jpg")).toBe("center");
  });
});

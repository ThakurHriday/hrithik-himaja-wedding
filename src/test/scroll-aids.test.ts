import { describe, expect, it } from "vitest";
import { PAGE_IDS, nextPageId, scrollProgress, urlWithoutHash } from "@/components/wedding/ScrollAids";
import { MUSIC_SRC } from "@/components/wedding/music";

describe("diya scroll indicator", () => {
  it("sits at the top before scrolling and at the bottom at the end of the page", () => {
    expect(scrollProgress(0, 5000, 1000)).toBe(0);
    expect(scrollProgress(4000, 5000, 1000)).toBe(1);
  });
  it("is halfway down when the guest is halfway through the page", () => {
    expect(scrollProgress(2000, 5000, 1000)).toBe(0.5);
  });
});

describe("Next Page link", () => {
  const tops = [
    { id: "invitation", top: 900 },
    { id: "lineage", top: 1800 },
    { id: "closing", top: 4000 },
  ];
  it("goes from the opening to the invitation", () => expect(nextPageId(0, tops)).toBe("invitation"));
  it("goes to the following section once a section is reached", () => expect(nextPageId(900, tops)).toBe("lineage"));
  it("has nowhere to go on the last section", () => expect(nextPageId(4000, tops)).toBeNull());
  it("walks the sections in page order, ending at the closing", () => {
    expect(PAGE_IDS[0]).toBe("invitation");
    expect(PAGE_IDS[PAGE_IDS.length - 1]).toBe("closing");
  });
});

describe("opening the website", () => {
  it("drops a saved section jump so the guest lands on the opening animation", () => {
    expect(urlWithoutHash("https://example.com/#invitation")).toBe("https://example.com/");
  });
  it("keeps an address without a section jump unchanged", () => {
    expect(urlWithoutHash("https://example.com/?lang=hi")).toBe("https://example.com/?lang=hi");
  });
});

describe("background music", () => {
  it("plays the Jashn-E-Bahaaraa instrumental", () => expect(MUSIC_SRC).toMatch(/jashn-e-bahaaraa-instrumental\.mp3$/));
});

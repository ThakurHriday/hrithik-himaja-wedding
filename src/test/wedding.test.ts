import { describe, expect, it } from "vitest";
import { EVENTS, RESIDENCE_MAP_URL, VENUE, WEDDING_AT, googleCalendarUrl, mapsEmbedUrl, splitCountdown } from "@/components/wedding/details";
import { DICTS } from "@/components/wedding/i18n";

const at = (k: string) => new Date(EVENTS.find((e) => e.key === k)!.start).toISOString();

describe("wedding details (IST)", () => {
  it("countdown runs to 3 Dec 2026, 10:51 AM IST", () => {
    expect(WEDDING_AT.toISOString()).toBe("2026-12-03T05:21:00.000Z");
  });
  it("Ratjagah is 30 Nov 2026 at 7:00 PM IST", () => expect(at("ratjagah")).toBe("2026-11-30T13:30:00.000Z"));
  it("Mandwa – Tel – Mayan is 1 Dec 2026 at 9:00 AM IST", () => expect(at("mandwa")).toBe("2026-12-01T03:30:00.000Z"));
  it("Satyanarayana Katha is 4 Dec 2026 at 10:00 AM IST, at the residence", () => {
    expect(at("katha")).toBe("2026-12-04T04:30:00.000Z");
    expect(EVENTS.find((e) => e.key === "katha")!.place).toBe("residence");
  });
  it("Baarat is 3 Dec 2026 at 6:00 AM IST and starts from KIA Car Service Automotive, Nagole", () => {
    expect(at("baarat")).toBe("2026-12-03T00:30:00.000Z");
    expect(EVENTS.find((e) => e.key === "baarat")!.place).toBe("baarat");
    expect(DICTS.en.events.baarat.note).toContain("KIA Car Service Automotive, Nagole");
  });
  it("wedding calendar link starts at the muhurtham", () => {
    const url = googleCalendarUrl(EVENTS.find((e) => e.key === "wedding")!, "Wedding", "", "PBR Convention");
    expect(new URL(url).searchParams.get("dates")?.startsWith("20261203T052100Z/")).toBe(true);
  });
  it("venue is PBR Convention Hall at the full Bandlaguda address, and the map points there", () => {
    expect(VENUE.name).toBe("PBR Convention Hall");
    expect(VENUE.address).toBe("12-1, 15/1, Nagole Rd, Vijaya Gardens, Bandlaguda, Hyderabad, Telangana 500068");
    expect(new URL(mapsEmbedUrl).searchParams.get("q")).toContain("PBR Convention Hall");
  });
  it("Ratjagah, Mandwa and Katha are at the residence, with its Google Maps link", () => {
    for (const k of ["ratjagah", "mandwa", "katha"]) expect(EVENTS.find((e) => e.key === k)!.place).toBe("residence");
    expect(RESIDENCE_MAP_URL).toBe("https://maps.app.goo.gl/CESVeqstYuuJ6ob59?g_st=ic");
  });
  it("splits a countdown into days, hours, minutes, seconds", () => {
    expect(splitCountdown(((1 * 24 + 2) * 3600 + 3 * 60 + 4) * 1000)).toEqual({ days: 1, hours: 2, minutes: 3, seconds: 4 });
    expect(splitCountdown(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });
});

describe("Hindi switch", () => {
  it("Hindi has every English text key", () => {
    expect(Object.keys(DICTS.hi).sort()).toEqual(Object.keys(DICTS.en).sort());
    expect(Object.keys(DICTS.hi.events).sort()).toEqual(Object.keys(DICTS.en.events).sort());
  });
});

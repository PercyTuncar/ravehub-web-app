import {
  deriveTopDjsStage,
  normalizeInstagramHandle,
  utcToZonedInput,
  zonedInputToUtc,
} from "@/lib/top-djs/config";
import type { TopDjsCycle } from "@/lib/types";

const cycle: TopDjsCycle = {
  id: "peru-2026",
  countrySlug: "peru",
  countryCode: "PE",
  countryName: "Perú",
  flag: "🇵🇪",
  year: 2026,
  timezone: "America/Lima",
  suggestionOpensAt: "2026-05-01T05:00:00.000Z",
  suggestionClosesAt: "2026-06-01T04:59:00.000Z",
  votingOpensAt: "2026-06-15T05:00:00.000Z",
  votingClosesAt: "2026-08-01T04:59:00.000Z",
  minSuggestions: 5,
  maxBallotChoices: 5,
  statusOverride: "automatic",
};

describe("Top DJs configuration", () => {
  it.each([
    ["@Luna.Volt", "luna.volt"],
    ["https://www.instagram.com/Luna.Volt/", "luna.volt"],
    ["instagram.com/luna_volt?igsh=abc", "luna_volt"],
  ])("normalizes Instagram %s", (input, expected) => {
    expect(normalizeInstagramHandle(input)).toBe(expected);
  });

  it("derives each phase from absolute timestamps", () => {
    expect(deriveTopDjsStage(cycle, new Date("2026-04-01T00:00:00Z"))).toBe(
      "scheduled",
    );
    expect(deriveTopDjsStage(cycle, new Date("2026-05-15T00:00:00Z"))).toBe(
      "suggestions",
    );
    expect(deriveTopDjsStage(cycle, new Date("2026-06-10T00:00:00Z"))).toBe(
      "intermission",
    );
    expect(deriveTopDjsStage(cycle, new Date("2026-07-01T00:00:00Z"))).toBe(
      "voting",
    );
    expect(deriveTopDjsStage(cycle, new Date("2026-08-02T00:00:00Z"))).toBe(
      "review",
    );
  });

  it("converts Lima local time to UTC without using the browser timezone", () => {
    expect(zonedInputToUtc("2026-05-01T00:00", "America/Lima")).toBe(
      "2026-05-01T05:00:00.000Z",
    );
    expect(utcToZonedInput("2026-05-01T05:00:00.000Z", "America/Lima")).toBe(
      "2026-05-01T00:00",
    );
  });
});

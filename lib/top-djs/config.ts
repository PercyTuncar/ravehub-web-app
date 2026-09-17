import type { TopDjsCycle, TopDjsStage } from "@/lib/types";

export const TOP_DJS_COUNTRIES = {
  peru: { code: "PE", name: "Perú", flag: "🇵🇪", timezone: "America/Lima" },
  chile: {
    code: "CL",
    name: "Chile",
    flag: "🇨🇱",
    timezone: "America/Santiago",
  },
  colombia: {
    code: "CO",
    name: "Colombia",
    flag: "🇨🇴",
    timezone: "America/Bogota",
  },
  argentina: {
    code: "AR",
    name: "Argentina",
    flag: "🇦🇷",
    timezone: "America/Argentina/Buenos_Aires",
  },
  mexico: {
    code: "MX",
    name: "México",
    flag: "🇲🇽",
    timezone: "America/Mexico_City",
  },
  brasil: {
    code: "BR",
    name: "Brasil",
    flag: "🇧🇷",
    timezone: "America/Sao_Paulo",
  },
  ecuador: {
    code: "EC",
    name: "Ecuador",
    flag: "🇪🇨",
    timezone: "America/Guayaquil",
  },
} as const;

export type TopDjsCountrySlug = keyof typeof TOP_DJS_COUNTRIES;

export function getTopDjsCountry(slug: string) {
  return TOP_DJS_COUNTRIES[slug as TopDjsCountrySlug] ?? null;
}

export function normalizeInstagramHandle(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const withoutProtocol = trimmed.replace(/^https?:\/\/(www\.)?/i, "");
  const withoutHost = withoutProtocol.replace(/^instagram\.com\//i, "");
  return withoutHost
    .split(/[/?#]/)[0]
    .replace(/^@/, "")
    .replace(/[^a-z0-9._]/g, "");
}

export function normalizeCandidateKey(instagramHandle: string) {
  return normalizeInstagramHandle(instagramHandle).replace(/[^a-z0-9]/g, "-");
}

export function instagramUrl(handle: string) {
  return `https://www.instagram.com/${normalizeInstagramHandle(handle)}/`;
}

export function deriveTopDjsStage(
  cycle: TopDjsCycle,
  now = new Date(),
): TopDjsStage {
  if (cycle.statusOverride === "paused") return "paused";
  if (cycle.statusOverride === "published" || cycle.resultsPublishedAt)
    return "published";

  const timestamp = now.getTime();
  const suggestionsOpen = new Date(cycle.suggestionOpensAt).getTime();
  const suggestionsClose = new Date(cycle.suggestionClosesAt).getTime();
  const votingOpen = new Date(cycle.votingOpensAt).getTime();
  const votingClose = new Date(cycle.votingClosesAt).getTime();

  if (timestamp < suggestionsOpen) return "scheduled";
  if (timestamp <= suggestionsClose) return "suggestions";
  if (timestamp < votingOpen) return "intermission";
  if (timestamp <= votingClose) return "voting";
  return "review";
}

export function getStageTarget(cycle: TopDjsCycle, stage: TopDjsStage) {
  if (stage === "scheduled") return cycle.suggestionOpensAt;
  if (stage === "suggestions") return cycle.suggestionClosesAt;
  if (stage === "intermission") return cycle.votingOpensAt;
  if (stage === "voting") return cycle.votingClosesAt;
  return null;
}

export function validateCycleDates(
  cycle: Pick<
    TopDjsCycle,
    | "suggestionOpensAt"
    | "suggestionClosesAt"
    | "votingOpensAt"
    | "votingClosesAt"
  >,
) {
  const dates = [
    cycle.suggestionOpensAt,
    cycle.suggestionClosesAt,
    cycle.votingOpensAt,
    cycle.votingClosesAt,
  ].map((date) => new Date(date).getTime());
  if (dates.some(Number.isNaN)) return "Todas las fechas deben ser válidas.";
  if (!(dates[0] < dates[1] && dates[1] <= dates[2] && dates[2] < dates[3])) {
    return "Las fechas deben seguir el orden: apertura de sugerencias, cierre, apertura de votación y cierre.";
  }
  return null;
}

export function formatCycleDate(
  iso: string,
  timezone: string,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(new Date(iso));
}

export function zonedInputToUtc(value: string, timezone: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return value;
  const [, year, month, day, hour, minute] = match.map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let guess = desired;
  for (let index = 0; index < 2; index += 1) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(guess));
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    const represented = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
    );
    guess += desired - represented;
  }
  return new Date(guess).toISOString();
}

export function utcToZonedInput(value: string, timezone: string) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

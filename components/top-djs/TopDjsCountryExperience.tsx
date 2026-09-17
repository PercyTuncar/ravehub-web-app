"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Headphones,
  Instagram,
  Loader2,
  MapPin,
  Medal,
  Music2,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Vote,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/AuthContext";
import type { TopDjsCandidate, TopDjsCycle, TopDjsStage } from "@/lib/types";
import {
  formatCycleDate,
  getStageTarget,
  getTopDjsCountry,
} from "@/lib/top-djs/config";

type PublicPayload = {
  cycle: TopDjsCycle | null;
  stage?: TopDjsStage;
  candidates: TopDjsCandidate[];
  history: number[];
};

const stageContent: Record<
  TopDjsStage,
  { eyebrow: string; title: string; description: string }
> = {
  scheduled: {
    eyebrow: "La próxima edición se acerca",
    title: "Prepárate para descubrir la escena",
    description:
      "Muy pronto podrás proponer a los artistas que están definiendo el sonido de tu país.",
  },
  suggestions: {
    eyebrow: "Sugerencias abiertas",
    title: "Haz que su nombre entre en la conversación",
    description:
      "Sugiere a un DJ de tu escena. Con el apoyo de cinco personas únicas podrá pasar a la votación oficial.",
  },
  intermission: {
    eyebrow: "Curaduría en curso",
    title: "Estamos preparando la lista oficial",
    description:
      "Verificamos duplicados, actividad artística y perfiles antes de abrir las urnas.",
  },
  voting: {
    eyebrow: "Votación abierta",
    title: "Tu top 5. Tu escena. Tu decisión.",
    description:
      "Elige hasta cinco artistas y ordénalos por preferencia. Puedes actualizar tu selección hasta el cierre.",
  },
  review: {
    eyebrow: "Votación cerrada",
    title: "Los votos están siendo verificados",
    description:
      "Auditamos la participación antes de publicar el ranking definitivo.",
  },
  published: {
    eyebrow: "Ranking oficial",
    title: "Estos son los nombres que mueven la escena",
    description:
      "Una fotografía anual construida por la comunidad electrónica del país.",
  },
  paused: {
    eyebrow: "Edición en pausa",
    title: "Volveremos muy pronto",
    description:
      "El equipo editorial está revisando esta edición. Tus participaciones guardadas permanecen seguras.",
  },
};

function useCountdown(target?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [target]);
  if (!target) return null;
  const difference = Math.max(0, new Date(target).getTime() - now);
  return {
    days: Math.floor(difference / 86400000),
    hours: Math.floor((difference % 86400000) / 3600000),
    minutes: Math.floor((difference % 3600000) / 60000),
    seconds: Math.floor((difference % 60000) / 1000),
  };
}

function Countdown({
  cycle,
  stage,
}: {
  cycle: TopDjsCycle;
  stage: TopDjsStage;
}) {
  const target = getStageTarget(cycle, stage);
  const remaining = useCountdown(target);
  if (!target || !remaining) return null;
  const labels =
    stage === "scheduled"
      ? "Abrimos sugerencias en"
      : stage === "suggestions"
        ? "Las sugerencias cierran en"
        : stage === "intermission"
          ? "La votación abre en"
          : "La votación cierra en";
  return (
    <div
      className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-xl"
      aria-label={labels}
    >
      <div className="mb-3 flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
        <span className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-[#FBA905]" />
          {labels}
        </span>
        <span className="hidden sm:block">Hora local: {cycle.timezone}</span>
      </div>
      <div className="grid grid-cols-4 gap-2" role="timer" aria-live="off">
        {Object.entries(remaining).map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl bg-white/[0.06] px-2 py-3 text-center"
          >
            <div className="font-mono text-2xl font-black tabular-nums text-white sm:text-3xl">
              {String(value).padStart(2, "0")}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-white/45">
              {
                {
                  days: "días",
                  hours: "horas",
                  minutes: "min",
                  seconds: "seg",
                }[label as keyof typeof remaining]
              }
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-white/45">
        {formatCycleDate(target, cycle.timezone)}
      </p>
    </div>
  );
}

function CandidateVisual({
  candidate,
  className = "",
}: {
  candidate: TopDjsCandidate;
  className?: string;
}) {
  const source = candidate.profile?.imageUrl;
  const gradient = source?.startsWith("linear-gradient")
    ? source
    : "linear-gradient(135deg,#FBA905,#ff3d71 52%,#6c5ce7)";
  return (
    <div
      className={`relative overflow-hidden bg-[#202428] ${className}`}
      style={{
        backgroundImage: source?.startsWith("linear-gradient")
          ? source
          : gradient,
      }}
    >
      {source && !source.startsWith("linear-gradient") && (
        <img
          src={source}
          alt={`Retrato de ${candidate.name}`}
          className="h-full w-full object-cover"
        />
      )}
      {!source && (
        <div className="absolute inset-0 flex items-center justify-center text-5xl font-black text-black/25">
          {candidate.name.slice(0, 1)}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
    </div>
  );
}

function EmptyEdition({
  countryName,
  flag,
  countrySlug,
}: {
  countryName: string;
  flag: string;
  countrySlug: string;
}) {
  const { user, loading } = useAuth();
  const redirect = encodeURIComponent(
    `/programas/ravehub-top-djs/${countrySlug}`,
  );
  return (
    <div className="min-h-screen bg-[#0b0d0f] px-4 pb-24 pt-32 text-white">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#202428] to-[#111315] p-8 text-center shadow-2xl md:p-16">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-[#FBA905] text-5xl shadow-[0_0_70px_rgba(251,169,5,.3)]">
          {flag}
        </div>
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-[#FBA905]">
          Ravehub Top DJs
        </p>
        <h1 className="text-4xl font-black tracking-tight md:text-6xl">
          Muy pronto podrás impulsar a tus DJs favoritos
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/55">
          Aún no hay una edición abierta para {countryName}. Cuando el equipo
          publique el próximo periodo de sugerencias, aquí aparecerán las fechas
          y la cuenta regresiva. Si ya existen rankings anteriores, también
          podrás consultarlos desde esta página.
        </p>
        {loading ? (
          <p role="status" className="mt-9 text-sm text-white/55">
            Verificando tu sesión...
          </p>
        ) : user ? (
          <p className="mt-9 text-sm text-white/65">
            Ya has iniciado sesión. Podrás sugerir a tus DJs cuando se abra la
            próxima edición.
          </p>
        ) : (
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/register?redirect=${redirect}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-black transition hover:bg-[#FBA905]"
            >
              Crear mi cuenta <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/login?redirect=${redirect}`}
              className="font-semibold text-[#FBA905] hover:underline"
            >
              Ya tengo cuenta · Iniciar sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TopDjsCountryExperience({
  countrySlug,
}: {
  countrySlug: string;
}) {
  const country = getTopDjsCountry(countrySlug);
  const { user, loading: authLoading } = useAuth();
  const loginHref = `/login?redirect=${encodeURIComponent(`/programas/ravehub-top-djs/${countrySlug}`)}`;
  const [data, setData] = useState<PublicPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [year, setYear] = useState<number>();
  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] =
    useState<TopDjsCandidate | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams();
      if (year) params.set("year", String(year));
      const response = await fetch(
        `/api/top-djs/${countrySlug}${params.size ? `?${params}` : ""}`,
        { cache: "no-store" },
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || "No se pudo cargar el ranking.");
      setData(payload);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No pudimos cargar esta edición.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [countrySlug, year]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredCandidates = useMemo(
    () =>
      (data?.candidates ?? []).filter((candidate) =>
        `${candidate.name} ${candidate.profile?.city ?? ""} ${candidate.profile?.genres?.join(" ") ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [data, query],
  );

  if (!country) return null;
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d0f] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#FBA905]" />
        <span className="ml-3 font-semibold">Cargando la escena...</span>
      </div>
    );
  if (loadError)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d0f] px-4 text-white">
        <div className="max-w-xl rounded-3xl border border-red-400/20 bg-red-400/[0.06] p-8 text-center">
          <h1 className="text-2xl font-black">
            No pudimos consultar el ranking
          </h1>
          <p className="mt-3 text-white/60">{loadError}</p>
          <button
            type="button"
            onClick={load}
            className="mt-6 rounded-full bg-white px-5 py-2.5 font-bold text-black"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  if (!data?.cycle)
    return (
      <EmptyEdition
        countryName={country.name}
        flag={country.flag}
        countrySlug={countrySlug}
      />
    );

  const { cycle } = data;
  const stage = data.stage ?? "scheduled";
  const content = stageContent[stage];
  const qualified = data.candidates.filter(
    (candidate) => candidate.suggestionCount >= cycle.minSuggestions,
  ).length;
  const stats: Array<{
    label: string;
    value: string | number;
    icon: LucideIcon;
  }> = [
    {
      label: "Sugerencias",
      value: data.candidates.reduce(
        (sum, candidate) => sum + candidate.suggestionCount,
        0,
      ),
      icon: Users,
    },
    { label: "Clasificados", value: qualified, icon: ShieldCheck },
    { label: "Selección", value: `Top ${cycle.maxBallotChoices}`, icon: Vote },
    { label: "Edición", value: cycle.year, icon: CalendarDays },
  ];
  const processSteps: Array<{
    number: string;
    title: string;
    description: string;
    icon: LucideIcon;
  }> = [
    {
      number: "01",
      title: "Sugiere",
      description:
        "Nombre artístico e Instagram. Nada de formularios interminables.",
      icon: Sparkles,
    },
    {
      number: "02",
      title: "Clasifica",
      description: `Con ${cycle.minSuggestions} apoyos únicos pasa a la lista oficial.`,
      icon: Zap,
    },
    {
      number: "03",
      title: "Vota",
      description: `Arma tu top ${cycle.maxBallotChoices}; la primera posición recibe más puntos.`,
      icon: Vote,
    },
    {
      number: "04",
      title: "Descubre",
      description: "Publicamos el ranking anual y preservamos cada edición.",
      icon: Trophy,
    },
  ];

  const handleNomination = async (event: React.FormEvent) => {
    event.preventDefault();
    if (authLoading) return;
    if (!user) {
      window.location.href = loginHref;
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/top-djs/nominate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleId: cycle.id, name, instagram }),
      });
      const result = await response.json();
      if (response.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!response.ok) throw new Error(result.error);
      toast.success("¡Sugerencia registrada! Gracias por impulsar la escena.");
      setName("");
      setInstagram("");
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo enviar.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleChoice = (candidateId: string) => {
    setChoices((current) =>
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : current.length < cycle.maxBallotChoices
          ? [...current, candidateId]
          : current,
    );
    if (
      !choices.includes(candidateId) &&
      choices.length >= cycle.maxBallotChoices
    )
      toast.info(`Puedes elegir hasta ${cycle.maxBallotChoices} DJs.`);
  };

  const submitBallot = async () => {
    if (!choices.length) return toast.error("Selecciona al menos un DJ.");
    setSubmitting(true);
    try {
      const response = await fetch("/api/top-djs/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleId: cycle.id, choices }),
      });
      const result = await response.json();
      if (response.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!response.ok) throw new Error(result.error);
      toast.success(
        "Tu top quedó guardado. Puedes actualizarlo hasta el cierre.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo votar.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0d0f] text-white">
      <section className="relative isolate px-4 pb-20 pt-28 sm:pt-32">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_10%,rgba(251,169,5,.22),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(0,203,255,.12),transparent_24%),linear-gradient(to_bottom,#171a1d,#0b0d0f)]" />
        <div className="absolute left-1/2 top-8 -z-10 h-72 w-72 -translate-x-1/2 rounded-full border border-[#FBA905]/15 shadow-[0_0_140px_rgba(251,169,5,.14)]" />
        <div className="mx-auto grid max-w-7xl items-end gap-12 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-[#FBA905]/25 bg-[#FBA905]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#FBA905]">
              <span>{cycle.flag}</span>
              {content.eyebrow}
            </div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-white/45">
              Ravehub Top DJs · {cycle.countryName} {cycle.year}
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              {cycle.heroTitle || content.title}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/60">
              {cycle.heroDescription || content.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#participa"
                className="inline-flex items-center gap-2 rounded-full bg-[#FBA905] px-6 py-3.5 font-black text-[#17120a] shadow-[0_16px_45px_rgba(251,169,5,.22)] transition hover:-translate-y-0.5 hover:bg-[#ffba2b]"
              >
                Participar ahora <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 font-bold text-white transition hover:bg-white/10"
              >
                Cómo funciona
              </a>
            </div>
          </div>
          <Countdown cycle={cycle} stage={stage} />
        </div>
      </section>

      <section className="border-y border-white/[0.07] bg-white/[0.025] px-4 py-6">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl px-2 py-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                <Icon className="h-5 w-5 text-[#FBA905]" />
              </div>
              <div>
                <div className="text-xl font-black">{value}</div>
                <div className="text-xs uppercase tracking-wider text-white/40">
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#FBA905]">
              Transparente de principio a fin
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              De una sugerencia al ranking oficial
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {processSteps.map(({ number, title, description, icon: Icon }) => (
              <div
                key={number}
                className="group rounded-2xl border border-white/[0.08] bg-[#15181b] p-6 transition hover:-translate-y-1 hover:border-[#FBA905]/35"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-white/30">
                    {number}
                  </span>
                  <Icon className="h-5 w-5 text-[#FBA905]" />
                </div>
                <h3 className="mt-10 text-xl font-black">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/50">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="participa" className="px-4 pb-24">
        <div className="mx-auto max-w-7xl">
          {stage === "suggestions" && (
            <div className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-[#15181b] lg:grid-cols-[.9fr_1.1fr]">
              <div className="relative min-h-[360px] overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(251,169,5,.35),transparent_28%),linear-gradient(145deg,#24282c,#101214)] p-8 md:p-12">
                <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full border-[45px] border-[#FBA905]/10" />
                <div className="relative">
                  <div className="mb-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBA905] text-black">
                    <Headphones className="h-7 w-7" />
                  </div>
                  <h2 className="text-4xl font-black tracking-tight">
                    ¿A quién debería conocer toda la escena?
                  </h2>
                  <p className="mt-5 max-w-md leading-relaxed text-white/55">
                    Tu sugerencia puede abrirle la puerta a un perfil editorial,
                    visibilidad nacional y un lugar en la votación de{" "}
                    {cycle.year}.
                  </p>
                  <div className="mt-9 flex items-center gap-3 text-sm text-white/65">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    Un apoyo por persona y artista
                  </div>
                </div>
              </div>
              {authLoading ? (
                <div
                  role="status"
                  className="flex items-center justify-center gap-3 p-8 md:p-12"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-[#FBA905]" />
                  Verificando tu sesión...
                </div>
              ) : !user ? (
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <h3 className="text-3xl font-black">
                    Inicia sesión para sugerir un DJ
                  </h3>
                  <p className="mt-4 text-white/55">
                    Solo los usuarios con una cuenta pueden enviar sugerencias.
                    Así contamos un apoyo por persona y artista.
                  </p>
                  <Link
                    href={loginHref}
                    className="mt-8 rounded-xl bg-[#FBA905] px-6 py-4 text-center font-black text-black"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href={loginHref.replace("/login?", "/register?")}
                    className="mt-4 text-center font-semibold text-[#FBA905] hover:underline"
                  >
                    Crear mi cuenta
                  </Link>
                </div>
              ) : (
                <form
                  onSubmit={handleNomination}
                  className="p-8 md:p-12"
                  noValidate
                >
                  <p className="text-sm font-bold text-[#FBA905]">
                    Toma menos de un minuto
                  </p>
                  <h3 className="mt-2 text-3xl font-black">Sugiere un DJ</h3>
                  <div className="mt-8 space-y-6">
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold">
                        Nombre artístico
                      </span>
                      <input
                        required
                        minLength={2}
                        maxLength={80}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Luna Volt"
                        className="h-14 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none transition placeholder:text-white/25 focus:border-[#FBA905] focus:ring-4 focus:ring-[#FBA905]/10"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-sm font-bold">
                        <Instagram className="h-4 w-4" />
                        Instagram
                      </span>
                      <input
                        required
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="@usuario o instagram.com/usuario"
                        className="h-14 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none transition placeholder:text-white/25 focus:border-[#FBA905] focus:ring-4 focus:ring-[#FBA905]/10"
                      />
                      <span className="mt-2 block text-xs text-white/35">
                        Lo usamos para identificar al artista y evitar
                        duplicados.
                      </span>
                    </label>
                  </div>
                  <div role="status" aria-live="polite" className="mt-6">
                    <button
                      disabled={submitting || !name.trim() || !instagram.trim()}
                      className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#FBA905] font-black text-black transition hover:bg-[#ffba2b] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {submitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                      Enviar sugerencia
                    </button>
                  </div>
                  <p className="mt-4 text-center text-xs leading-relaxed text-white/35">
                    Al participar aceptas las reglas de integridad de la
                    comunidad. No se permiten incentivos ni votos automatizados.
                  </p>
                </form>
              )}
            </div>
          )}

          {stage === "voting" && (
            <div>
              <div className="sticky top-20 z-30 mb-8 rounded-2xl border border-[#FBA905]/25 bg-[#141618]/95 p-4 shadow-2xl backdrop-blur-xl">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-black text-[#FBA905]">
                      Tu selección · {choices.length}/{cycle.maxBallotChoices}
                    </p>
                    <p className="text-xs text-white/45">
                      El orden en que eliges define la puntuación.
                    </p>
                  </div>
                  <button
                    onClick={submitBallot}
                    disabled={!choices.length || submitting}
                    className="rounded-xl bg-[#FBA905] px-6 py-3 font-black text-black disabled:opacity-40"
                  >
                    Guardar mi top
                  </button>
                </div>
              </div>
              <div className="mb-8 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4">
                <Search className="h-5 w-5 text-white/35" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre, ciudad o género"
                  className="h-14 w-full bg-transparent outline-none placeholder:text-white/30"
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCandidates.map((candidate) => {
                  const position = choices.indexOf(candidate.id);
                  return (
                    <button
                      key={candidate.id}
                      onClick={() => toggleChoice(candidate.id)}
                      className={`overflow-hidden rounded-2xl border text-left transition hover:-translate-y-1 ${position >= 0 ? "border-[#FBA905] bg-[#FBA905]/10 shadow-[0_0_35px_rgba(251,169,5,.12)]" : "border-white/10 bg-[#15181b]"}`}
                    >
                      <CandidateVisual candidate={candidate} className="h-56" />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-black">
                              {candidate.name}
                            </h3>
                            <p className="mt-1 flex items-center gap-1 text-xs text-white/45">
                              <MapPin className="h-3 w-3" />
                              {candidate.profile?.city || cycle.countryName}
                            </p>
                          </div>
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full font-black ${position >= 0 ? "bg-[#FBA905] text-black" : "bg-white/10"}`}
                          >
                            {position >= 0 ? position + 1 : "+"}
                          </div>
                        </div>
                        <p className="mt-4 line-clamp-2 text-sm text-white/55">
                          {candidate.profile?.tagline ||
                            "Conoce su propuesta y agrégalo a tu selección."}
                        </p>
                        <span
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedCandidate(candidate);
                          }}
                          className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#FBA905]"
                        >
                          Ver perfil <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {stage === "published" && (
            <div>
              <div className="grid items-end gap-5 md:grid-cols-3">
                {data.candidates.slice(0, 3).map((candidate, index) => (
                  <div
                    key={candidate.id}
                    className={`overflow-hidden rounded-[1.75rem] border bg-[#15181b] ${index === 0 ? "md:order-2 border-[#FBA905]/60 md:-translate-y-8" : index === 1 ? "md:order-1 border-white/10" : "md:order-3 border-white/10"}`}
                  >
                    <CandidateVisual
                      candidate={candidate}
                      className={index === 0 ? "h-80" : "h-64"}
                    />
                    <div className="relative p-6">
                      <div className="absolute -top-8 left-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBA905] text-2xl font-black text-black shadow-xl">
                        #{candidate.rank}
                      </div>
                      <h3 className="mt-5 text-2xl font-black">
                        {candidate.name}
                      </h3>
                      <p className="mt-2 text-sm text-white/50">
                        {candidate.profile?.tagline}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
                {data.candidates.slice(3).map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => setSelectedCandidate(candidate)}
                    className="flex w-full items-center gap-4 border-b border-white/[0.07] bg-[#15181b] p-4 text-left last:border-0 hover:bg-white/[0.05]"
                  >
                    <span className="w-12 text-center font-mono text-2xl font-black text-[#FBA905]">
                      {candidate.rank}
                    </span>
                    <CandidateVisual
                      candidate={candidate}
                      className="h-14 w-14 rounded-xl"
                    />
                    <div className="flex-1">
                      <div className="font-black">{candidate.name}</div>
                      <div className="text-xs text-white/40">
                        {candidate.profile?.city} ·{" "}
                        {candidate.profile?.genres?.join(" / ")}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/30" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {!["suggestions", "voting", "published"].includes(stage) && (
            <div className="rounded-[2rem] border border-white/10 bg-[#15181b] p-10 text-center md:p-16">
              <Clock3 className="mx-auto h-12 w-12 text-[#FBA905]" />
              <h2 className="mt-6 text-3xl font-black">{content.title}</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/50">
                {content.description}
              </p>
            </div>
          )}
        </div>
      </section>

      {(stage === "suggestions" || stage === "intermission") &&
        data.candidates.length > 0 && (
          <section className="border-y border-white/[0.07] bg-[#111315] px-4 py-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.2em] text-[#FBA905]">
                    La comunidad ya habló
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    Nombres que están creciendo
                  </h2>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {data.candidates.slice(0, 5).map((candidate) => (
                  <div
                    key={candidate.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-[#191c1f]"
                  >
                    <CandidateVisual candidate={candidate} className="h-44" />
                    <div className="p-4">
                      <h3 className="font-black">{candidate.name}</h3>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[#FBA905]"
                          style={{
                            width: `${Math.min(100, (candidate.suggestionCount / cycle.minSuggestions) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-white/40">
                        {candidate.suggestionCount >= cycle.minSuggestions ? (
                          <span className="text-emerald-400">
                            Umbral alcanzado
                          </span>
                        ) : (
                          `${candidate.suggestionCount}/${cycle.minSuggestions} apoyos`
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      <section className="px-4 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(120deg,#1d2024,#111315)] p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12">
          <div>
            <p className="text-sm font-black uppercase tracking-[.2em] text-[#FBA905]">
              Más que una posición
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              Un perfil que cuenta tu historia
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-white/50">
              Los artistas clasificados pueden mostrar fotos, biografía, ciudad,
              géneros, tracks, hitos y enlaces oficiales. El equipo editorial
              verifica y completa cada ficha antes de la votación.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/[.05] p-4">
              <Music2 className="mb-3 h-5 w-5 text-[#FBA905]" />
              Tracks destacados
            </div>
            <div className="rounded-xl bg-white/[.05] p-4">
              <Award className="mb-3 h-5 w-5 text-[#FBA905]" />
              Hitos editoriales
            </div>
            <div className="rounded-xl bg-white/[.05] p-4">
              <Share2 className="mb-3 h-5 w-5 text-[#FBA905]" />
              Perfil compartible
            </div>
            <div className="rounded-xl bg-white/[.05] p-4">
              <Star className="mb-3 h-5 w-5 text-[#FBA905]" />
              Historial anual
            </div>
          </div>
        </div>
      </section>

      {data.history.length > 0 && (
        <section className="px-4 pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="mr-3 text-sm font-bold text-white/45">
                Explorar ediciones:
              </span>
              {data.history.map((historyYear) => (
                <button
                  key={historyYear}
                  onClick={() => setYear(historyYear)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold hover:border-[#FBA905] hover:text-[#FBA905]"
                >
                  {historyYear}
                </button>
              ))}
              {year && (
                <button
                  onClick={() => setYear(undefined)}
                  className="rounded-full px-4 py-2 text-sm text-white/45"
                >
                  Volver a la actual
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {selectedCandidate && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4"
          onClick={() => setSelectedCandidate(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#171a1d] sm:rounded-[2rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <CandidateVisual candidate={selectedCandidate} className="h-72" />
            <button
              onClick={() => setSelectedCandidate(null)}
              aria-label="Cerrar perfil"
              className="absolute right-6 top-6 rounded-full bg-black/55 p-2"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-7 md:p-9">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#FBA905]">
                    {selectedCandidate.profile?.city || cycle.countryName}
                  </p>
                  <h2 className="mt-1 text-4xl font-black">
                    {selectedCandidate.name}
                  </h2>
                </div>
                {selectedCandidate.rank && (
                  <div className="rounded-xl bg-[#FBA905] px-3 py-2 font-black text-black">
                    #{selectedCandidate.rank}
                  </div>
                )}
              </div>
              <p className="mt-5 leading-relaxed text-white/60">
                {selectedCandidate.profile?.bio ||
                  selectedCandidate.profile?.tagline}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {selectedCandidate.profile?.genres?.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full bg-white/[.06] px-3 py-1.5 text-xs font-bold"
                  >
                    {genre}
                  </span>
                ))}
              </div>
              {selectedCandidate.profile?.tracks?.length ? (
                <div className="mt-8">
                  <h3 className="mb-3 font-black">Tracks destacados</h3>
                  {selectedCandidate.profile.tracks.map((track, index) => (
                    <a
                      key={`${track.title}-${index}`}
                      href={track.url || "#"}
                      target={track.url ? "_blank" : undefined}
                      className="flex items-center gap-3 border-t border-white/[.07] py-3 text-sm"
                    >
                      <span className="font-mono text-white/30">
                        0{index + 1}
                      </span>
                      <span className="flex-1">{track.title}</span>
                      {track.url && (
                        <ExternalLink className="h-4 w-4 text-white/30" />
                      )}
                    </a>
                  ))}
                </div>
              ) : null}
              <a
                href={selectedCandidate.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-black text-black"
              >
                <Instagram className="h-4 w-4" />@
                {selectedCandidate.instagramHandle}
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

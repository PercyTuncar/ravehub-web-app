"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  ExternalLink,
  Image as ImageIcon,
  Instagram,
  Loader2,
  MapPin,
  Music2,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Vote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/admin/AuthGuard";
import { FileUpload } from "@/components/common/FileUpload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  TopDjsCandidate,
  TopDjsCandidateProfile,
  TopDjsCycle,
} from "@/lib/types";
import {
  deriveTopDjsStage,
  TOP_DJS_COUNTRIES,
  utcToZonedInput,
  zonedInputToUtc,
} from "@/lib/top-djs/config";

type AdminPayload = {
  cycles: TopDjsCycle[];
  selectedCycle: TopDjsCycle | null;
  candidates: TopDjsCandidate[];
};

function initialCycle(): TopDjsCycle {
  const year = new Date().getFullYear();
  const country = TOP_DJS_COUNTRIES.peru;
  return {
    id: "",
    countrySlug: "peru",
    countryCode: country.code,
    countryName: country.name,
    flag: country.flag,
    year,
    timezone: country.timezone,
    suggestionOpensAt: "",
    suggestionClosesAt: "",
    votingOpensAt: "",
    votingClosesAt: "",
    minSuggestions: 5,
    maxBallotChoices: 5,
    statusOverride: "automatic",
    heroEyebrow: "La escena elige",
    heroTitle: `El sonido de ${country.name} tiene nombres propios`,
    heroDescription:
      "Impulsa al talento que está moviendo pistas, creando comunidad y llevando nuestra escena más lejos.",
  };
}

const inputClass =
  "h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-white/25";

export default function TopDjsAdminPage() {
  const [data, setData] = useState<AdminPayload>({
    cycles: [],
    selectedCycle: null,
    candidates: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [cycleForm, setCycleForm] = useState<TopDjsCycle>(initialCycle());
  const [editing, setEditing] = useState<TopDjsCandidate | null>(null);
  const [profile, setProfile] = useState<TopDjsCandidateProfile>({});
  const [candidateName, setCandidateName] = useState("");
  const [candidateStatus, setCandidateStatus] =
    useState<TopDjsCandidate["status"]>("suggested");
  const [adminNotes, setAdminNotes] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async (cycleId?: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/top-djs${cycleId ? `?cycleId=${cycleId}` : ""}`,
        { cache: "no-store" },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setData(payload);
      setSelectedId(payload.selectedCycle?.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo cargar.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(selectedId);
  }, [load, selectedId]);

  const candidates = useMemo(
    () =>
      data.candidates.filter((candidate) =>
        `${candidate.name} ${candidate.instagramHandle}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [data.candidates, query],
  );
  const cycle = data.selectedCycle;
  const stage = cycle ? deriveTopDjsStage(cycle) : null;
  const dashboardStats: Array<{
    label: string;
    value: number;
    icon: LucideIcon;
    color: string;
  }> = [
    {
      label: "Sugerencias",
      value: data.candidates.reduce(
        (sum, item) => sum + item.suggestionCount,
        0,
      ),
      icon: Users,
      color: "text-sky-400",
    },
    {
      label: "Clasificados",
      value: data.candidates.filter((item) => item.status === "eligible")
        .length,
      icon: CheckCircle2,
      color: "text-emerald-400",
    },
    {
      label: "Boletas",
      value: Math.max(
        ...data.candidates.map((item) => item.ballotCount ?? 0),
        0,
      ),
      icon: Vote,
      color: "text-violet-400",
    },
    {
      label: "Perfiles completos",
      value: data.candidates.filter(
        (item) => item.profile?.bio && item.profile?.imageUrl,
      ).length,
      icon: Sparkles,
      color: "text-[#FBA905]",
    },
  ];

  const post = async (body: unknown, success: string) => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/top-djs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast.success(success);
      await load(selectedId);
      return result;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar.",
      );
      return null;
    } finally {
      setSaving(false);
    }
  };

  const changeCountry = (countrySlug: keyof typeof TOP_DJS_COUNTRIES) => {
    const country = TOP_DJS_COUNTRIES[countrySlug];
    setCycleForm((current) => ({
      ...current,
      countrySlug,
      countryCode: country.code,
      countryName: country.name,
      flag: country.flag,
      timezone: country.timezone,
      heroTitle: `El sonido de ${country.name} tiene nombres propios`,
    }));
  };

  const editCycle = (value: TopDjsCycle) => {
    setCycleForm({ ...value });
    setShowCycleForm(true);
  };

  const saveCycle = async () => {
    const timezone = cycleForm.timezone;
    const normalized = {
      ...cycleForm,
      suggestionOpensAt: zonedInputToUtc(cycleForm.suggestionOpensAt, timezone),
      suggestionClosesAt: zonedInputToUtc(
        cycleForm.suggestionClosesAt,
        timezone,
      ),
      votingOpensAt: zonedInputToUtc(cycleForm.votingOpensAt, timezone),
      votingClosesAt: zonedInputToUtc(cycleForm.votingClosesAt, timezone),
    };
    const result = await post(
      { action: "save-cycle", cycle: normalized },
      "Edición guardada.",
    );
    if (result) {
      setSelectedId(result.id);
      setShowCycleForm(false);
    }
  };

  const openCandidate = (candidate: TopDjsCandidate) => {
    setEditing(candidate);
    setCandidateName(candidate.name);
    setCandidateStatus(candidate.status);
    setProfile(candidate.profile ?? {});
    setAdminNotes(candidate.adminNotes ?? "");
  };

  const saveCandidate = async () => {
    if (!editing) return;
    const result = await post(
      {
        action: "update-candidate",
        candidateId: editing.id,
        update: {
          name: candidateName,
          status: candidateStatus,
          profile,
          adminNotes,
        },
      },
      "Perfil editorial actualizado.",
    );
    if (result) setEditing(null);
  };

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen text-white">
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[.22em] text-[#FBA905]">
              <Trophy className="h-4 w-4" />
              Programa editorial
            </div>
            <h1 className="text-4xl font-black tracking-tight">
              Ravehub Top DJs
            </h1>
            <p className="mt-2 text-white/45">
              Administra ediciones, clasifica sugerencias y construye perfiles
              que los artistas quieran compartir.
            </p>
          </div>
          <Button
            onClick={() => {
              setCycleForm(initialCycle());
              setShowCycleForm(true);
            }}
            className="gap-2 bg-[#FBA905] font-black text-black hover:bg-[#ffba2b]"
          >
            <Plus className="h-4 w-4" />
            Nueva edición
          </Button>
        </div>

        {loading && !cycle ? (
          <div className="flex h-72 items-center justify-center">
            <Loader2 className="h-9 w-9 animate-spin text-[#FBA905]" />
          </div>
        ) : !cycle ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.03] p-16 text-center">
            <Trophy className="mx-auto h-12 w-12 text-white/20" />
            <h2 className="mt-5 text-xl font-black">Crea la primera edición</h2>
            <p className="mt-2 text-sm text-white/40">
              Configura las fechas del país y comienza a recibir sugerencias.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111315] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <select
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  className="h-11 min-w-60 rounded-xl border border-white/10 bg-black/30 px-3 font-bold"
                >
                  {data.cycles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.flag} {item.countryName} · {item.year}
                    </option>
                  ))}
                </select>
                <span className="rounded-full bg-[#FBA905]/10 px-3 py-1.5 text-xs font-black uppercase text-[#FBA905]">
                  {stage}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => editCycle(cycle)}
                  className="gap-2 border-white/10 bg-transparent"
                >
                  <CalendarClock className="h-4 w-4" />
                  Fechas y reglas
                </Button>
                <Button
                  variant="outline"
                  disabled={
                    saving || stage === "scheduled" || stage === "suggestions"
                  }
                  onClick={() =>
                    post(
                      { action: "finalize-suggestions", cycleId: cycle.id },
                      "Clasificación recalculada.",
                    )
                  }
                  className="gap-2 border-white/10 bg-transparent"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Aplicar umbral
                </Button>
                <Button
                  disabled={saving || stage !== "review"}
                  onClick={() =>
                    post(
                      { action: "publish-results", cycleId: cycle.id },
                      "Ranking publicado y archivado.",
                    )
                  }
                  className="gap-2 bg-emerald-500 font-black text-black hover:bg-emerald-400"
                >
                  <Trophy className="h-4 w-4" />
                  Publicar ranking
                </Button>
              </div>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {dashboardStats.map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/[.08] bg-[#111315] p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/40">{label}</span>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div className="mt-4 text-3xl font-black">{value}</div>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111315]">
              <div className="flex flex-col gap-4 border-b border-white/[.08] p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black">Talento sugerido</h2>
                  <p className="text-sm text-white/40">
                    Completa el perfil antes de abrir la votación.
                  </p>
                </div>
                <div className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3">
                  <Search className="h-4 w-4 text-white/30" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar DJ o Instagram"
                    className="w-64 bg-transparent text-sm outline-none placeholder:text-white/25"
                  />
                </div>
              </div>
              <div className="divide-y divide-white/[.07]">
                {candidates.map((candidate) => {
                  const complete = Boolean(
                    candidate.profile?.bio &&
                    candidate.profile?.imageUrl &&
                    candidate.profile?.tracks?.length,
                  );
                  return (
                    <button
                      key={candidate.id}
                      onClick={() => openCandidate(candidate)}
                      className="grid w-full grid-cols-[1fr_auto] items-center gap-4 p-5 text-left transition hover:bg-white/[.035] lg:grid-cols-[1.4fr_.55fr_.55fr_.55fr_auto]"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#FBA905] to-pink-500 font-black text-black">
                          {candidate.profile?.imageUrl &&
                          !candidate.profile.imageUrl.startsWith(
                            "linear-gradient",
                          ) ? (
                            <img
                              src={candidate.profile.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            candidate.name.slice(0, 1)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-black">
                            {candidate.name}
                          </div>
                          <div className="mt-1 flex items-center gap-1 truncate text-xs text-white/35">
                            <Instagram className="h-3 w-3" />@
                            {candidate.instagramHandle}
                          </div>
                        </div>
                      </div>
                      <div className="hidden lg:block">
                        <div className="text-lg font-black">
                          {candidate.suggestionCount}
                        </div>
                        <div className="text-xs text-white/35">sugerencias</div>
                      </div>
                      <div className="hidden lg:block">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${candidate.status === "eligible" || candidate.status === "published" ? "bg-emerald-500/10 text-emerald-400" : candidate.status === "rejected" || candidate.status === "disqualified" ? "bg-red-500/10 text-red-400" : "bg-white/[.06] text-white/45"}`}
                        >
                          {candidate.status}
                        </span>
                      </div>
                      <div className="hidden lg:block">
                        <span
                          className={`text-xs font-bold ${complete ? "text-emerald-400" : "text-amber-400"}`}
                        >
                          {complete ? "Perfil listo" : "Por completar"}
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-white/25" />
                    </button>
                  );
                })}
                {!candidates.length && (
                  <div className="p-14 text-center text-sm text-white/35">
                    Todavía no hay sugerencias en esta edición.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <Dialog open={showCycleForm} onOpenChange={setShowCycleForm}>
          <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto border-white/10 bg-[#111315] text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">
                {cycleForm.id ? "Editar edición" : "Nueva edición Top DJs"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-8 py-4 lg:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <Label>País</Label>
                  <select
                    disabled={Boolean(cycleForm.id)}
                    value={cycleForm.countrySlug}
                    onChange={(event) =>
                      changeCountry(
                        event.target.value as keyof typeof TOP_DJS_COUNTRIES,
                      )
                    }
                    className="mt-2 h-11 w-full rounded-md border border-white/10 bg-white/[.04] px-3"
                  >
                    {Object.entries(TOP_DJS_COUNTRIES).map(([slug, item]) => (
                      <option key={slug} value={slug}>
                        {item.flag} {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Año</Label>
                    <Input
                      type="number"
                      disabled={Boolean(cycleForm.id)}
                      value={cycleForm.year}
                      onChange={(e) =>
                        setCycleForm({
                          ...cycleForm,
                          year: Number(e.target.value),
                        })
                      }
                      className={`mt-2 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <Label>Zona horaria</Label>
                    <Input
                      value={cycleForm.timezone}
                      onChange={(e) =>
                        setCycleForm({ ...cycleForm, timezone: e.target.value })
                      }
                      className={`mt-2 ${inputClass}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Umbral</Label>
                    <Input
                      type="number"
                      min={1}
                      value={cycleForm.minSuggestions}
                      onChange={(e) =>
                        setCycleForm({
                          ...cycleForm,
                          minSuggestions: Number(e.target.value),
                        })
                      }
                      className={`mt-2 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <Label>Máximo por boleta</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={cycleForm.maxBallotChoices}
                      onChange={(e) =>
                        setCycleForm({
                          ...cycleForm,
                          maxBallotChoices: Number(e.target.value),
                        })
                      }
                      className={`mt-2 ${inputClass}`}
                    />
                  </div>
                </div>
                <div>
                  <Label>Control manual</Label>
                  <select
                    value={cycleForm.statusOverride}
                    onChange={(e) =>
                      setCycleForm({
                        ...cycleForm,
                        statusOverride: e.target
                          .value as TopDjsCycle["statusOverride"],
                      })
                    }
                    className="mt-2 h-11 w-full rounded-md border border-white/10 bg-white/[.04] px-3"
                  >
                    <option value="automatic">Automático por fechas</option>
                    <option value="paused">Pausado</option>
                    {cycleForm.statusOverride === "published" && (
                      <option value="published">
                        Publicado · ranking cerrado
                      </option>
                    )}
                  </select>
                </div>
              </div>
              <div className="space-y-5">
                <p className="flex items-center gap-2 text-sm font-black text-[#FBA905]">
                  <Clock3 className="h-4 w-4" />
                  Todas las horas se interpretan en {cycleForm.timezone}
                </p>
                {(
                  [
                    ["Apertura de sugerencias", "suggestionOpensAt"],
                    ["Cierre de sugerencias", "suggestionClosesAt"],
                    ["Apertura de votación", "votingOpensAt"],
                    ["Cierre de votación", "votingClosesAt"],
                  ] as const
                ).map(([label, field]) => (
                  <div key={field}>
                    <Label>{label}</Label>
                    <Input
                      type="datetime-local"
                      value={
                        cycleForm[field]
                          ? cycleForm[field].includes("Z")
                            ? utcToZonedInput(
                                cycleForm[field],
                                cycleForm.timezone,
                              )
                            : cycleForm[field]
                          : ""
                      }
                      onChange={(e) =>
                        setCycleForm({ ...cycleForm, [field]: e.target.value })
                      }
                      className={`mt-2 ${inputClass}`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4 border-t border-white/10 pt-6">
              <div>
                <Label>Título principal</Label>
                <Input
                  value={cycleForm.heroTitle ?? ""}
                  onChange={(e) =>
                    setCycleForm({ ...cycleForm, heroTitle: e.target.value })
                  }
                  className={`mt-2 ${inputClass}`}
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={cycleForm.heroDescription ?? ""}
                  onChange={(e) =>
                    setCycleForm({
                      ...cycleForm,
                      heroDescription: e.target.value,
                    })
                  }
                  className="mt-2 border-white/10 bg-white/[.04]"
                />
              </div>
            </div>
            <Button
              disabled={saving}
              onClick={saveCycle}
              className="mt-4 w-full gap-2 bg-[#FBA905] font-black text-black"
            >
              <Save className="h-4 w-4" />
              Guardar edición
            </Button>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(editing)}
          onOpenChange={(open) => !open && setEditing(null)}
        >
          <DialogContent className="max-h-[94vh] max-w-5xl overflow-y-auto border-white/10 bg-[#111315] text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl font-black">
                <Edit3 className="h-5 w-5 text-[#FBA905]" />
                Perfil editorial
              </DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="grid gap-8 py-4 xl:grid-cols-[.8fr_1.2fr]">
                <div className="space-y-6">
                  <div>
                    <Label>Foto de perfil</Label>
                    <FileUpload
                      folder={`top-djs/${editing.cycleId}/${editing.id}`}
                      currentUrl={
                        profile.imageUrl?.startsWith("http")
                          ? profile.imageUrl
                          : undefined
                      }
                      onUploadComplete={(imageUrl) =>
                        setProfile({ ...profile, imageUrl })
                      }
                      onClear={() => setProfile({ ...profile, imageUrl: "" })}
                      compact
                    />
                  </div>
                  <div>
                    <Label>Portada</Label>
                    <FileUpload
                      folder={`top-djs/${editing.cycleId}/${editing.id}/cover`}
                      currentUrl={
                        profile.coverImageUrl?.startsWith("http")
                          ? profile.coverImageUrl
                          : undefined
                      }
                      onUploadComplete={(coverImageUrl) =>
                        setProfile({ ...profile, coverImageUrl })
                      }
                      onClear={() =>
                        setProfile({ ...profile, coverImageUrl: "" })
                      }
                      variant="banner"
                      compact
                    />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Instagram className="h-4 w-4 text-[#FBA905]" />@
                      {editing.instagramHandle}
                      <a
                        href={editing.instagramUrl}
                        target="_blank"
                        className="ml-auto"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <div className="mt-3 text-xs text-white/35">
                      {editing.suggestionCount} sugerencias ·{" "}
                      {editing.votePoints ?? 0} puntos
                    </div>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-[1fr_.45fr]">
                    <div>
                      <Label>Nombre artístico</Label>
                      <Input
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        className={`mt-2 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <Label>Estado</Label>
                      <select
                        value={candidateStatus}
                        onChange={(e) =>
                          setCandidateStatus(
                            e.target.value as TopDjsCandidate["status"],
                          )
                        }
                        className="mt-2 h-11 w-full rounded-md border border-white/10 bg-white/[.04] px-3"
                      >
                        <option value="suggested">Sugerido</option>
                        <option value="eligible">Elegible</option>
                        <option value="rejected">No alcanzó umbral</option>
                        <option value="disqualified">Descalificado</option>
                        <option value="published">Publicado</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label>Tagline</Label>
                    <Input
                      value={profile.tagline ?? ""}
                      onChange={(e) =>
                        setProfile({ ...profile, tagline: e.target.value })
                      }
                      placeholder="Una frase memorable para su propuesta"
                      className={`mt-2 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <Label>Biografía editorial</Label>
                    <Textarea
                      rows={6}
                      value={profile.bio ?? ""}
                      onChange={(e) =>
                        setProfile({ ...profile, bio: e.target.value })
                      }
                      placeholder="Trayectoria, sonido, identidad y momento actual..."
                      className="mt-2 border-white/10 bg-white/[.04]"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Ciudad</Label>
                      <Input
                        value={profile.city ?? ""}
                        onChange={(e) =>
                          setProfile({ ...profile, city: e.target.value })
                        }
                        className={`mt-2 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <Label>Géneros (separados por coma)</Label>
                      <Input
                        value={profile.genres?.join(", ") ?? ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            genres: e.target.value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          })
                        }
                        className={`mt-2 ${inputClass}`}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Tracks destacados</Label>
                    <Textarea
                      rows={4}
                      value={
                        profile.tracks
                          ?.map(
                            (track) =>
                              `${track.title}${track.url ? ` | ${track.url}` : ""}`,
                          )
                          .join("\n") ?? ""
                      }
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          tracks: e.target.value
                            .split("\n")
                            .filter(Boolean)
                            .map((line) => {
                              const [title, url] = line
                                .split("|")
                                .map((item) => item.trim());
                              return { title, url };
                            }),
                        })
                      }
                      placeholder={
                        "Nombre del track | https://...\nLive set 2026 | https://..."
                      }
                      className="mt-2 border-white/10 bg-white/[.04]"
                    />
                    <p className="mt-1 text-xs text-white/30">
                      Un track por línea. El enlace es opcional.
                    </p>
                  </div>
                  <div>
                    <Label>Hitos relevantes</Label>
                    <Textarea
                      rows={3}
                      value={profile.highlights?.join("\n") ?? ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          highlights: e.target.value
                            .split("\n")
                            .map((item) => item.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder={
                        "Festival o club destacado\nLanzamiento importante\nPremio o residencia"
                      }
                      className="mt-2 border-white/10 bg-white/[.04]"
                    />
                  </div>
                  <div>
                    <Label>Spotify</Label>
                    <Input
                      value={profile.socialLinks?.spotify ?? ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          socialLinks: {
                            ...profile.socialLinks,
                            spotify: e.target.value,
                          },
                        })
                      }
                      placeholder="https://open.spotify.com/artist/..."
                      className={`mt-2 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <Label>Notas internas</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Verificaciones, duplicados o decisiones editoriales..."
                      className="mt-2 border-white/10 bg-white/[.04]"
                    />
                  </div>
                  <Button
                    disabled={saving}
                    onClick={saveCandidate}
                    className="w-full gap-2 bg-[#FBA905] font-black text-black"
                  >
                    <Save className="h-4 w-4" />
                    Guardar perfil editorial
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}

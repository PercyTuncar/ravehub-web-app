import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type {
  TopDjsCandidate,
  TopDjsCandidateProfile,
  TopDjsCycle,
} from "@/lib/types";
import {
  deriveTopDjsStage,
  instagramUrl,
  getTopDjsCountry,
  normalizeCandidateKey,
  normalizeInstagramHandle,
  validateCycleDates,
} from "./config";

function toIso(value: any): any {
  if (!value) return value;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(toIso);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, toIso(nested)]),
    );
  }
  return value;
}

async function dbOrThrow() {
  const db = await getAdminDb();
  if (!db) throw new Error("La base de datos no está configurada.");
  return db;
}

export async function getPublicTopDjs(countrySlug: string, year?: number) {
  const db = await dbOrThrow();
  const snapshot = await db
    .collection("topDjsCycles")
    .where("countrySlug", "==", countrySlug)
    .get();
  const cycles: TopDjsCycle[] = snapshot.docs.map(
    (doc: any) => ({ id: doc.id, ...toIso(doc.data()) }) as TopDjsCycle,
  );
  cycles.sort((a, b) => b.year - a.year);
  const publishedCycles = cycles.filter(
    (item) =>
      deriveTopDjsStage(item) === "published" &&
      Boolean(item.resultsPublishedAt || item.statusOverride === "published"),
  );
  const openCycle = cycles.find(
    (item) =>
      deriveTopDjsStage(item) !== "published" &&
      item.year >= (publishedCycles[0]?.year ?? 0),
  );
  const cycle = year
    ? cycles.find((item) => item.year === year)
    : (openCycle ?? publishedCycles[0]);
  if (!cycle) return null;

  const candidateSnapshot = await db
    .collection("topDjsCandidates")
    .where("cycleId", "==", cycle.id)
    .get();
  const allCandidates: TopDjsCandidate[] = candidateSnapshot.docs.map(
    (doc: any) => ({ id: doc.id, ...toIso(doc.data()) }) as TopDjsCandidate,
  );
  const stage = deriveTopDjsStage(cycle);
  const candidates = allCandidates
    .filter((candidate) => {
      if (stage === "published")
        return candidate.status === "published" || Boolean(candidate.rank);
      if (["intermission", "voting", "review"].includes(stage))
        return (
          candidate.suggestionCount >= cycle.minSuggestions &&
          !["disqualified", "merged"].includes(candidate.status)
        );
      return (
        candidate.status !== "disqualified" && candidate.status !== "merged"
      );
    })
    .sort((a, b) =>
      stage === "published"
        ? (a.rank ?? 9999) - (b.rank ?? 9999)
        : (b.suggestionCount ?? 0) - (a.suggestionCount ?? 0),
    );

  const publicCandidates = candidates.map((candidate) => {
    const {
      adminNotes: _adminNotes,
      votePoints: _votePoints,
      ballotCount: _ballotCount,
      ...publicCandidate
    } = candidate;
    return ["intermission", "voting", "review"].includes(stage) &&
      publicCandidate.status !== "published"
      ? { ...publicCandidate, status: "eligible" as const }
      : publicCandidate;
  });

  return {
    cycle,
    stage,
    candidates: publicCandidates,
    history: publishedCycles
      .filter((item) => item.year !== cycle.year)
      .map((item) => item.year),
  };
}

export async function createNomination(
  userId: string,
  input: { cycleId: string; name: string; instagram: string },
) {
  const db = await dbOrThrow();
  const name = input.name.trim().replace(/\s+/g, " ");
  const handle = normalizeInstagramHandle(input.instagram);
  if (name.length < 2 || name.length > 80)
    throw new Error("Ingresa un nombre artístico válido.");
  if (!/^[a-z0-9._]{1,30}$/.test(handle))
    throw new Error("Ingresa un usuario o enlace de Instagram válido.");

  const cycleRef = db.collection("topDjsCycles").doc(input.cycleId);
  const cycleDoc = await cycleRef.get();
  if (!cycleDoc.exists) throw new Error("La edición no existe.");
  const cycle = { id: cycleDoc.id, ...toIso(cycleDoc.data()) } as TopDjsCycle;
  if (deriveTopDjsStage(cycle) !== "suggestions")
    throw new Error("El periodo de sugerencias no está abierto.");

  const candidateId = `${cycle.id}__${normalizeCandidateKey(handle)}`;
  const nominationId = `${cycle.id}__${userId}__${normalizeCandidateKey(handle)}`;
  const candidateRef = db.collection("topDjsCandidates").doc(candidateId);
  const nominationRef = db.collection("topDjsNominations").doc(nominationId);

  await db.runTransaction(async (transaction: any) => {
    const existingNomination = await transaction.get(nominationRef);
    if (existingNomination.exists)
      throw new Error("Ya sugeriste a este DJ en esta edición.");
    const existingCandidate = await transaction.get(candidateRef);

    transaction.set(nominationRef, {
      cycleId: cycle.id,
      candidateId,
      userId,
      countrySlug: cycle.countrySlug,
      year: cycle.year,
      createdAt: FieldValue.serverTimestamp(),
    });

    if (existingCandidate.exists) {
      transaction.update(candidateRef, {
        suggestionCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      transaction.set(candidateRef, {
        cycleId: cycle.id,
        countrySlug: cycle.countrySlug,
        year: cycle.year,
        name,
        normalizedKey: normalizeCandidateKey(handle),
        instagramHandle: handle,
        instagramUrl: instagramUrl(handle),
        suggestionCount: 1,
        status: "suggested",
        votePoints: 0,
        ballotCount: 0,
        profile: { socialLinks: { instagram: instagramUrl(handle) } },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  return { candidateId };
}

export async function saveBallot(
  userId: string,
  cycleId: string,
  choices: string[],
) {
  const db = await dbOrThrow();
  const uniqueChoices = [...new Set(choices)];
  const cycleRef = db.collection("topDjsCycles").doc(cycleId);
  const cycleDoc = await cycleRef.get();
  if (!cycleDoc.exists) throw new Error("La edición no existe.");
  const cycle = { id: cycleDoc.id, ...toIso(cycleDoc.data()) } as TopDjsCycle;
  if (deriveTopDjsStage(cycle) !== "voting")
    throw new Error("La votación no está abierta.");
  if (
    uniqueChoices.length < 1 ||
    uniqueChoices.length > cycle.maxBallotChoices
  ) {
    throw new Error(`Elige entre 1 y ${cycle.maxBallotChoices} DJs.`);
  }

  const candidateRefs = uniqueChoices.map((id) =>
    db.collection("topDjsCandidates").doc(id),
  );
  const ballotRef = db
    .collection("topDjsBallots")
    .doc(`${cycle.id}__${userId}`);

  await db.runTransaction(async (transaction: any) => {
    const ballotDoc = await transaction.get(ballotRef);
    const candidateDocs = await Promise.all(
      candidateRefs.map((ref) => transaction.get(ref)),
    );
    if (
      candidateDocs.some(
        (doc) =>
          !doc.exists ||
          doc.data()?.cycleId !== cycle.id ||
          (doc.data()?.suggestionCount ?? 0) < cycle.minSuggestions ||
          ["disqualified", "merged"].includes(doc.data()?.status),
      )
    ) {
      throw new Error("Uno de los DJs elegidos ya no está disponible.");
    }

    const previous = ballotDoc.exists ? ballotDoc.data() : null;
    const previousPoints = (previous?.points ?? {}) as Record<string, number>;
    for (const [candidateId, points] of Object.entries(previousPoints)) {
      transaction.update(db.collection("topDjsCandidates").doc(candidateId), {
        votePoints: FieldValue.increment(-points),
        ballotCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const points = Object.fromEntries(
      uniqueChoices.map((id, index) => [id, cycle.maxBallotChoices - index]),
    );
    for (const [candidateId, score] of Object.entries(points)) {
      transaction.update(db.collection("topDjsCandidates").doc(candidateId), {
        votePoints: FieldValue.increment(score),
        ballotCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.set(ballotRef, {
      cycleId: cycle.id,
      userId,
      choices: uniqueChoices,
      points,
      createdAt: previous?.createdAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { choices: uniqueChoices };
}

export async function listAdminTopDjs(cycleId?: string) {
  const db = await dbOrThrow();
  const cycleSnapshot = await db.collection("topDjsCycles").get();
  const cycles: TopDjsCycle[] = cycleSnapshot.docs.map(
    (doc: any) => ({ id: doc.id, ...toIso(doc.data()) }) as TopDjsCycle,
  );
  cycles.sort(
    (a, b) => b.year - a.year || a.countryName.localeCompare(b.countryName),
  );
  const selectedId = cycleId ?? cycles[0]?.id;
  if (!selectedId) return { cycles, selectedCycle: null, candidates: [] };
  const candidatesSnapshot = await db
    .collection("topDjsCandidates")
    .where("cycleId", "==", selectedId)
    .get();
  const candidates: TopDjsCandidate[] = candidatesSnapshot.docs
    .map(
      (doc: any) => ({ id: doc.id, ...toIso(doc.data()) }) as TopDjsCandidate,
    )
    .sort(
      (a: TopDjsCandidate, b: TopDjsCandidate) =>
        (b.suggestionCount ?? 0) - (a.suggestionCount ?? 0),
    );
  return {
    cycles,
    selectedCycle: cycles.find((cycle) => cycle.id === selectedId) ?? null,
    candidates,
  };
}

export async function upsertCycle(input: TopDjsCycle) {
  const db = await dbOrThrow();
  const country = getTopDjsCountry(input.countrySlug);
  if (!country) throw new Error("El país seleccionado no es válido.");
  const validationError = validateCycleDates(input);
  if (validationError) throw new Error(validationError);
  if (input.year < 2024 || input.year > 2100)
    throw new Error("El año no es válido.");
  const canonicalId = `${input.countrySlug}-${input.year}`;
  if (input.id && input.id !== canonicalId)
    throw new Error("No se puede cambiar el país o año de una edición creada.");
  const id = canonicalId;
  const ref = db.collection("topDjsCycles").doc(id);
  const existing = await ref.get();
  const existingData = existing.data();
  if (
    input.statusOverride === "published" &&
    existingData?.statusOverride !== "published"
  ) {
    throw new Error(
      "Publica el ranking con la acción «Publicar resultados» para calcular las posiciones.",
    );
  }
  const {
    id: _inputId,
    resultsPublishedAt: _resultsPublishedAt,
    ...cycleData
  } = input;
  await ref.set(
    {
      ...cycleData,
      countryCode: country.code,
      countryName: country.name,
      flag: country.flag,
      timezone: country.timezone,
      statusOverride:
        existingData?.statusOverride === "published"
          ? "published"
          : input.statusOverride === "paused"
            ? "paused"
            : "automatic",
      minSuggestions: Math.max(1, Number(input.minSuggestions) || 5),
      maxBallotChoices: Math.min(
        10,
        Math.max(1, Number(input.maxBallotChoices) || 5),
      ),
      createdAt: existing.exists
        ? existingData?.createdAt
        : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return { id };
}

export async function updateCandidate(
  candidateId: string,
  update: {
    name?: string;
    status?: TopDjsCandidate["status"];
    profile?: TopDjsCandidateProfile;
    adminNotes?: string;
  },
) {
  const db = await dbOrThrow();
  const ref = db.collection("topDjsCandidates").doc(candidateId);
  if (!(await ref.get()).exists) throw new Error("El candidato no existe.");
  const safeUrl = (value?: string) =>
    value && /^https?:\/\//i.test(value) ? value : "";
  const safeProfile = update.profile
    ? {
        ...update.profile,
        imageUrl: safeUrl(update.profile.imageUrl),
        coverImageUrl: safeUrl(update.profile.coverImageUrl),
        tracks: update.profile.tracks?.slice(0, 12).map((track) => ({
          title: track.title.slice(0, 120),
          url: safeUrl(track.url),
        })),
        highlights: update.profile.highlights
          ?.slice(0, 12)
          .map((highlight) => highlight.slice(0, 180)),
        genres: update.profile.genres
          ?.slice(0, 8)
          .map((genre) => genre.slice(0, 40)),
        socialLinks: update.profile.socialLinks
          ? Object.fromEntries(
              Object.entries(update.profile.socialLinks).map(([key, value]) => [
                key,
                safeUrl(value),
              ]),
            )
          : undefined,
      }
    : undefined;
  await ref.update({
    ...update,
    name: update.name?.trim().slice(0, 80),
    profile: safeProfile,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function finalizeSuggestions(cycleId: string) {
  const db = await dbOrThrow();
  const cycleDoc = await db.collection("topDjsCycles").doc(cycleId).get();
  if (!cycleDoc.exists) throw new Error("La edición no existe.");
  const cycle = { id: cycleDoc.id, ...toIso(cycleDoc.data()) } as TopDjsCycle;
  if (["scheduled", "suggestions"].includes(deriveTopDjsStage(cycle)))
    throw new Error("El periodo de sugerencias todavía no ha cerrado.");
  const candidates = await db
    .collection("topDjsCandidates")
    .where("cycleId", "==", cycleId)
    .get();
  const batch = db.batch();
  let eligible = 0;
  candidates.docs.forEach((doc: any) => {
    const data = doc.data();
    if (["disqualified", "merged"].includes(data.status)) return;
    const status =
      (data.suggestionCount ?? 0) >= cycle.minSuggestions
        ? "eligible"
        : "rejected";
    if (status === "eligible") eligible += 1;
    batch.update(doc.ref, { status, updatedAt: FieldValue.serverTimestamp() });
  });
  await batch.commit();
  return { eligible };
}

export async function publishResults(cycleId: string) {
  const db = await dbOrThrow();
  const cycleDoc = await db.collection("topDjsCycles").doc(cycleId).get();
  if (!cycleDoc.exists) throw new Error("La edición no existe.");
  const cycle = { id: cycleDoc.id, ...toIso(cycleDoc.data()) } as TopDjsCycle;
  if (deriveTopDjsStage(cycle) !== "review")
    throw new Error(
      "El ranking solo puede publicarse después del cierre de la votación.",
    );
  const candidatesSnapshot = await db
    .collection("topDjsCandidates")
    .where("cycleId", "==", cycleId)
    .get();
  const candidates = candidatesSnapshot.docs
    .filter(
      (doc: any) =>
        (doc.data().suggestionCount ?? 0) >= cycle.minSuggestions &&
        !["disqualified", "merged"].includes(doc.data().status),
    )
    .sort(
      (a: any, b: any) =>
        (b.data().votePoints ?? 0) - (a.data().votePoints ?? 0) ||
        (b.data().ballotCount ?? 0) - (a.data().ballotCount ?? 0),
    );
  if (!candidates.length)
    throw new Error("No hay candidatos elegibles para publicar.");
  const batch = db.batch();
  candidates.forEach((doc: any, index: number) =>
    batch.update(doc.ref, {
      status: "published",
      rank: index + 1,
      updatedAt: FieldValue.serverTimestamp(),
    }),
  );
  batch.update(db.collection("topDjsCycles").doc(cycleId), {
    statusOverride: "published",
    resultsPublishedAt: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return { published: candidates.length };
}

// Small utility to inspect Firestore docs for specific slugs
// Usage: node scripts/inspect_db.mjs
// It reads .env.local to initialize Firebase client SDK

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Lazy import firebase to avoid issues if not installed
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, limit } from 'firebase/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!m) return;
    const key = m[1];
    let value = m[2];
    if (value?.startsWith('"') && value?.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  });
}

function firebaseConfigFromEnv() {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];
  for (const k of required) {
    if (!process.env[k]) throw new Error(`Missing env var: ${k}`);
  }
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

async function fetchSingleBySlug(db, collName, slug) {
  const q = query(collection(db, collName), where('slug', '==', slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function fetchRedirects(db, oldSlug) {
  const q = query(collection(db, 'slugRedirects'), where('oldSlug', '==', oldSlug));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function main() {
  loadEnvLocal();
  const firebaseConfig = firebaseConfigFromEnv();
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const blogSlug1 = 'dldk-chile-2025';
  const blogSlug2 = 'as-fue-el-show-de-martin-garrix-en-ultra-music-festival-2025';
  const eventSlug = 'dldk-chile-2025';

  const [blog1, blog2, event1, redirects1, redirects2] = await Promise.all([
    fetchSingleBySlug(db, 'blog', blogSlug1),
    fetchSingleBySlug(db, 'blog', blogSlug2),
    fetchSingleBySlug(db, 'events', eventSlug),
    fetchRedirects(db, blogSlug2),
    fetchRedirects(db, blogSlug1),
  ]);

  function pickBlog(b) {
    if (!b) return null;
    return {
      id: b.id,
      slug: b.slug,
      title: b.title,
      seoTitle: b.seoTitle,
      seoDescription: b.seoDescription,
      excerpt: b.excerpt,
      status: b.status,
      publishDate: b.publishDate,
      relatedEventId: b.relatedEventId || null,
    };
  }

  function pickEvent(e) {
    if (!e) return null;
    return {
      id: e.id,
      slug: e.slug,
      name: e.name,
      shortDescription: e.shortDescription,
      seoTitle: e.seoTitle,
      seoDescription: e.seoDescription,
      startDate: e.startDate,
      location: e.location,
      eventStatus: e.eventStatus,
    };
  }

  const report = {
    blog: {
      [blogSlug1]: pickBlog(blog1),
      [blogSlug2]: pickBlog(blog2),
    },
    event: {
      [eventSlug]: pickEvent(event1),
    },
    redirects: {
      [`oldSlug:${blogSlug2}`]: redirects1,
      [`oldSlug:${blogSlug1}`]: redirects2,
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


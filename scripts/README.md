# Database Scripts

This directory contains scripts for managing Firestore data in the Ravehub project.

## Available Scripts

### Seed Firestore (`seed-firestore.js`)

Populates Firestore with initial data for development and testing.

```bash
# Seed development environment
node scripts/seed-firestore.js development

# Seed staging environment
node scripts/seed-firestore.js staging

# Seed production environment (use with caution!)
node scripts/seed-firestore.js production
```

**What it does:**
- Clears existing data (development only)
- Seeds countries, currencies, blog categories, product categories, and sample DJs
- Creates initial configuration data

### Export Firestore (`export-firestore.js`)

Exports Firestore collections to JSON files for backup or migration.

```bash
# Export all collections from development
node scripts/export-firestore.js development all

# Export specific collections
node scripts/export-firestore.js development users,events,blog

# Export from production
node scripts/export-firestore.js production all
```

**What it does:**
- Exports all documents from specified collections
- Saves JSON files in `exports/` directory with timestamps
- Creates a summary file with export details

## Prerequisites

1. **Firebase Service Account Keys**: Place the appropriate service account key files in the `firebase/` directory:
   - `serviceAccountKey-development.json`
   - `serviceAccountKey-staging.json`
   - `serviceAccountKey-production.json`

2. **Node.js**: Ensure Node.js 18+ is installed

3. **Firebase Admin SDK**: The scripts use Firebase Admin SDK for server-side operations

## File Structure

```
exports/
├── collection-name-2025-10-18T22-51-51-762Z.json
├── export-summary.json
firebase/
├── serviceAccountKey-development.json
├── serviceAccountKey-staging.json
├── serviceAccountKey-production.json
scripts/
├── seed-firestore.js
├── export-firestore.js
└── README.md
```

## Security Notes

- Service account keys are **not committed** to git (they're in `.gitignore`)
- Export files may contain sensitive data - handle with care
- Production exports should be encrypted and stored securely
- Never run seed scripts on production without explicit approval

## Usage in CI/CD

These scripts can be integrated into the CI/CD pipeline for:

- Automated testing data setup
- Database migrations
- Backup procedures
- Environment synchronization

Example GitHub Actions step:

```yaml
- name: Seed test database
  run: node scripts/seed-firestore.js development
  env:
    GOOGLE_APPLICATION_CREDENTIALS: firebase/serviceAccountKey-development.json
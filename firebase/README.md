# Firebase Configuration

This directory contains Firebase configuration files and setup instructions for the Ravehub project.

## Project Structure

We maintain separate Firebase projects for each environment:

- **Development**: `ravehub-dev` - For local development and testing
- **Staging**: `ravehub-staging` - For pre-production testing
- **Production**: `event-ticket-website-6b541` - Live production environment

## Setup Instructions

### 1. Create Firebase Projects

Create three Firebase projects in the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project `ravehub-dev`
3. Create project `ravehub-staging`
4. Create project `event-ticket-website-6b541`

### 2. Enable Required Services

For each project, enable:

- **Authentication**: Email/Password and Google providers
- **Firestore Database**
- **Firebase Storage**
- **Cloud Functions** (if using serverless functions)
- **Hosting** (optional, since we use Vercel)

### 3. Configure Authentication

In Authentication settings:

- Enable Email/Password sign-in
- Enable Google sign-in
- Configure authorized domains (localhost:3000, vercel.app domains, www.ravehublatam.com)

### 4. Firestore Security Rules

Apply the following security rules (create `firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Admins can read all user data
    match /users/{userId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'moderator'];
    }

    // Public read for events, products, blog posts
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'moderator'];
    }

    // Similar rules for other collections...
  }
}
```

### 5. Storage Security Rules

Apply storage rules (create `storage.rules`):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.auth.token.role in ['admin', 'moderator'];
    }
  }
}
```

### 6. Service Account Keys

1. Go to Project Settings > Service Accounts
2. Generate new private key for each environment
3. Save as `serviceAccountKey-dev.json`, `serviceAccountKey-staging.json`, `serviceAccountKey-prod.json`
4. **Never commit these files to git** - they are in `.gitignore`

### 7. Environment Variables

Update the corresponding `.env` files with the actual Firebase configuration values from the Firebase Console.

## Development with Firestore Emulator

For local development, use the Firestore emulator:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Start emulators
firebase emulators:start --only firestore

# In another terminal, set USE_FIRESTORE_EMULATOR=true in .env.development
```

## Deployment

Firebase configuration is automatically deployed via the CI/CD pipeline when environment variables are updated.

## Security Notes

- Service account keys should be stored securely (Vercel secrets, GitHub secrets)
- Firestore rules should be regularly audited
- Enable Firebase Security Rules monitoring
- Set up billing alerts to prevent unexpected costs
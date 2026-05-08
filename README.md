# MD3Beats

Production React + TypeScript + Vite site for MD3Beats with public news, admin auth, and a Cloudinary-backed CMS.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

3. Fill in:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ADMIN_EMAIL=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

4. Run locally:

```bash
npm run dev
```

## Firebase Services

Enable these services in Firebase:

- Authentication: enable Email/Password provider.
- Firestore Database: production mode is fine once rules below are deployed.

Images do not use Firebase Storage. Admin cover uploads go to Cloudinary unsigned uploads and the returned `secure_url` is saved in Firestore.

## Firestore Rules

Deploy the included `firestore.rules`:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /news/{docId} {
      allow read: if resource.data.status == "published";
      allow read, write: if request.auth != null;
    }
    match /inquiries/{docId} {
      allow create: if true;
      allow read, write: if request.auth != null;
    }
  }
}
```

## Cloudinary Setup

Create an unsigned upload preset in Cloudinary and set its folder behavior to allow uploads. Add these Vercel environment variables:

- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

The app uploads to the `md3beats-news` folder.

## Vercel Deployment

1. Push the project to GitHub.
2. Import it in Vercel.
3. In Vercel project settings, open **Environment Variables**.
4. Add every key from `.env.example`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_ADMIN_EMAIL`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

5. Redeploy after adding env vars.

The included `vercel.json` handles SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Admin

- Login route: `/admin`
- Dashboard route: `/admin/dashboard`
- Only the Firebase Auth user whose email matches `VITE_ADMIN_EMAIL` is allowed into the dashboard.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

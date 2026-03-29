# Deployment Guide

## Vercel Deployment

This is a static site — no build step needed. Vercel serves it directly.

### Steps
1. Push to GitHub (see commands below)
2. Go to vercel.com → New Project → Import from GitHub
3. Select the `semi-gov` repo
4. Set Root Directory to: `ippb-website`
5. Framework Preset: **Other**
6. Build Command: leave empty
7. Output Directory: `.` (dot)
8. Click Deploy

### After Deployment
Add your Vercel domain to Firebase Console:
- Authentication → Settings → Authorized Domains → Add your `.vercel.app` domain

---

## GitHub Push Commands

```bash
cd "C:\Users\dasso\OneDrive\Desktop\semi-gov website"
echo "# semi-gov" >> README.md
git init
git add .
git commit -m "Initial commit — IPPB Service Center Website"
git branch -M main
git remote add origin https://github.com/soham999a/semi-gov.git
git push -u origin main
```

---

## Firebase Console Setup Checklist

1. Authentication → Sign-in method → Enable:
   - Phone (for OTP login)
   - Google (for Google sign-in)

2. Authentication → Settings → Authorized Domains → Add:
   - `localhost`
   - `your-project.vercel.app`
   - Your custom domain (if any)

3. Firestore Database → Create database → Region: `asia-south1` (Mumbai)

4. Firestore → Rules → Paste contents of `firestore.rules` → Publish

5. Storage → Rules → Allow authenticated reads/writes

---

## Vercel Environment Variables

Go to Vercel Dashboard → Project → Settings → Environment Variables
Add these (all from your Firebase project settings):

| Variable Name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyDB4XCH_GeyH6JsYwhW_FnmR6SRcG6N1hk` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `semi-gov.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `semi-gov` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `semi-gov.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `170294835576` |
| `VITE_FIREBASE_APP_ID` | `1:170294835576:web:c51fee7df30682fd4ef08d` |

> Note: Since this is a pure static site (no build tool), the Firebase config is already hardcoded in `js/firebase-config.js`. The env variables above are for reference/documentation. For production security, consider using Firebase App Check.

---

## Post-Deployment

1. Test phone OTP login
2. Test Google sign-in
3. Register a test user
4. Set a user as admin in Firestore:
   - Firestore → users → [your-user-id] → Edit → add field `isAdmin: true`
5. Test admin dashboard at `/admin-dashboard`

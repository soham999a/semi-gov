# semi-gov

IPPB (India Post Payments Bank) Service Center Website — Full-stack web application built with HTML5, CSS3, Vanilla JavaScript, and Firebase.

## Features
- Phone OTP + Google Sign-In authentication
- Customer dashboard with real-time Firestore data
- Admin control center with dark theme
- Government schemes, AEPS, Insurance, Investment services
- Grievance redressal portal
- Service Worker for offline support
- WCAG AA accessibility

## Tech Stack
- Frontend: HTML5, CSS3, Vanilla JS (ES Modules)
- Backend: Firebase (Auth, Firestore, Storage, Cloud Functions)
- Hosting: Vercel

## Setup
1. Clone the repo
2. Add your Firebase config to `ippb-website/js/firebase-config.js`
3. Deploy Firestore rules from `ippb-website/firestore.rules`
4. Deploy to Vercel

## Environment Variables (Vercel)
See DEPLOYMENT.md for all required env variables.

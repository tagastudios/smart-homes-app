# Smart Homes App

A mobile-first Progressive Web App for construction businesses to track expenses, income, projects, receipts, and account activity from one Firebase-backed dashboard.

## Highlights

- Expense and income workflows organized by project and account.
- Receipt upload and review flow with OCR-assisted parsing.
- AI chat endpoint for business assistant use cases.
- Firebase Auth, Firestore, Storage, and Cloud Functions integration.
- Nuxt 4, Vue 3, Nuxt UI, Tailwind CSS, and PWA support.

## Tech Stack

- Nuxt 4 and Vue 3
- Firebase Auth, Firestore, Storage, and Cloud Functions
- Google Cloud Vision for receipt OCR
- OpenAI API for receipt parsing and assistant responses
- Nuxt UI, Tailwind CSS, ApexCharts, and VueFire

## Environment Variables

Copy `.env.example` to `.env` and fill in your own values:

```bash
cp .env.example .env
```

Required variables:

```env
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_APP_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
OPENAI_API_KEY=
```

Never commit `.env` files, Firebase service account JSON files, or provider API keys. Firebase service account credentials should be stored in the deployment environment only.

## Development

Install dependencies:

```bash
pnpm install
```

Start the local dev server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
```

Preview a production build:

```bash
pnpm preview
```

## Firebase Functions

The functions package is in `functions/`.

```bash
cd functions
pnpm install
pnpm build
```

The receipt-processing functions initialize Firebase Admin services inside function execution paths, log invocation immediately, wrap logic in `try/catch`, and remove undefined values before Firestore writes.

## Portfolio Notes

This project demonstrates a real business operations workflow: transaction tracking, OCR receipt processing, project/account reporting, and AI-assisted data extraction. The public repository intentionally excludes private keys and deployment-only credentials.

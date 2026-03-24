# MindSync

## Setup

1. Install dependencies.

```bash
npm install
```

2. Create environment file from the example.

```bash
copy .env.example .env.local
```

3. Fill required values in `.env.local`:
- `MONGODB_URI`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (only if using Google sign-in)

4. Run dev server.

```bash
npm run dev
```

## Common Auth Errors

- `Cannot read properties of undefined (reading 'startsWith')`
: `MONGODB_URI` is missing or undefined.
- `Database configuration error`
: MongoDB URI is invalid or database is unreachable.

## Notes

- Credentials sign-in/sign-up requires MongoDB to be configured and reachable.
- Google sign-in is automatically enabled only when both Google env vars are set.

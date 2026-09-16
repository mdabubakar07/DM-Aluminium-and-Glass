# Dashboard Checkpoint

This file records the current implementation so the dashboard can be resumed without relying on chat history.

## Current Features

- Hidden 10-tap DM logo access to `#admin`.
- Firebase-first admin authentication with local compatibility fallback.
- Password reset flow through Firebase Auth when configured.
- Customer contact submissions saved locally immediately and synced to Firestore in the background.
- Fast Firestore read/write timeouts with local fallback.
- Dashboard counters for Total, New Works, Pending, Accepted, On Hold, Rejected, and Completed.
- The duplicate rectangular `New` counter was removed. `New Works` remains the date-based new-task view, and `New` remains available in the status filter and task status selector.
- Repeated task status changes with optimistic UI updates.
- Payment status toggle on each task: received or pending.
- Task editing, CSV export, search, project-type filtering, recycle bin, restore, and permanent delete.
- Calculator and Daily Task Records diary. The Daily Payment Ledger and Date Wise Ledger were removed.
- Contact cards: Babumiya `6302072336`, Dawood `7989155621`, and Farid `9065578414`, all using direct `tel:` links.

## Source Of Truth

- Public site and route switching: `src/App.tsx`
- Hidden logo trigger: `src/components/Header.tsx`
- Admin login: `src/components/AdminLogin.tsx`
- Admin dashboard: `src/components/AdminDashboard.tsx`
- Auth state: `src/context/AuthContext.tsx`
- Firebase and local persistence: `src/lib/firebase.ts`
- Firestore security rules: `firestore.rules`
- Firebase environment values: `.env` and `.env.example`

## Firebase Setup Still Required

1. Create the default Firestore database for project `dm-aluminium-glass`.
2. Enable Firebase Authentication with Email/Password.
3. Create the admin user in Firebase Authentication.
4. Deploy `firestore.rules` with `firebase deploy --only firestore`.
5. Keep `.env` private and configure the same variables in the hosting provider.

## Verification

Run from this directory:

```powershell
npm run typecheck
npm run lint
npm run build
```

The only known lint output is the existing React Fast Refresh warning in `src/context/AuthContext.tsx`.
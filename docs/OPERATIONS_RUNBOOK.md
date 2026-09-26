# Portfolio operations runbook

## Routine checks

- Every deploy: require `npm run check`, `npm audit --audit-level=high`, and all Playwright scenarios.
- Monthly: review dependency updates, Firebase Authentication users, service-account keys, Upstash usage, and Vercel function errors.
- Quarterly: exercise token expiry, owner-only Firestore/Storage rules, JSON export/import, snapshot restore, and rollback.

## Incident signals and rollback triggers

Rollback immediately when any of these is observed after a deploy:

- visitor authentication or owner login fails twice from a clean browser;
- `/api/health` is not `200` for five consecutive minutes;
- client/API error rate exceeds 5% for five minutes;
- Firestore rules permit an unauthenticated read or a visitor write;
- the public page has a runtime error, horizontal overflow, or a serious accessibility violation.

## Rollback

1. In Vercel, open the last known-good production deployment and select **Promote to Production**.
2. Confirm `/`, `/#admin`, `/api/health`, token login, and one content read.
3. If data changed, use **관리자 → 변경 이력** to restore the affected document. Never overwrite all documents from an unreviewed JSON file.
4. Revoke exposed Firebase service-account keys or Upstash tokens, rotate the corresponding Vercel secrets, and redeploy.
5. Record the time, affected routes, commit, symptoms, and corrective action in `docs/CHANGELOG.md`.

## Backup and recovery

- Each content save creates an owner-only Firestore snapshot; the newest 10 snapshots per document are retained.
- Before a large edit, export the relevant JSON and verify it can be parsed locally.
- Restore one document at a time. The restore action itself creates another snapshot so it can be reversed.
- Firebase service-account JSON must never be copied into the repository or browser environment variables.

## Environment checklist

- `VITE_OWNER_EMAIL` matches the owner address in both Firebase rule files.
- Firebase client variables contain only public web-app configuration.
- `FIREBASE_SERVICE_ACCOUNT` exists only as a sensitive server-side Vercel variable.
- Upstash REST URL/token are sensitive and enabled for Production and Preview as intended.
- `VITE_SITE_URL` is the canonical production URL used for metadata and sitemaps.

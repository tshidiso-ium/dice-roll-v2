# Production readiness

## Architecture

- `src/`: React client. Firebase Auth owns the login session, Realtime Database supplies live board updates, and `modules/apiClient.js` supplies fresh ID tokens to HTTP APIs.
- `server-backend/functions/index.js`: Firebase Function entry points and HTTP adapters.
- `server-backend/functions/domain/`: pure, tested financial transaction rules.
- `server-backend/functions/firebase/`: Firebase repositories/controllers, secure dice generation, board and player state.

The authoritative financial state is Realtime Database. Board entry and winner payout use a transaction at the common database root because the current schema stores users, boards, and ledgers under different top-level paths. This favors correctness over throughput. A future high-volume version should colocate each aggregate or migrate financial operations to a transactional ledger database.

## Financial invariants

- A deterministic `board/user` ledger key makes a join retry idempotent.
- Membership, debit, funded stake, game count, and join ledger entry commit together.
- Winner state, payout, balance, statistics, and payout ledger entry commit together.
- Bots never add unfunded stake and never receive a user-wallet credit.
- Every deposit must match a server-created reservation. A provider-event hash makes webhook
  retries idempotent, a reservation can be credited only once, and wallet credit plus its
  transaction record commit together.
- Dice score, status, out-player count, and the signed roll audit record commit in one board transaction.

## Configuration

Use `.env.example` files as key-only templates. Frontend Firebase configuration is public client configuration, but payment keys, webhook signing secrets, dice audit secrets, and Admin SDK private keys are secrets.

Configure production secrets without printing their values:

```powershell
firebase functions:secrets:set DICE_AUDIT_SECRET
firebase functions:secrets:set YOCO_SECRET_KEY
firebase functions:secrets:set YOCO_WEBHOOK_SECRET
```

Cloud Functions uses its runtime service account. For local development, use Application Default Credentials. Do not copy a service-account JSON file into `functions/`.

## Validation

```powershell
# frontend
npm run lint
npm run test:ci
npm run build
npm audit --omit=dev
npm audit # also reports the legacy Create React App build/test toolchain

# functions
cd server-backend/functions
npm run check
npm test
npm audit
```

Tests are local and must not point at production. No automated end-to-end environment is currently configured; add an Emulator Suite project before testing workflows that write Firebase data.

## Operational requirements before accepting real money

- Revoke any historical service-account key that was stored locally or shared.
- Configure Secret Manager values and least-privilege runtime identities.
- Review and emulator-test `server-backend/database.rules.json`, `firestore.rules`, and
  `storage.rules`, then deploy them separately. They are deliberately not deployed by this
  refactor because rule deployment changes live access control.
- Add provider reconciliation/refund handling and enforce deposit, KYC, self-exclusion, jurisdiction, and responsible-gambling rules with qualified legal/compliance review.
- Use a certified external RNG or obtain an independent review of the commit/audit design. CSPRNG plus HMAC audit records improves integrity but does not by itself constitute gaming certification.
- Add alerting for failed payments, failed bot play, aborted financial transactions, payout mismatches, and elevated 4xx/5xx rates.
- Load-test root financial transactions before launch and migrate the ledger if contention is material.

# Feature structure: contract.ts / actions.ts / ui.tsx

Every domain slice under src/features/<name>/ has exactly:
- contract.ts — pure data: form description, types. No directives, no React, no UI imports.
- actions.ts — the ONLY "use server" module of the feature. Exports async server actions built with defineAction().
- ui.tsx — the ONLY "use client" module of the feature. Components import actions and contract.
- index.ts — public surface, UI only; never re-exports actions.

Why three files: a module cannot be both "use client" and "use server"; "use server" turns every export into an RPC stub, so the description must live in contract.ts to stay usable as data on the client.

Server protocol lives in src/features/shared/define-action.ts: envelope instance/submissionId, evaluate, runAsyncChecks + normalizeErrors, plain() for Flight, Result assembly. A feature's actions.ts is only its business rule.

UI primitives: src/components/ui (basecn) and src/components/form (universal renderer). No domain knowledge there.

Enforced by npm run check:boundaries (scripts/check-boundaries.mjs): directive placement, index must not export actions, contract purity.
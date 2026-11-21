# Open task: signup email-taken check

The signup form has an async check `email-taken` (lib/form CheckRegistry + serverQuery).
The only place to change is `lookupEmailTaken` in src/features/signup/actions.ts (marked TODO(db)).
Currently a demo Set; replace with a DB lookup and keep the rest untouched.

Load controls already in place: client debounce 350 ms, cache by value, abort of the previous check,
the check runs only for well-formed emails, and the server always re-validates on submit (defineAction checks).
Still missing before production: rate limit / generic response for the public serverQuery (see form-security-and-perf.md).
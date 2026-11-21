# Forms without JS (native POST path)

rwsdk 1.7.5 does not handle React's $ACTION_ID, so we implemented the native path ourselves, no second URL:
- FormShell renders hidden input __form_action=<name> besides the lib/form envelope;
- src/features/shared/form-actions.ts maps names to server actions (auth.signIn, signup.submit);
- src/server/form-action.ts (request middleware, after cors) reads a cloned FormData on POST without __rsc_action_id,
  calls the mapped action and puts the Result into rw.actionResult; the page renders with it, so useForm shows errors before hydration.

Origin: null (opaque origin: sandboxed iframe/console replay) is allowed only when ALLOW_NULL_ORIGIN=1 or on the built-in preview host;
other hosts keep strict rejection.

Verified: Playwright with javaScriptEnabled=false — validation and server error render on the same URL, correct credentials produce no error.
# Universal components must not embed user-facing text

Scope: any reusable component (form renderer, wrappers, primitives composition).
A component mountable anywhere (page, modal, nested screen) must not decide what the user reads.

Rules:
1. No user-facing literals inside reusable components: labels, placeholders, pending/success, empty states, aria-labels.
2. Strings arrive via props or a locale/context provider owned by the feature; never as defaults baked into the component.
3. Validation texts live in the form description (lib/form messages); UI chrome texts are a separate namespace.
4. Component defaults may only be structural (null, undefined, className), never language-specific.

State (2026-11-21): violations fixed. src/app/components/form/index.tsx takes FormTexts
(selectPlaceholder, checking, success, pending); missing texts render nothing.
Feature components (AuthCard, SignupCard) own their copy.
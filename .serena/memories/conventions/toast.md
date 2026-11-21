# Toast: standard shadcn/sonner integration

Mount <Toaster /> from @/components/ui/sonner once in the root rendered tree — here AppLayout (src/app/layouts/app-layout.tsx), because Document is outside the hydrated tree.
Call notifications directly: import { toast } from "sonner"; toast.success("…"), toast.error("…", { description }).
No custom toast lib/store/facade.

Mobile rule: src/lib/use-is-mobile.ts reads the CSS token --mobile from :root (src/app/styles.css, currently (max-width: 1023px)) and feeds it to matchMedia; no breakpoint number in TypeScript, false SSR/no window, dev warning when the token is missing. AppLayout uses it to switch Toaster position (top-center vs bottom-right).
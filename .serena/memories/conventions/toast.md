# Toast: standard shadcn/sonner integration

Mount <Toaster /> from @/components/ui/sonner once in the root rendered tree — here AppLayout (src/app/layouts/app-layout.tsx), because Document is outside the hydrated tree.
Call notifications directly: import { toast } from "sonner"; toast.success("…"), toast.error("…", { description }).
No custom toast lib, store, sink or facade — that was rejected; sonner holds the state.
Position for mobile vs desktop comes from the single app rule useIsMobile() (src/lib/use-is-mobile.ts, breakpoint in src/lib/viewport.ts).
# Toast access point

src/lib/toast — framework-free core: notify(kind, message, input?), toast.* facade, configureToasts(partial) for runtime changes, setToastViewport(resolver) to override the mobile check, setToastSink(sink) for renderers.
src/components/toast — React/sonner adapter: Toaster subscribes to the config store, registers the sink, renders Sonner with the preset (desktop bottom-center 4s/3, mobile top-center 3s/2 at <=640px). Mounted once in AppLayout (client layout), not in Document — Document is outside the hydrated tree.
App code imports only { notify, toast, configureToasts } from '@/lib/toast' (or '@/components/toast'); sonner is never imported directly.
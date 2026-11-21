# RedwoodSDK Minimal Starter

This is the starter project for RedwoodSDK. It's a template designed to get you up and running as quickly as possible.

## Стек

- RedwoodSDK 1.7.5 — React 19, RSC, Cloudflare Workers
- Tailwind CSS v4 — `src/app/styles.css`, подключён в `src/app/document.tsx`
- shadcn/ui CLI в режиме Base UI (`-b base`) + реестр basecn: `@basecn/button`,
  `@basecn/input`, `@basecn/label`, `@basecn/card`, `@basecn/dialog`
  (конфиг в `components.json`, компоненты в `src/components/ui`)
- демо-страница: `src/app/components/basecn-demo.tsx` (`"use client"`)

## Запуск

```shell
npm install
npm run dev
```

## Превью

Vite блокирует незнакомый Host, поэтому `preview.opencode.pzlb.ru` добавлен в
`server.allowedHosts` (`vite.config.mts`). Превью отдаётся собранным приложением:

```shell
npm run build
npm run preview -- --host 0.0.0.0 --port 3000
```

`vite preview` запоминает сборку при старте: после каждого `npm run build`
процесс preview нужно перезапустить, иначе ассеты отдают 500.

## Особенность Alpine/musl

`workerd` собран под glibc и в Alpine не запускается. Обход — обёртка вместо
`node_modules/@cloudflare/workerd-linux-64/bin/workerd`, вызывающая бинарник через
glibc-загрузчик из `/tmp/opencode/glibc`. После `npm install` обёртку надо восстановить.
На Windows и macOS этого не требуется.

Create your new project:

```shell
npx create-rwsdk my-project-name
cd my-project-name
npm install
```

## Running the dev server

```shell
npm run dev
```

Point your browser to the URL displayed in the terminal (e.g. `http://localhost:5173/`). You should see the RedwoodSDK welcome page in your browser.

## Further Reading

- [RedwoodSDK Documentation](https://docs.rwsdk.com/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers)

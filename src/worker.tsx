import { layout, render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { config } from "@/lib/env";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { AppLayout } from "@/app/layouts/app-layout";
import { Home } from "@/app/pages/home";
import { Welcome } from "@/app/pages/welcome";
import { cors } from "@/server/cors";

export type AppContext = {};

export default defineApp(
  [
    cors,
    setCommonHeaders(),
    ({ ctx }) => {
      // setup ctx here
      ctx;
    },
    render(Document, [
      layout(AppLayout, [route("/", Home), route("/welcome", Welcome)]),
    ]),
  ],
  { allowedOrigins: config.appOrigins },
);
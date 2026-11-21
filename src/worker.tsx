import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { Welcome } from "@/app/pages/welcome";
import { cors } from "@/server/cors";
import { config } from "@/env";

export type AppContext = {};

export default defineApp([
  cors,
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [route("/", Home), route("/welcome", Welcome)]),
], { allowedOrigins: config.appOrigins });

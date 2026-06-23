/**
 * Preview the mocked Google consent screen rendered by the local gAuth preset.
 *
 * Usage:
 *   deno task preview:consent
 *   deno task preview:consent --port 4321 --open
 *   deno task preview:consent --state my-state --redirect-uri /done
 *
 * Routes:
 *   GET /          -> the mocked consent screen HTML
 *   GET /callback  -> echoes the submitted `state` and `code` (so you can see
 *                     what the form posts back)
 */
import { parseArgs } from "@std/cli/parse-args";
import { Requirements } from "../lib/preset-local/requirements.local.gauth.ts";

const args = parseArgs(Deno.args, {
  string: ["port", "state", "redirect-uri"],
  boolean: ["open"],
  default: { port: "4321" },
});

const port = Number(args.port);
// redirect_uri is known here, so feed it into the consent screen's own input.
const redirect_uri = args["redirect-uri"] ??
  `http://localhost:${port}/callback`;

const handler = (request: Request): Response => {
  const url = new URL(request.url);

  if (url.pathname === "/callback") {
    const body = JSON.stringify(
      {
        received: "callback",
        state: url.searchParams.get("state"),
        code: url.searchParams.get("code"),
      },
      null,
      2,
    );
    return new Response(body, {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  if (url.pathname === "/") {
    const html = Requirements.render_consent_screen({
      // omit state to let render_consent_screen default it to a random uuid
      ...(args.state ? { state: args.state } : {}),
      redirect_uri,
    });
    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return new Response("Not found", { status: 404 });
};

Deno.serve({
  port,
  onListen: ({ hostname, port }) => {
    const host = hostname === "0.0.0.0" ? "localhost" : hostname;
    const origin = `http://${host}:${port}/`;
    console.log(`Mocked consent screen: ${origin}`);
    if (args.open) {
      const cmd = Deno.build.os === "darwin"
        ? "open"
        : Deno.build.os === "windows"
        ? "explorer"
        : "xdg-open";
      new Deno.Command(cmd, { args: [origin] }).spawn();
    }
  },
}, handler);

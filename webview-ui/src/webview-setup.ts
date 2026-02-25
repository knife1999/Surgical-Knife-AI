import * as Comlink from "comlink";

import type { API } from "../../src/api/api";
import { updateColorScheme } from "./webview-api";

interface UXPWebviewWindow extends Window {
  uxpHost: {
    postMessage: (msg: any) => void;
    addEventListener: (type: string, handler: Function) => void;
    removeEventListener: (type: string, handler: Function) => void;
  };
}
declare var window: UXPWebviewWindow;

const toComlinkEvent = (event: any) => {
  if (event && typeof event === "object" && "data" in event) return event;
  const payload =
    event?.message?.data ??
    event?.message ??
    event;
  return {
    data: payload,
    origin: event?.origin ?? "*",
  };
};

const hostHandlerMap = new WeakMap<Function, Function>();

const hostEndpoint = {
  postMessage: (msg: any, _targetOrigin?: string, _transferables?: any) =>
    window.uxpHost.postMessage(msg),
  addEventListener: (type: string, handler: Function) => {
    const wrapped = (event: any) => handler(toComlinkEvent(event));
    hostHandlerMap.set(handler, wrapped);
    window.uxpHost.addEventListener("message", wrapped);
  },
  removeEventListener: (type: string, handler: Function) => {
    const wrapped = hostHandlerMap.get(handler) || handler;
    window.uxpHost.removeEventListener("message", wrapped);
    hostHandlerMap.delete(handler);
  },
};

export const initWebview = (webviewAPI: object): { page: string; api: API } => {
  const page =
    new URL(location.href).searchParams.get("page") ||
    location.href.split("/").pop()!.replace(".html", "");
  console.log("initWebview called", webviewAPI);
  try {
    const endpoint = Comlink.windowEndpoint(hostEndpoint);
    const comlinkAPI = Comlink.wrap(endpoint);
    Comlink.expose(webviewAPI, endpoint);
    //@ts-ignore
    const api = comlinkAPI.api as API;
    // update color scheme on load (guarded: do not crash startup on bridge timing issues)
    Promise.resolve()
      .then(() => api.getColorScheme?.())
      .then((scheme: any) => {
        if (scheme) updateColorScheme(scheme);
      })
      .catch((error) => {
        console.warn("initWebview getColorScheme failed", error);
      });
    return { api, page };
  } catch (error) {
    console.error("initWebview failed", error);
    return { api: {} as API, page };
  }
};

// basic way to send a message
// const sendMessage = () => window.uxpHost.postMessage({ type: "message", text: "msg" },"*");

// basic way to get a message
// window.addEventListener("message", (e) => console.log(e));

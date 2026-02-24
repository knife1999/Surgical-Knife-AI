import * as Comlink from "comlink";
import { api } from "./api/api";

import type { WebviewAPI } from "../webview-ui/src/webview";
import { id, config } from "../uxp.config";
import { getColorScheme } from "./api/uxp";

interface UXPHTMLWebViewElement extends HTMLElement {
  uxpAllowInspector: string;
  src: string;
  postMessage: (msg: any) => void;
}

let mainWebviewAPIForTabNav: WebviewAPI | null = null;
let mainWebviewElementForTabNav: UXPHTMLWebViewElement | null = null;
let mainTabNavForwardingHandler: ((event: KeyboardEvent) => void) | null = null;

const isEditableHostElement = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tagName = String(element.tagName || "").toLowerCase();
  if (["input", "textarea", "select"].includes(tagName)) return true;
  return Boolean(element.isContentEditable);
};

const isMainWebviewFocusedFromHost = (target: EventTarget | null) => {
  const mainWebview = mainWebviewElementForTabNav;
  if (!mainWebview) return false;
  if (target === mainWebview) return true;
  return document.activeElement === mainWebview;
};

const getMainTabNavDirection = (
  event: KeyboardEvent,
): "prev" | "next" | null => {
  if (event.defaultPrevented) return null;
  if (event.ctrlKey || event.metaKey || event.altKey) return null;

  const key = String(event.key || "");
  let direction: "prev" | "next" | null = null;
  if (key === "ArrowLeft") direction = "prev";
  if (key === "ArrowRight") direction = "next";
  if (!direction) return null;
  if (isEditableHostElement(event.target)) return null;
  if (isMainWebviewFocusedFromHost(event.target)) return null;
  return direction;
};

const installMainTabNavHostForwarding = () => {
  if (mainTabNavForwardingHandler) {
    document.removeEventListener("keydown", mainTabNavForwardingHandler, true);
    window.removeEventListener("keydown", mainTabNavForwardingHandler, true);
  }

  mainTabNavForwardingHandler = (event: KeyboardEvent) => {
    const direction = getMainTabNavDirection(event);
    if (!direction) return;
    if (!mainWebviewAPIForTabNav) return;
    if (typeof mainWebviewAPIForTabNav.hostTriggerMainTabNav !== "function") {
      return;
    }

    event.preventDefault();
    void Promise.resolve(
      mainWebviewAPIForTabNav.hostTriggerMainTabNav(direction),
    ).catch((error) => {
      console.warn("hostTriggerMainTabNav failed", error);
    });
  };

  document.addEventListener("keydown", mainTabNavForwardingHandler, true);
  window.addEventListener("keydown", mainTabNavForwardingHandler, true);
};

const focusWebviewSafe = (webview: UXPHTMLWebViewElement) => {
  try {
    (webview as any).focus?.();
  } catch {
    // no-op
  }
};

const installWebviewFocusRecovery = (
  webview: UXPHTMLWebViewElement,
  parent: Element,
) => {
  const retryTimers = new Set<ReturnType<typeof setTimeout>>();
  const flushRetries = () => {
    retryTimers.forEach((timer) => clearTimeout(timer));
    retryTimers.clear();
  };
  const focusNowWithRetry = () => {
    focusWebviewSafe(webview);
    flushRetries();
    [24, 96, 240].forEach((delay) => {
      const timer = setTimeout(() => {
        retryTimers.delete(timer);
        focusWebviewSafe(webview);
      }, delay);
      retryTimers.add(timer);
    });
  };

  // Ensure first click after app switch targets interactive controls in webview.
  parent.addEventListener("mousedown", () => focusNowWithRetry(), true);
  parent.addEventListener("pointerdown", () => focusNowWithRetry(), true);
  parent.addEventListener("click", () => focusNowWithRetry(), true);
  parent.addEventListener("mouseenter", () => focusNowWithRetry(), true);
  window.addEventListener("focus", () => focusNowWithRetry());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") focusNowWithRetry();
  });

  // Recover focus when panel visibility/size changes (e.g., close -> reopen panel).
  const mutationObserver = new MutationObserver(() => focusNowWithRetry());
  mutationObserver.observe(parent, {
    attributes: true,
    attributeFilter: ["style", "class", "hidden"],
    subtree: false,
  });

  if (typeof ResizeObserver !== "undefined") {
    const resizeObserver = new ResizeObserver(() => focusNowWithRetry());
    resizeObserver.observe(parent as Element);
    resizeObserver.observe(webview as unknown as Element);
  }

  // Kick focus once after bridge setup to cover delayed panel activation.
  [0, 80, 220, 480].forEach((delay) => {
    const timer = setTimeout(() => {
      retryTimers.delete(timer);
      focusNowWithRetry();
    }, delay);
    retryTimers.add(timer);
  });
};

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

export const webviewInitHost = (params?: {
  // webview?: UXPHTMLWebViewElement;
  multi: boolean | string[];
}): Promise<WebviewAPI[]> => {
  const multi = params ? params.multi : false;
  return new Promise((resolve, reject) => {
    let pages = ["main"];
    if (multi === true || Array.isArray(multi)) {
      pages = config.manifest.entrypoints.map(
        (point) => point.id.split(".")!.pop()!,
      );
      console.log("webviewInitHost multi pages", pages);
    }
    let apis: WebviewAPI[] = [];
    pages.map((page, i) => {
      // if (i > 0) return;
      let webview = document.createElement("webview") as UXPHTMLWebViewElement;
      webview.className = "webview-ui";
      webview.id = `webview-${i}`;
      webview.uxpAllowInspector = "true";
      webview.setAttribute("tabindex", "0");
      const origin =
        import.meta.env.VITE_BOLT_MODE === "dev"
          ? `http://localhost:${import.meta.env.VITE_BOLT_WEBVIEW_PORT}/?page=${page}`
          : `plugin:/webview-ui/${page}.html`;
      webview.src = origin;

      const appElement = document.getElementById("app")!;
      const parent =
        i === 0
          ? appElement
          : Array.from(document.getElementsByTagName("uxp-panel")).find(
              (item) => item.getAttribute("panelid") === `${id}.${page}`,
            );
      console.log({ parent });
      webview = parent!.appendChild(webview) as UXPHTMLWebViewElement;
      if (page === "main") {
        mainWebviewElementForTabNav = webview;
        installMainTabNavHostForwarding();
      }
      installWebviewFocusRecovery(webview, parent!);

      webview.addEventListener("message", (e) => {
        console.log("webview message", page, e.message);
      });
      let loaded = false;
      webview.addEventListener("loadstop", (e) => {
        if (loaded) return;
        loaded = true;
        focusWebviewSafe(webview);
        const backendAPI = { api };
        const handlerMap = new WeakMap<any, any>();
        const backendEndpoint = {
          postMessage: (msg: any, _targetOrigin?: string, _transferrables?: any) => {
            console.log("running postMessage", page, msg);
            return webview!.postMessage(msg);
          },
          addEventListener: (type: string, handler: any) => {
            console.log("running addEventListener", webview!.addEventListener);
            const wrapped = (event: any) => {
              handler(toComlinkEvent(event));
            };
            handlerMap.set(handler, wrapped);
            webview!.addEventListener("message", wrapped);
          },
          removeEventListener: (type: string, handler: any) => {
            console.log(
              "running removeEventListener",
              webview!.removeEventListener,
            );
            const wrapped = handlerMap.get(handler) || handler;
            webview!.removeEventListener("message", wrapped);
            handlerMap.delete(handler);
          },
        };

        console.log({ origin });

        const endpoint = Comlink.windowEndpoint(backendEndpoint);

        // Now we bind to the Webview's APIs
        //@ts-ignore
        const comlinkAPI = Comlink.wrap(endpoint) as WebviewAPI;
        if (page === "main") {
          mainWebviewAPIForTabNav = comlinkAPI;
        }
        // TODO: might need to adjust for multi webviews
        apis.push(comlinkAPI);
        // Once - At End
        // Do not lock to a single URL origin here:
        // packaged UXP webview origin may differ from dev URL and break bridge calls.
        Comlink.expose(
          backendAPI,
          endpoint,
          ["*"],
        );
        if (apis.length === pages.length) {
          console.log("webviewInitHost resolved");
          for (const api of apis) {
            getColorScheme().then((scheme) => {
              api.updateColorScheme(scheme);
            });
            //@ts-ignore
            document.theme.onUpdated.addListener(() =>
              getColorScheme().then((scheme) => {
                api.updateColorScheme(scheme);
              }),
            );
          }
          resolve(apis);
        }
        // else {
        //   console.log(
        //     "webviewInitHost not resolved yet",
        //     apis.length,
        //     pages.length,
        //   );
        // }

        // Send Basic Message to Webview
        // webview.postMessage({type: "uxp-to-webview"});

        // Get Basic Messages from Webview
        // let lastEventId = ''
        window.addEventListener("message", (e) => console.log("MESSAGE:", e));
      });
    });
  });
};

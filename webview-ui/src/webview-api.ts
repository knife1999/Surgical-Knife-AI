export type ColorScheme = {
  theme: "light" | "dark" | "lightest" | "darkest";
  colors: {
    "--uxp-host-background-color": string;
    "--uxp-host-text-color": string;
    "--uxp-host-border-color": string;
    "--uxp-host-link-text-color": string;
    "--uxp-host-widget-hover-background-color": string;
    "--uxp-host-widget-hover-text-color": string;
    "--uxp-host-widget-hover-border-color": string;
    "--uxp-host-text-color-secondary": string;
    "--uxp-host-link-hover-text-color": string;
    "--uxp-host-label-text-color": string;
  };
};

export const COLOR_SCHEME_EVENT = "uxp-color-scheme-updated";
export const HOST_MAIN_TAB_NAV_EVENT = "uxp-host-main-tab-nav";

let currentColorScheme: ColorScheme | null = null;

export const getCurrentColorScheme = () => currentColorScheme;

export const pingWebview = () => {
  console.log("pingWebview called");
  return "hello from webview";
};

export const updateColorScheme = (val: ColorScheme) => {
  const { theme, colors } = val;
  console.log("update color scheme", theme, colors);
  currentColorScheme = val;

  const root = document.documentElement;
  for (const [key, color] of Object.entries(colors)) {
    root.style.setProperty(key, color);
  }

  window.dispatchEvent(
    new CustomEvent<ColorScheme>(COLOR_SCHEME_EVENT, {
      detail: val,
    }),
  );

  return "color scheme updated";
};

export const hostTriggerMainTabNav = (direction: "prev" | "next") => {
  window.dispatchEvent(
    new CustomEvent<{ direction: "prev" | "next" }>(HOST_MAIN_TAB_NAV_EVENT, {
      detail: { direction },
    }),
  );
  return "host main tab nav dispatched";
};

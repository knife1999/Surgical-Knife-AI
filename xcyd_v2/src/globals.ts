import type { premierepro as premiereproTypes } from "./types/ppro";

if (typeof require === "undefined") {
  //@ts-ignore
  window.require = (moduleName: string) => {
    return {};
  };
}

const safeRequire = <T = any>(moduleName: string): T | Record<string, never> => {
  try {
    return require(moduleName) as T;
  } catch {
    return {};
  }
};

export const uxp = require("uxp") as typeof import("uxp");
export const photoshop = safeRequire<typeof import("photoshop")>("photoshop") as typeof import("photoshop");
export const indesign = safeRequire<any>("indesign") as any;
export const premierepro = safeRequire<premiereproTypes>("premierepro") as premiereproTypes;
export const illustrator = safeRequire<any>("illustrator") as any;

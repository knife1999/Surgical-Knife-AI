import * as photoshop from "./photoshop"; 
import { uxp } from "../globals";
import * as uxpLib from "./uxp";

const hostName =
  uxp?.host?.name.toLowerCase().replace(/\s/g, "") || ("" as string);

let host: Partial<typeof photoshop> = {};

export type API = typeof uxpLib & Partial<typeof photoshop>;

// This plugin is PS-only in manifest. Prefer real module capability over fragile host-name text matching.
if (typeof (photoshop as any).runSingleImage === "function") {
  host = photoshop;
}

export const getHostCapabilities = async () => ({
  hostName,
  hostApiAttached: host === photoshop,
  runSingleImage: typeof (host as any).runSingleImage === "function",
  getAiQuota: typeof (host as any).getAiQuota === "function",
  captureBatchTask: typeof (host as any).captureBatchTask === "function",
  captureAiChatCurrentSelectionImage:
    typeof (host as any).captureAiChatCurrentSelectionImage === "function",
  runBatchTasks: typeof (host as any).runBatchTasks === "function",
  runGlobalPartition: typeof (host as any).runGlobalPartition === "function",
  savePromptCreateItem: typeof (host as any).savePromptCreateItem === "function",
  initPromptCreateStorage: typeof (host as any).initPromptCreateStorage === "function",
  getPromptCreateStorageInfo: typeof (host as any).getPromptCreateStorageInfo === "function",
  listPromptCreateItems: typeof (host as any).listPromptCreateItems === "function",
  deletePromptCreateItem: typeof (host as any).deletePromptCreateItem === "function",
  togglePromptCreateFavorite: typeof (host as any).togglePromptCreateFavorite === "function",
  listManagedApiKeys: typeof (host as any).listManagedApiKeys === "function",
  saveManagedApiKey: typeof (host as any).saveManagedApiKey === "function",
  saveAiChatApiKey: typeof (host as any).saveAiChatApiKey === "function",
  readAiChatApiKey: typeof (host as any).readAiChatApiKey === "function",
  saveUiThemePreset: typeof (host as any).saveUiThemePreset === "function",
  readUiThemePreset: typeof (host as any).readUiThemePreset === "function",
  saveStartupNoticeConfirmed:
    typeof (host as any).saveStartupNoticeConfirmed === "function",
  readStartupNoticeConfirmed:
    typeof (host as any).readStartupNoticeConfirmed === "function",
  saveCustomFeatureEnabled:
    typeof (host as any).saveCustomFeatureEnabled === "function",
  readCustomFeatureEnabled:
    typeof (host as any).readCustomFeatureEnabled === "function",
  updateManagedApiKey: typeof (host as any).updateManagedApiKey === "function",
  deleteManagedApiKey: typeof (host as any).deleteManagedApiKey === "function",
  clearManagedApiKeys: typeof (host as any).clearManagedApiKeys === "function",
});

export const api = {
  ...uxpLib,
  ...host,
  getHostCapabilities,
} as API & {
  getHostCapabilities: typeof getHostCapabilities;
};

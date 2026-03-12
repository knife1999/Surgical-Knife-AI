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
  forgeTestConnection: typeof (host as any).forgeTestConnection === "function",
  forgeFetchModels: typeof (host as any).forgeFetchModels === "function",
  forgeFetchSamplers: typeof (host as any).forgeFetchSamplers === "function",
  forgeFetchControlNetModules:
    typeof (host as any).forgeFetchControlNetModules === "function",
  forgeFetchControlNetModels:
    typeof (host as any).forgeFetchControlNetModels === "function",
  forgeFetchLoras: typeof (host as any).forgeFetchLoras === "function",
  forgeGenerateImages: typeof (host as any).forgeGenerateImages === "function",
  forgeInterrupt: typeof (host as any).forgeInterrupt === "function",
  youdaoTranslate: typeof (host as any).youdaoTranslate === "function",
  cloudLogin: typeof (host as any).cloudLogin === "function",
  cloudLogout: typeof (host as any).cloudLogout === "function",
  cloudRestoreSession: typeof (host as any).cloudRestoreSession === "function",
  cloudGetUserPoints: typeof (host as any).cloudGetUserPoints === "function",
  cloudGetForgeUrl: typeof (host as any).cloudGetForgeUrl === "function",
  cloudTestForgeConnection: typeof (host as any).cloudTestForgeConnection === "function",
  cloudForgeGenerateImages: typeof (host as any).cloudForgeGenerateImages === "function",
  listForgePresets: typeof (host as any).listForgePresets === "function",
  saveForgePreset: typeof (host as any).saveForgePreset === "function",
  deleteForgePreset: typeof (host as any).deleteForgePreset === "function",
  toggleForgePresetFavorite:
    typeof (host as any).toggleForgePresetFavorite === "function",
  exportForgePresets: typeof (host as any).exportForgePresets === "function",
  importForgePresets: typeof (host as any).importForgePresets === "function",
  undoLastAction: typeof (host as any).undoLastAction === "function",
  reverseAntiTruncationEffect:
    typeof (host as any).reverseAntiTruncationEffect === "function",
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
  saveUiBackgroundSettings:
    typeof (host as any).saveUiBackgroundSettings === "function",
  readUiBackgroundSettings:
    typeof (host as any).readUiBackgroundSettings === "function",
  savePromptHistoryRecords:
    typeof (host as any).savePromptHistoryRecords === "function",
  readPromptHistoryRecords:
    typeof (host as any).readPromptHistoryRecords === "function",
  saveStartupNoticeConfirmed:
    typeof (host as any).saveStartupNoticeConfirmed === "function",
  readStartupNoticeConfirmed:
    typeof (host as any).readStartupNoticeConfirmed === "function",
  saveSingleRunConfirmSkipDate:
    typeof (host as any).saveSingleRunConfirmSkipDate === "function",
  readSingleRunConfirmSkipDate:
    typeof (host as any).readSingleRunConfirmSkipDate === "function",
  saveCustomFeatureEnabled:
    typeof (host as any).saveCustomFeatureEnabled === "function",
  readCustomFeatureEnabled:
    typeof (host as any).readCustomFeatureEnabled === "function",
  stampVisibleLayer:
    typeof (host as any).stampVisibleLayer === "function",
  saveProviderConfigs:
    typeof (host as any).saveProviderConfigs === "function",
  readProviderConfigs:
    typeof (host as any).readProviderConfigs === "function",
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

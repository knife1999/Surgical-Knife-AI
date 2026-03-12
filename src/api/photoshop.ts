import { photoshop, uxp } from "../globals";

import * as forgeCloudService from "./forge-cloud-service";
const DEFAULT_MODEL_NAME = "AJbanana3";
const GEMINI_FLASH_IMAGE_MODEL = "gemini-2.5-flash-image";
const POINTS_PER_USD = 500000;
const PRICE_1K = 0.15;
const PRICE_2K = 0.16;
const PRICE_4K = 0.18;

const storage = (uxp as any).storage;
const fs = storage.localFileSystem;
const API_TRACE_LOG_FOLDER_NAME = "api-request-logs";

type ImageSize = "Auto" | "1K" | "2K" | "4K";
type SingleModel = string;
type AntiMode = 0 | 1 | 2;
type LayerType = "rasterized" | "smartObject";
export type ProviderProtocolMode = "gemini" | "openai" | "both";
type ProviderRuntimeProtocol = "gemini" | "openai";
type AiApiCallResult = {
  imageBase64: string;
  responseLog: string;
  traceId: string;
};
type ApiTraceLogLevel = "info" | "error";

type SelectionBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type PromptPreset = {
  title: string;
  content: string;
};

export type PromptCreateItem = {
  type: 1 | 2;
  favorite: 0 | 1;
  name: string;
  content: string;
  description: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type SavePromptCreateInput = {
  name: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[] | string;
};

export type SavePromptCreateResult = {
  path: string;
  total: number;
  item: PromptCreateItem;
};

export type DeletePromptCreateResult = {
  path: string;
  total: number;
  deleted: boolean;
  name: string;
};

export type TogglePromptCreateFavoriteResult = {
  path: string;
  total: number;
  item: PromptCreateItem;
};

export type PromptCreateStorageInfo = {
  path: string;
  total: number;
  skipRemoteSync?: 0 | 1;
  librarySyncFlag?: 0 | 1;
  librarySyncLastStatus?: "idle" | "success" | "error";
  librarySyncLastMessage?: string;
  librarySyncLastAt?: string;
};

export type PromptCreateListResult = {
  path: string;
  total: number;
  items: PromptCreateItem[];
};

export type ManagedApiKeyItem = {
  name: string;
  value: string;
};

export type ManagedApiKeyListResult = {
  path: string;
  total: number;
  items: ManagedApiKeyItem[];
};

export type SaveManagedApiKeyInput = {
  value: string;
};

export type SaveManagedApiKeyResult = {
  path: string;
  total: number;
  item: ManagedApiKeyItem;
  created: boolean;
};

export type UpdateManagedApiKeyInput = {
  name: string;
  value: string;
};

export type DeleteManagedApiKeyResult = {
  path: string;
  total: number;
  deleted: boolean;
  name: string;
};

export type ReadAiChatApiKeyResult = {
  path: string;
  total: number;
  item: ManagedApiKeyItem | null;
};

export type SaveUiThemePresetInput = {
  value: string;
};

export type SaveUiThemePresetResult = {
  path: string;
  value: string;
};

export type ReadUiThemePresetResult = {
  path: string;
  value: string;
};

export type UiBackgroundSettings = {
  imageDataUrl: string;
  opacity: number;
  panelOpacity: number;
  blur: number;
};

export type SaveUiBackgroundSettingsInput = {
  imageDataUrl?: string;
  opacity?: number;
  panelOpacity?: number;
  blur?: number;
};

export type SaveUiBackgroundSettingsResult = {
  path: string;
  stored: boolean;
  settings: UiBackgroundSettings;
};

export type ReadUiBackgroundSettingsResult = {
  path: string;
  stored: boolean;
  settings: UiBackgroundSettings;
};

export type PromptHistoryEventType =
  | "single-workbench"
  | "ai-chat-prompt"
  | "ai-chat-user-record"
  | "ai-chat-assistant-record";

export type PromptHistoryRecordItem = {
  id: number;
  eventType: PromptHistoryEventType;
  content: string;
  createdAt: number;
};

export type ForgePresetData = {
  mode: ForgeGenerateMode;
  prompt: string;
  negativePrompt: string;
  model: string;
  sampler: string;
  scheduler: string;
  steps: number;
  cfgScale: number;
  denoise: number;
  width: number;
  height: number;
  batchSize: number;
  seed: number;
  lora: string;
  loraWeight: number;
  controlNetEnabled: boolean;
  controlNetModule: string;
  controlNetModel: string;
  controlNetWeight: number;
  timeoutSeconds: number;
  maxResolution: number;
};

export type ForgePresetItem = {
  id: string;
  name: string;
  category: string;
  favorite: 0 | 1;
  createdAt: string;
  updatedAt: string;
  data: ForgePresetData;
};

export type ListForgePresetsResult = {
  path: string;
  total: number;
  items: ForgePresetItem[];
};

export type SaveForgePresetInput = {
  id?: string;
  name: string;
  category?: string;
  favorite?: 0 | 1 | boolean | number;
  data: Partial<ForgePresetData>;
};

export type SaveForgePresetResult = {
  path: string;
  total: number;
  item: ForgePresetItem;
  created: boolean;
};

export type DeleteForgePresetResult = {
  path: string;
  total: number;
  deleted: boolean;
  id: string;
};

export type ToggleForgePresetFavoriteResult = {
  path: string;
  total: number;
  item: ForgePresetItem;
};

export type ExportForgePresetsResult = {
  path: string;
  exported: number;
};

export type ImportForgePresetsInput = {
  replace?: boolean;
};

export type ImportForgePresetsResult = {
  path: string;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  replaced: boolean;
};

export type SavePromptHistoryRecordsInput = {
  records?: PromptHistoryRecordItem[] | any[];
};

export type SavePromptHistoryRecordsResult = {
  path: string;
  total: number;
  records: PromptHistoryRecordItem[];
};

export type ReadPromptHistoryRecordsResult = {
  path: string;
  total: number;
  records: PromptHistoryRecordItem[];
};

export type SaveStartupNoticeConfirmedInput = {
  value: boolean | number | string;
};

export type SaveStartupNoticeConfirmedResult = {
  path: string;
  value: 0 | 1;
};

export type ReadStartupNoticeConfirmedResult = {
  path: string;
  value: 0 | 1;
};

export type SaveCustomFeatureEnabledInput = {
  value: boolean | number | string;
};

export type SaveCustomFeatureEnabledResult = {
  path: string;
  value: 0 | 1;
};

export type ReadCustomFeatureEnabledResult = {
  path: string;
  value: 0 | 1;
};

export type SaveSingleRunConfirmSkipDateInput = {
  value?: string;
};

export type SaveSingleRunConfirmSkipDateResult = {
  path: string;
  value: string;
};

export type ReadSingleRunConfirmSkipDateResult = {
  path: string;
  value: string;
};

export type ProviderConfigItem = {
  id: string;
  name: string;
  baseUrl: string;
  key: string;
  protocolMode: ProviderProtocolMode;
};

export type SaveProviderConfigsInput = {
  items?: ProviderConfigItem[] | any[];
  selectedSingleProviderId?: string;
  selectedAiChatProviderId?: string;
};

export type SaveProviderConfigsResult = {
  path: string;
  total: number;
  items: ProviderConfigItem[];
  selectedSingleProviderId: string;
  selectedAiChatProviderId: string;
};

export type ReadProviderConfigsResult = {
  path: string;
  total: number;
  items: ProviderConfigItem[];
  selectedSingleProviderId: string;
  selectedAiChatProviderId: string;
};

export type RunSingleImageOptions = {
  prompt: string;
  apiKey: string;
  apiBaseUrl: string;
  model?: string;
  providerProtocol?: ProviderRuntimeProtocol;
  size: ImageSize;
  batchSize: number;
  timeoutSeconds: number;
  antiTruncationMode: AntiMode;
  layerType: LayerType;
  maxResolution: number;
};

export type RunSingleImageResult = {
  previewBase64: string;
  successCount: number;
  failureCount: number;
  totalCount: number;
  errorMessages: string[];
  responseLogs: string[];
};

export type ForgeGenerateMode = "img2img" | "txt2img";

export type ForgeGenerateOptions = {
  url: string;
  mode?: ForgeGenerateMode;
  prompt: string;
  negativePrompt?: string;
  model?: string;
  sampler?: string;
  scheduler?: string;
  steps?: number;
  cfgScale?: number;
  denoise?: number;
  width?: number;
  height?: number;
  batchSize?: number;
  seed?: number;
  lora?: string;
  loraWeight?: number;
  controlNetEnabled?: boolean;
  controlNetModule?: string;
  controlNetModel?: string;
  controlNetWeight?: number;
  timeoutSeconds?: number;
  antiTruncationMode?: AntiMode;
  layerType?: LayerType;
  maxResolution?: number;
};

export type ForgeGenerateResult = {
  mode: ForgeGenerateMode;
  successCount: number;
  failureCount: number;
  totalCount: number;
  errorMessages: string[];
};

export type YoudaoTranslateOptions = {
  text: string;
  fromLang?: string;
  toLang?: string;
};

export type YoudaoTranslateResult = {
  success: boolean;
  text?: string;
  error?: string;
};

export type CloudLoginOptions = {
  email: string;
  password: string;
  remember?: boolean;
};

export type CloudLoginResult = {
  success: boolean;
  message?: string;
  user?: any;
  setting?: {
    remember: boolean;
    email: string;
    password: string;
  };
};

export type CloudPointsResult = {
  success: boolean;
  points: number;
  data?: any;
  message?: string;
};

export type CloudForgeUrlResult = {
  success: boolean;
  encrypted?: string;
  url?: string;
  error?: string;
};

export type CloudForgeTestResult = {
  success: boolean;
  encrypted?: string;
  modelCount?: number;
  error?: string;
};

export type CloudForgeGenerateOptions = ForgeGenerateOptions & {
  encrypted: string;
};

export type CloudForgeGenerateResult = ForgeGenerateResult & {
  cloudConsumed?: number;
  cloudBalance?: number;
};

export type BatchTaskSettings = {
  providerProtocol: ProviderRuntimeProtocol;
  size: ImageSize;
  count: number;
  timeoutSeconds: number;
  antiTruncationMode: AntiMode;
  layerType: LayerType;
  maxResolution: number;
};

export type BatchTaskItem = {
  id: number;
  docId: number;
  docName: string;
  prompt: string;
  base64: string;
  selection: SelectionBounds;
  settings: BatchTaskSettings;
};

export type CaptureBatchTaskOptions = {
  prompt: string;
  providerProtocol?: ProviderRuntimeProtocol;
  size: ImageSize;
  count: number;
  timeoutSeconds: number;
  antiTruncationMode: AntiMode;
  layerType: LayerType;
  maxResolution: number;
};

export type CaptureAiChatCurrentSelectionImageOptions = {
  maxResolution?: number;
  antiTruncationMode?: AntiMode;
};

export type CaptureAiChatCurrentSelectionImageResult = {
  base64: string;
  selection: SelectionBounds;
  mimeType: "image/png";
  name: string;
};

export type RunBatchTasksOptions = {
  apiKey: string;
  apiBaseUrl: string;
  tasks: BatchTaskItem[];
};

export type BatchTaskGroupResult = {
  taskId: number;
  docId: number;
  docName: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
  errorMessages: string[];
};

export type RunBatchTasksResult = {
  taskGroupCount: number;
  totalCount: number;
  successCount: number;
  failureCount: number;
  taskResults: BatchTaskGroupResult[];
  errorMessages: string[];
};

export type QuotaInfo = {
  totalGranted: number;
  totalUsed: number;
  totalAvailable: number;
  availableUSD: number;
  count1K: number;
  count2K: number;
  count4K: number;
};

type PartitionSelection = SelectionBounds & {
  name: string;
};

type GlobalPartitionDocPlan = {
  docId: number;
  docName: string;
  width: number;
  height: number;
  selections: PartitionSelection[];
};

export type RunGlobalPartitionOptions = {
  prompt: string;
  apiKey: string;
  apiBaseUrl: string;
  providerProtocol?: ProviderRuntimeProtocol;
  size: ImageSize;
  batchSize: number;
  timeoutSeconds: number;
  antiTruncationMode: AntiMode;
  layerType: LayerType;
  maxResolution: number;
};

export type GlobalPartitionDocResult = {
  docId: number;
  docName: string;
  partitionCount: number;
  successCount: number;
  failureCount: number;
  errorMessages: string[];
};

export type RunGlobalPartitionResult = {
  documentCount: number;
  taskCount: number;
  successCount: number;
  failureCount: number;
  docResults: GlobalPartitionDocResult[];
  errorMessages: string[];
};

export const notify = async (message: string) => {
  await photoshop.app.showAlert(message);
};

export const getProjectInfo = async () => {
  const doc = photoshop.app.activeDocument;
  const info = {
    name: doc.name,
    path: doc.path,
    id: doc.id,
  };
  return info;
};

const toNumber = (value: any) => {
  if (typeof value === "number") return value;
  if (value && typeof value._value === "number") return value._value;
  if (value && typeof value.value === "number") return value.value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const normalizeApiBaseUrl = (apiBaseUrl: string) => apiBaseUrl.replace(/\/+$/, "");
const DEFAULT_PROVIDER_AJIAI_URL = "https://ai.ajiai.top";
const DEFAULT_PROVIDER_COMFLY_URL = "https://ai.comfly.chat";
const DEFAULT_PROVIDER_AJIAI_ID = "provider-default-ajiai";
const DEFAULT_PROVIDER_COMFLY_ID = "provider-default-comfly";

const inferProviderProtocolModeByBaseUrl = (baseUrl: string): ProviderProtocolMode => {
  const normalized = normalizeApiBaseUrl(String(baseUrl ?? "").trim()).toLowerCase();
  if (!normalized) return "gemini";
  if (normalized.includes("ai.ajiai.top")) return "both";
  if (normalized.includes("ai.comfly.chat")) return "openai";
  return "gemini";
};

const normalizeProviderProtocolMode = (
  value: unknown,
  baseUrl = "",
): ProviderProtocolMode => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "gemini" || normalized === "openai" || normalized === "both") {
    return normalized;
  }
  return inferProviderProtocolModeByBaseUrl(baseUrl);
};

const resolveProviderRuntimeProtocol = (
  protocolMode: ProviderProtocolMode | string | undefined,
): ProviderRuntimeProtocol =>
  String(protocolMode ?? "").trim().toLowerCase() === "openai" ? "openai" : "gemini";

const createDefaultProviderConfigItems = (fallbackKey = ""): ProviderConfigItem[] => {
  const normalizedKey = String(fallbackKey ?? "").trim();
  return [
    {
      id: DEFAULT_PROVIDER_AJIAI_ID,
      name: "AJIAI",
      baseUrl: DEFAULT_PROVIDER_AJIAI_URL,
      key: normalizedKey,
      protocolMode: "both",
    },
    {
      id: DEFAULT_PROVIDER_COMFLY_ID,
      name: "Comfly",
      baseUrl: DEFAULT_PROVIDER_COMFLY_URL,
      key: normalizedKey,
      protocolMode: "openai",
    },
  ];
};

const findPreferredSingleProviderConfigId = (items: ProviderConfigItem[]) =>
  items.find((item) => normalizeApiBaseUrl(item.baseUrl) === DEFAULT_PROVIDER_AJIAI_URL)?.id
  || items[0]?.id
  || "";

const findPreferredAiChatProviderConfigId = (items: ProviderConfigItem[]) =>
  items.find((item) => normalizeApiBaseUrl(item.baseUrl) === DEFAULT_PROVIDER_COMFLY_URL)?.id
  || items.find((item) => normalizeApiBaseUrl(item.baseUrl) === DEFAULT_PROVIDER_AJIAI_URL)?.id
  || items[0]?.id
  || "";

const PROMPT_CREATE_FOLDER_NAME = "prompt-create";
const PROMPT_CREATE_FILE_NAME = "prompt-create.json";
const PROMPT_LIBRARY_LIST_URL = "https://library.ai.pachouli.kiclover.com/public/list";
const PROMPT_LIBRARY_PAGE = 1;
const PROMPT_LIBRARY_PAGE_SIZE = 999;
const PROMPT_LIBRARY_TIMEOUT_SECONDS = 12;
const UI_BACKGROUND_DEFAULT_OPACITY = 72;
const UI_BACKGROUND_DEFAULT_PANEL_OPACITY = 82;
const UI_BACKGROUND_DEFAULT_BLUR = 0;
const PROMPT_HISTORY_MAX_ITEMS = 600;
const PROMPT_HISTORY_MAX_CONTENT_LENGTH = 1600;

type ProviderConfigsStore = {
  items: ProviderConfigItem[];
  selectedSingleProviderId: string;
  selectedAiChatProviderId: string;
};

type PromptCreateStoreFile = {
  version: number;
  updatedAt: string;
  skipRemoteSync: 0 | 1;
  librarySyncFlag: 0 | 1;
  librarySyncLastStatus: "idle" | "success" | "error";
  librarySyncLastMessage: string;
  librarySyncLastAt: string;
  apiKeys: Record<string, string>;
  aiChatApiKeys: Record<string, string>;
  uiThemePreset: string;
  uiBackgroundSettingsStored: 0 | 1;
  uiBackgroundSettings: UiBackgroundSettings;
  promptHistoryRecords: PromptHistoryRecordItem[];
  forgePresets: ForgePresetItem[];
  startupNoticeConfirmed: 0 | 1;
  customFeatureEnabled: 0 | 1;
  singleRunConfirmSkipDate: string;
  providerConfigs: ProviderConfigsStore;
  items: PromptCreateItem[];
};

type PromptCreateStoreEntry = {
  file: any;
  path: string;
};

type PromptLibraryApiResponse = {
  code?: number;
  msg?: string;
  data?: {
    total?: number;
    toatal?: number;
    list?: any[];
  };
  total?: number;
  toatal?: number;
  list?: any[];
};

const createEmptyPromptCreateStore = (): PromptCreateStoreFile => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  skipRemoteSync: 0,
  librarySyncFlag: 0,
  librarySyncLastStatus: "idle",
  librarySyncLastMessage: "",
  librarySyncLastAt: "",
  apiKeys: {},
  aiChatApiKeys: {},
  uiThemePreset: "",
  uiBackgroundSettingsStored: 0,
  uiBackgroundSettings: {
    imageDataUrl: "",
    opacity: UI_BACKGROUND_DEFAULT_OPACITY,
    panelOpacity: UI_BACKGROUND_DEFAULT_PANEL_OPACITY,
    blur: UI_BACKGROUND_DEFAULT_BLUR,
  },
  promptHistoryRecords: [],
  forgePresets: createDefaultForgePresets(),
  startupNoticeConfirmed: 0,
  customFeatureEnabled: 0,
  singleRunConfirmSkipDate: "",
  providerConfigs: {
    items: [],
    selectedSingleProviderId: "",
    selectedAiChatProviderId: "",
  },
  items: [],
});

let promptCreateStoreEntryCache: PromptCreateStoreEntry | null = null;
let promptCreateStoreEntryPromise: Promise<PromptCreateStoreEntry> | null = null;
let promptCreateStoreCache: PromptCreateStoreFile | null = null;
let promptCreateLibrarySyncPromise: Promise<void> | null = null;
const apiTraceLogFileCache = new Map<string, { file: any; path: string }>();
const apiTraceLogFilePromiseCache = new Map<string, Promise<{ file: any; path: string }>>();
let apiTraceLogWriteQueue: Promise<string> = Promise.resolve("");
let forgeAbortController: AbortController | null = null;

const normalizePromptCreateTags = (tags: string[] | string | undefined): string[] => {
  const source = Array.isArray(tags)
    ? tags
    : String(tags ?? "").split(/[,\n\uFF0C]/g);
  const clean = source
    .map((item) => String(item ?? "").trim())
    .filter((item) => item.length > 0);
  return Array.from(new Set(clean));
};

const sanitizePromptCreateItem = (item: any): PromptCreateItem | null => {
  const name = String(item?.name ?? "").trim();
  const content = String(item?.content ?? "").trim();
  if (!name || !content) return null;

  const type = Number(item?.type) === 2 ? 2 : 1;
  const description = String(item?.description ?? "").trim();
  const category = String(item?.category ?? "").trim();
  const tags = normalizePromptCreateTags(item?.tags);
  const favorite = Number(item?.favorite) === 1 ? 1 : 0;
  const createdAt = String(item?.createdAt ?? item?.updatedAt ?? "").trim() || new Date().toISOString();
  const updatedAt = String(item?.updatedAt ?? "").trim() || createdAt;

  return {
    type,
    favorite,
    name,
    content,
    description,
    category,
    tags,
    createdAt,
    updatedAt,
  };
};

const normalizeApiKeyName = (value: string) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  return trimmed.slice(0, 5);
};

const normalizeStoredApiKeyMap = (value: any): Record<string, string> => {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value);
  const result: Record<string, string> = {};
  for (const [rawName, rawVal] of entries) {
    const name = String(rawName ?? "").trim();
    const val = String(rawVal ?? "").trim();
    if (!name || !val) continue;
    result[name] = val;
  }
  return result;
};

const normalizeProviderConfigText = (value: any) => String(value ?? "").trim();

const normalizeProviderConfigItem = (value: any): ProviderConfigItem | null => {
  if (!value || typeof value !== "object") return null;
  const baseUrl = normalizeApiBaseUrl(normalizeProviderConfigText(value?.baseUrl));
  if (!baseUrl) return null;
  const id = normalizeProviderConfigText(value?.id);
  if (!id) return null;
  const name = normalizeProviderConfigText(value?.name) || "未命名服务商";
  const key = normalizeProviderConfigText(value?.key);
  const protocolMode = normalizeProviderProtocolMode(value?.protocolMode, baseUrl);
  return {
    id,
    name,
    baseUrl,
    key,
    protocolMode,
  };
};

const normalizeProviderConfigItems = (value: any): ProviderConfigItem[] => {
  if (!Array.isArray(value)) return [];
  const list: ProviderConfigItem[] = [];
  const idSet = new Set<string>();
  for (const item of value) {
    const normalized = normalizeProviderConfigItem(item);
    if (!normalized) continue;
    if (idSet.has(normalized.id)) continue;
    idSet.add(normalized.id);
    list.push(normalized);
  }
  return list.slice(0, 100);
};

const normalizeProviderConfigsStore = (value: any): ProviderConfigsStore => {
  const fallbackKey = normalizeProviderConfigText(value?.fallbackKey);
  const normalizedItems = normalizeProviderConfigItems(value?.items);
  const items = normalizedItems.length > 0 ? normalizedItems : createDefaultProviderConfigItems(fallbackKey);
  let selectedSingleProviderId = normalizeProviderConfigText(value?.selectedSingleProviderId);
  let selectedAiChatProviderId = normalizeProviderConfigText(value?.selectedAiChatProviderId);

  if (!items.some((item) => item.id === selectedSingleProviderId)) {
    selectedSingleProviderId = findPreferredSingleProviderConfigId(items);
  }
  if (!items.some((item) => item.id === selectedAiChatProviderId)) {
    selectedAiChatProviderId = findPreferredAiChatProviderConfigId(items);
  }

  return {
    items,
    selectedSingleProviderId,
    selectedAiChatProviderId,
  };
};

const normalizeSingleRunConfirmSkipDate = (value: any) => {
  const normalized = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
};

const normalizeUiBackgroundSettings = (value: any): UiBackgroundSettings => {
  const imageDataUrl = String(value?.imageDataUrl ?? "").trim();
  const parsedOpacity = Number(value?.opacity);
  const parsedPanelOpacity = Number(value?.panelOpacity);
  const parsedBlur = Number(value?.blur);
  const opacity = clamp(
    Number.isFinite(parsedOpacity) ? Math.round(parsedOpacity) : UI_BACKGROUND_DEFAULT_OPACITY,
    0,
    100,
  );
  const panelOpacity = clamp(
    Number.isFinite(parsedPanelOpacity) ? Math.round(parsedPanelOpacity) : UI_BACKGROUND_DEFAULT_PANEL_OPACITY,
    0,
    100,
  );
  const blur = clamp(
    Number.isFinite(parsedBlur) ? Math.round(parsedBlur) : UI_BACKGROUND_DEFAULT_BLUR,
    0,
    30,
  );
  return {
    imageDataUrl: imageDataUrl.startsWith("data:image/") ? imageDataUrl : "",
    opacity,
    panelOpacity,
    blur,
  };
};

const PROMPT_HISTORY_EVENT_TYPE_SET = new Set<PromptHistoryEventType>([
  "single-workbench",
  "ai-chat-prompt",
  "ai-chat-user-record",
  "ai-chat-assistant-record",
]);

const normalizePromptHistoryRecordItem = (
  value: any,
  fallbackId: number,
): PromptHistoryRecordItem | null => {
  const eventType = String(value?.eventType ?? "").trim() as PromptHistoryEventType;
  if (!PROMPT_HISTORY_EVENT_TYPE_SET.has(eventType)) return null;

  const content = String(value?.content ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, PROMPT_HISTORY_MAX_CONTENT_LENGTH);
  if (!content) return null;

  const createdAtRaw = Number(value?.createdAt);
  const idRaw = Number(value?.id);
  const createdAt = Number.isFinite(createdAtRaw) && createdAtRaw > 0 ? Math.floor(createdAtRaw) : Date.now();
  const id = Number.isFinite(idRaw) && idRaw > 0 ? Math.floor(idRaw) : fallbackId;

  return {
    id,
    eventType,
    content,
    createdAt,
  };
};

const normalizePromptHistoryRecords = (value: any): PromptHistoryRecordItem[] => {
  if (!Array.isArray(value)) return [];
  const list: PromptHistoryRecordItem[] = [];
  let fallbackId = 1;
  for (const item of value) {
    const normalized = normalizePromptHistoryRecordItem(item, fallbackId);
    if (!normalized) continue;
    fallbackId = Math.max(fallbackId + 1, normalized.id + 1);
    list.push(normalized);
  }
  list.sort((a, b) => b.createdAt - a.createdAt);
  return list.slice(0, PROMPT_HISTORY_MAX_ITEMS);
};

const DEFAULT_FORGE_PRESET_DATA: ForgePresetData = {
  mode: "img2img",
  prompt: "",
  negativePrompt: "",
  model: "",
  sampler: "",
  scheduler: "automatic",
  steps: 20,
  cfgScale: 7,
  denoise: 0.35,
  width: 768,
  height: 768,
  batchSize: 1,
  seed: -1,
  lora: "",
  loraWeight: 1,
  controlNetEnabled: false,
  controlNetModule: "none",
  controlNetModel: "None",
  controlNetWeight: 1,
  timeoutSeconds: 180,
  maxResolution: 1536,
};

const LEGACY_FACTORY_FORGE_PRESET_IDS = new Set([
  "factory-portrait-soft",
  "factory-anime-enhance",
  "factory-product-clean",
  "factory-bg-upscale",
  "factory-txt2img-concept",
]);

function createDefaultForgePresets(): ForgePresetItem[] {
  const baseTime = Date.now() - 24 * 60 * 60 * 1000;
  const build = (
    id: string,
    name: string,
    category: string,
    data: Partial<ForgePresetData>,
  ): ForgePresetItem => ({
    id,
    name,
    category,
    favorite: 0,
    createdAt: new Date(baseTime - 60_000 * defaultForgePresetSeed).toISOString(),
    updatedAt: new Date(baseTime - 60_000 * defaultForgePresetSeed).toISOString(),
    data: {
      ...DEFAULT_FORGE_PRESET_DATA,
      ...data,
    },
  });
  let defaultForgePresetSeed = 0;
  const next = (
    id: string,
    name: string,
    category: string,
    data: Partial<ForgePresetData>,
  ) => {
    const item = build(id, name, category, data);
    defaultForgePresetSeed += 1;
    return item;
  };

  return [
    next("ff_001", "基础修脸", "head", {
      model: "majicmixRealistic_v4.safetensors [f954946633]",
      sampler: "DPM++ 2M",
      prompt:
        "8k RAW, best quality, ultra high res, extreme_detail, sharp focus, (photorealistic:1.4), masterpiece, (ulzzang-6500:0.8),(masterpiece:1.2),best quality,high resolution,unity 8k wallpaper,(illustration:1),beautiful detailed eyes:,extremely detailed face,perfect lighting,photo_\\\\(medium\\\\),photorealistic,realistic, 1girl, solo,",
      negativePrompt:
        "paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, glans, anime, watermark, username, signature, text",
      denoise: 0.28,
      width: 768,
      height: 768,
      batchSize: 3,
      loraWeight: 0,
    }),
    next("ff_002", "磨皮", "head", {
      model: "xxmix9realistic_v40.safetensors [5f41c4861c]",
      sampler: "DPM++ 2M",
      prompt:
        "8k RAW, best quality, ultra high res, extreme_detail, sharp focus, (photorealistic:1.4), masterpiece, (ulzzang-6500:0.8),(masterpiece:1.2),smooth skin, blemish free skin, HD skin texture,",
      negativePrompt:
        "paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, glans, anime, watermark, username, signature, text",
      denoise: 0.33,
      width: 2048,
      height: 2048,
      batchSize: 3,
      loraWeight: 0,
      controlNetWeight: 1.1,
    }),
    next("ff_003", "下颌优化和生成", "head", {
      model: "xxmix9realistic_v40.safetensors [5f41c4861c]",
      sampler: "DPM++ 2M",
      prompt:
        "8k RAW, best quality, ultra high res, extreme_detail, sharp focus, (photorealistic:1.4), masterpiece, (ulzzang-6500:0.8),(masterpiece:1.2),best quality,high resolution,unity 8k wallpaper,(illustration:1),beautiful detailed eyes:,extremely detailed face,perfect lighting,photo_\\\\(medium\\\\),photorealistic,realistic, 1girl, solo,",
      negativePrompt:
        "paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, glans, anime, watermark, username, signature, text",
      denoise: 0.35,
      width: 768,
      height: 768,
      batchSize: 3,
      loraWeight: 0,
    }),
    next("ff_004", "有腮红平整修脸无锁边", "head", {
      model: "xxmix9realistic_v40.safetensors [5f41c4861c]",
      sampler: "DPM++ 2M",
      prompt:
        "8k RAW, best quality, ultra high res, extreme_detail, sharp focus, (photorealistic:1.4), masterpiece, (ulzzang-6500:0.8),(masterpiece:1.2),smooth skin, blemish free skin, HD skin texture,,yiyuyun,1girl,solo,portrait,realistic,close-up,black hair,bangs,brown hair,looking at viewer,",
      negativePrompt:
        "paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, glans, anime, watermark, username, signature, text",
      denoise: 0.3,
      width: 768,
      height: 768,
      batchSize: 3,
      lora: "yiyuyun-zhuangrong-000005",
      loraWeight: 0.8,
    }),
    next("ff_005", "有腮红平整修脸重锁边", "head", {
      model: "xxmix9realistic_v40.safetensors [5f41c4861c]",
      sampler: "DPM++ 2M",
      prompt:
        "8k RAW, best quality, ultra high res, extreme_detail, sharp focus, (photorealistic:1.4), masterpiece, (ulzzang-6500:0.8),(masterpiece:1.2),smooth skin, blemish free skin, HD skin texture,,yiyuyun,1girl,solo,portrait,realistic,close-up,black hair,bangs,brown hair,looking at viewer,",
      negativePrompt:
        "paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, glans, anime, watermark, username, signature, text",
      denoise: 0.34,
      width: 768,
      height: 768,
      batchSize: 3,
      lora: "yiyuyun-zhuangrong-000005",
      loraWeight: 0.8,
      controlNetEnabled: true,
      controlNetModule: "lineart_realistic",
      controlNetModel: "control_v11p_sd15_lineart [43d4be0d]",
      controlNetWeight: 1.1,
    }),
    next("ff_006", "中度修脸无锁边", "head", {
      model: "xxmix9realistic_v40.safetensors [5f41c4861c]",
      sampler: "DPM++ 2M",
      prompt:
        "8k RAW, best quality, ultra high res, extreme_detail, sharp focus, (photorealistic:1.4), masterpiece, (ulzzang-6500:0.8),(masterpiece:1.2),best quality,high resolution,unity 8k wallpaper,(illustration:1),beautiful detailed eyes:,extremely detailed face,perfect lighting,photo_\\\\(medium\\\\),photorealistic,realistic, 1girl, solo,",
      negativePrompt:
        "paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, glans, anime, watermark, username, signature, text",
      denoise: 0.3,
      width: 768,
      height: 768,
      batchSize: 3,
      loraWeight: 0,
    }),
    next("ff_007", "毛发材质优化", "hair", {
      model: "xxmix9realistic_v40.safetensors [5f41c4861c]",
      sampler: "DPM++ 2M",
      prompt:
        "8k RAW, best quality, ultra high res, extreme_detail, sharp focus, (photorealistic:1.4), masterpiece, (ulzzang-6500:0.8),(masterpiece:1.2),((HD hair texture, hair, dynamic hair, broken hair, flying hair,layered hair,visible strands,black hair))",
      negativePrompt:
        "paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, glans, anime, watermark, username, signature, text",
      denoise: 0.37,
      width: 768,
      height: 768,
      batchSize: 3,
      lora: "FAXING-SD1.5",
      loraWeight: 0.8,
      controlNetWeight: 1.1,
    }),
    next("ff_008", "毛发材质优化高精度有锁边", "hair", {
      model: "xxmix9realistic_v40.safetensors [5f41c4861c]",
      sampler: "DPM++ 2M",
      prompt:
        "8k RAW, best quality, ultra high res, extreme_detail, sharp focus, (photorealistic:1.4), masterpiece, (ulzzang-6500:0.8),(masterpiece:1.2),((HD hair texture, hair, dynamic hair, broken hair, flying hair,layered hair,visible strands,black hair))",
      negativePrompt:
        "paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, glans, anime, watermark, username, signature, text",
      denoise: 0.39,
      width: 1536,
      height: 1536,
      batchSize: 3,
      lora: "FAXING-SD1.5",
      loraWeight: 0.8,
      controlNetEnabled: true,
      controlNetModule: "lineart_realistic",
      controlNetModel: "control_v11p_sd15_lineart [43d4be0d]",
      controlNetWeight: 1.1,
    }),
    next("ff_009", "头发优化", "hair", {
      model: "majicmixRealistic_v4.safetensors [f954946633]",
      sampler: "DPM++ 2M",
      prompt:
        "8k RAW, best quality, ultra high res, extreme_detail, sharp focus, (photorealistic:1.4), masterpiece, (ulzzang-6500:0.8),(masterpiece:1.2),((HD hair texture, hair, dynamic hair, broken hair, flying hair))",
      negativePrompt:
        "paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, glans, anime, watermark, username, signature, text",
      denoise: 0.28,
      width: 2048,
      height: 2048,
      batchSize: 3,
      loraWeight: 0,
    }),
    next("ff_010", "南半球", "torso", {
      model: "xxmix9realistic_v40.safetensors [5f41c4861c]",
      sampler: "DPM++ 2M",
      prompt:
        "8k RAW,best quality, ultra high res, extreme_detail,soft focus, (photorealistic:1.4), masterpiece,((big tits, cleavage, big boobs)),(upshirt,underboob)",
      negativePrompt:
        "paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, glans, anime, watermark, username, signature, text",
      denoise: 0.4,
      width: 768,
      height: 768,
      batchSize: 3,
      lora: "辅助生成南半球，搭配 upshirt、underboob 两词启用，极大概率生成 NSFW 内容，慎用",
      loraWeight: 0.4,
    }),
    next("ff_011", "皮肤抹油", "torso", {
      model: "xxmix9realistic_v40.safetensors [5f41c4861c]",
      sampler: "DPM++ 2M",
      prompt:
        "8k RAW, best quality, ultra high res, extreme_detail, sharp focus, (photorealistic:1.4), masterpiece, (ulzzang-6500:0.8),(masterpiece:1.2),smooth skin, blemish free skin, HD skin texture,",
      negativePrompt:
        "paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, glans, anime, watermark, username, signature, text",
      denoise: 0.35,
      width: 768,
      height: 768,
      batchSize: 3,
      lora: "皮肤抹油,有概率出现NSFW内容,慎用",
      loraWeight: 0.6,
      controlNetEnabled: true,
      controlNetModule: "lineart_realistic",
      controlNetModel: "control_v11p_sd15_lineart [43d4be0d]",
      controlNetWeight: 0.7,
    }),
    next("ff_012", "腿部优化", "legs", {
      model: "xxmix9realistic_v40.safetensors [5f41c4861c]",
      sampler: "DPM++ 2M",
      prompt:
        "8k RAW,best quality, ultra high res, extreme_detail,soft focus, (photorealistic:1.4), masterpiece,((Slender legs, female legs, smooth skin, no muscle lines))",
      negativePrompt:
        "paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, glans, anime, watermark, username, signature, text",
      denoise: 0.35,
      width: 768,
      height: 768,
      batchSize: 3,
      loraWeight: 0.6,
      controlNetEnabled: true,
      controlNetModule: "lineart_realistic",
      controlNetModel: "control_v11p_sd15_lineart [43d4be0d]",
      controlNetWeight: 0.7,
    }),
    next("ff_013", "腿部优化（有黑丝）", "legs", {
      model: "xxmix9realistic_v40.safetensors [5f41c4861c]",
      sampler: "DPM++ 2M",
      prompt:
        "8k RAW,best quality, ultra high res, extreme_detail,soft focus, (photorealistic:1.4), masterpiece,((Slender legs, female legs, smooth skin, no muscle lines)), (Black stockings, female thighs)",
      negativePrompt:
        "paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, glans, anime, watermark, username, signature, text",
      denoise: 0.35,
      width: 768,
      height: 768,
      batchSize: 3,
      lora: "5D左右薄黑丝纹理优化，权重请开到1以上",
      loraWeight: 0.6,
      controlNetEnabled: true,
      controlNetModule: "lineart_realistic",
      controlNetModel: "control_v11p_sd15_lineart [43d4be0d]",
      controlNetWeight: 0.7,
    }),
    next("ff_014", "胸部增大（可能出现NSFW）", "torso", {
      model: "majicmixRealistic_v4.safetensors [f954946633]",
      sampler: "DPM++ 2M",
      prompt:
        "8k RAW,best quality, ultra high res, extreme_detail,soft focus, (photorealistic:1.4), masterpiece,((big tits, cleavage, big boobs))",
      negativePrompt:
        "paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, glans, anime, watermark, username, signature, text",
      denoise: 0.4,
      width: 2048,
      height: 2048,
      batchSize: 3,
      lora: "肉感,大胸,勒肉,请搭配液化使用",
      loraWeight: 0.4,
    }),
    next("ff_015", "无影棚刷漆", "background", {
      model: "leosamsHelloworldSDXL_helloworldSDXL32DPO.safetensors [22c686a9f4]",
      sampler: "DPM++ 2M",
      prompt:
        "8k RAW, best quality, ultra high res, extreme_detail, sharp focus, (photorealistic:1.4), masterpiece,,((Clean floor, white painted floor, white no studio, white studio, clean white wall))",
      negativePrompt:
        "paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, glans, anime, watermark, username, signature, text",
      denoise: 0.41,
      width: 2048,
      height: 2048,
      batchSize: 3,
      loraWeight: 0,
    }),
  ];
}

const CURRENT_FACTORY_FORGE_PRESET_IDS = new Set(
  createDefaultForgePresets().map((item) => item.id),
);

const mergeFactoryForgePresets = (items: ForgePresetItem[]) => {
  const existingById = new Map(
    items.map((item) => [String(item.id ?? "").trim(), item] as const).filter(([id]) => Boolean(id)),
  );
  const next: ForgePresetItem[] = [];

  for (const item of items) {
    const id = String(item.id ?? "").trim();
    if (!id) continue;
    if (LEGACY_FACTORY_FORGE_PRESET_IDS.has(id)) continue;
    if (CURRENT_FACTORY_FORGE_PRESET_IDS.has(id)) continue;
    next.push(item);
  }

  for (const factory of createDefaultForgePresets()) {
    const existing = existingById.get(factory.id);
    if (existing) {
      next.push({
        ...factory,
        name: String(existing.name ?? "").trim() || factory.name,
        category: String(existing.category ?? "").trim() || factory.category,
        favorite: Number(existing.favorite) === 1 ? 1 : 0,
        createdAt: String(existing.createdAt ?? "").trim() || factory.createdAt,
        updatedAt: String(existing.updatedAt ?? "").trim() || factory.updatedAt,
        data: normalizeForgePresetData(existing.data ?? factory.data),
      });
      continue;
    }
    next.push(factory);
  }

  return next;
};

const normalizeForgePresetData = (value: any): ForgePresetData => {
  const mode: ForgeGenerateMode = String(value?.mode ?? "").trim() === "txt2img" ? "txt2img" : "img2img";
  const steps = Math.round(clamp(Number(value?.steps) || 20, 1, 150));
  const cfgScale = clamp(Number(value?.cfgScale) || 7, 1, 30);
  const denoise = clamp(Number(value?.denoise) || 0.35, 0, 1);
  const width = Math.round(clamp(Number(value?.width) || 768, 64, 4096));
  const height = Math.round(clamp(Number(value?.height) || 768, 64, 4096));
  const batchSize = Math.round(clamp(Number(value?.batchSize) || 1, 1, 8));
  const seed = Math.floor(clamp(Number(value?.seed ?? -1), -1, 2147483647));
  const loraWeight = clamp(Number(value?.loraWeight) || 1, -3, 3);
  const controlNetWeight = clamp(Number(value?.controlNetWeight) || 1, 0, 2);
  const timeoutSeconds = Math.round(clamp(Number(value?.timeoutSeconds) || 180, 8, 600));
  const maxResolution = Math.round(clamp(Number(value?.maxResolution) || 1536, 512, 4096));

  return {
    mode,
    prompt: String(value?.prompt ?? "").trim().slice(0, 8000),
    negativePrompt: String(value?.negativePrompt ?? "").trim().slice(0, 8000),
    model: String(value?.model ?? "").trim().slice(0, 240),
    sampler: String(value?.sampler ?? "").trim().slice(0, 240),
    scheduler: String(value?.scheduler ?? "automatic").trim().slice(0, 80) || "automatic",
    steps,
    cfgScale,
    denoise,
    width,
    height,
    batchSize,
    seed,
    lora: String(value?.lora ?? "").trim().slice(0, 240),
    loraWeight,
    controlNetEnabled: Boolean(value?.controlNetEnabled),
    controlNetModule: String(value?.controlNetModule ?? "none").trim() || "none",
    controlNetModel: String(value?.controlNetModel ?? "None").trim() || "None",
    controlNetWeight,
    timeoutSeconds,
    maxResolution,
  };
};

const sanitizeForgePresetItem = (value: any): ForgePresetItem | null => {
  const name = String(value?.name ?? "").trim();
  if (!name) return null;
  const id = String(value?.id ?? "").trim() || `forge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = String(value?.createdAt ?? value?.updatedAt ?? "").trim() || new Date().toISOString();
  const updatedAt = String(value?.updatedAt ?? "").trim() || createdAt;
  const favorite = Number(value?.favorite) === 1 ? 1 : 0;
  const category = String(value?.category ?? "custom").trim() || "custom";
  return {
    id,
    name: name.slice(0, 80),
    category: category.slice(0, 40),
    favorite,
    createdAt,
    updatedAt,
    data: normalizeForgePresetData(value?.data),
  };
};

const normalizeForgePresets = (value: any): ForgePresetItem[] => {
  if (!Array.isArray(value)) {
    return createDefaultForgePresets();
  }
  const usedIds = new Set<string>();
  const list: ForgePresetItem[] = [];
  for (const item of value) {
    const normalized = sanitizeForgePresetItem(item);
    if (!normalized) continue;
    if (usedIds.has(normalized.id)) continue;
    usedIds.add(normalized.id);
    list.push(normalized);
  }
  const merged = mergeFactoryForgePresets(list);
  merged.sort((a, b) => {
    if (a.favorite !== b.favorite) return b.favorite - a.favorite;
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });
  return merged.slice(0, 300);
};

const sortForgePresetsInPlace = (items: ForgePresetItem[]) => {
  items.sort((a, b) => {
    if (a.favorite !== b.favorite) return b.favorite - a.favorite;
    const ta = Date.parse(String(a.updatedAt || a.createdAt || ""));
    const tb = Date.parse(String(b.updatedAt || b.createdAt || ""));
    if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return tb - ta;
    return String(a.name).localeCompare(String(b.name));
  });
};

const buildUniqueForgePresetName = (store: PromptCreateStoreFile, preferred: string, id?: string) => {
  const base = String(preferred ?? "").trim().slice(0, 80);
  if (!base) return "";
  const targetId = String(id ?? "").trim();
  const nameSet = new Set(
    (store.forgePresets || [])
      .filter((item) => String(item.id) !== targetId)
      .map((item) => String(item.name || "").trim().toLowerCase())
      .filter(Boolean),
  );
  if (!nameSet.has(base.toLowerCase())) return base;
  let index = 2;
  while (nameSet.has(`${base} ${index}`.toLowerCase())) {
    index += 1;
  }
  return `${base} ${index}`;
};

const buildUniqueForgePresetId = (existingIds: Set<string>, preferred?: string) => {
  const rawPreferred = String(preferred ?? "").trim();
  if (rawPreferred && !existingIds.has(rawPreferred)) {
    existingIds.add(rawPreferred);
    return rawPreferred;
  }
  let candidate = "";
  do {
    candidate = `forge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  } while (existingIds.has(candidate));
  existingIds.add(candidate);
  return candidate;
};

const unfoldForgePresetImportValue = (value: any) => {
  if (!value || typeof value !== "object") return value;
  const params = value?.params;
  if (params && typeof params === "object" && !Array.isArray(params)) {
    return {
      ...value,
      ...params,
      data: value?.data ?? params,
    };
  }
  return value;
};

const normalizeForgePresetImportSource = (value: any): any | null => {
  const source = unfoldForgePresetImportValue(value);
  if (!source || typeof source !== "object") return null;
  if (source.data && typeof source.data === "object") {
    return source;
  }

  const hasLegacyFields =
    source.positivePrompt !== undefined ||
    source.negativePrompt !== undefined ||
    source.step !== undefined ||
    source.redrawAmount !== undefined ||
    source.selectedName !== undefined;

  if (!hasLegacyFields) {
    return {
      ...source,
      data: source,
    };
  }

  const resolution = Number(source.resolution);
  const width = Number(source.width);
  const height = Number(source.height);
  const mappedData = {
    mode: String(source.mode ?? "").trim() === "txt2img" ? "txt2img" : "img2img",
    prompt: source.prompt ?? source.positivePrompt ?? "",
    negativePrompt: source.negativePrompt ?? "",
    model: source.model ?? "",
    sampler: source.sampler ?? source.selectedName ?? "",
    steps: source.steps ?? source.step,
    cfgScale: source.cfgScale ?? source.cfg ?? source.cfg_scale,
    denoise: source.denoise ?? source.redrawAmount ?? source.denoising_strength,
    width: Number.isFinite(width) && width > 0 ? width : resolution,
    height: Number.isFinite(height) && height > 0 ? height : resolution,
    batchSize: source.batchSize ?? source.imageCount,
    seed: source.seed,
    lora: source.lora,
    loraWeight: source.loraWeight,
    controlNetEnabled:
      source.controlNetEnabled ??
      (String(source.controlNetModel ?? "").trim().toLowerCase() !== "none" &&
        String(source.controlNetModel ?? "").trim() !== ""),
    controlNetModule: source.controlNetModule ?? source.selectedControlNetModule ?? "none",
    controlNetModel: source.controlNetModel ?? "None",
    controlNetWeight: source.controlNetWeight,
    timeoutSeconds: source.timeoutSeconds,
    maxResolution: source.maxResolution,
  };

  return {
    ...source,
    data: mappedData,
  };
};

const collectForgePresetImportCandidates = (parsed: any): any[] => {
  if (Array.isArray(parsed)) return parsed;
  if (!parsed || typeof parsed !== "object") return [];
  if (Array.isArray(parsed?.items)) return parsed.items;
  if (Array.isArray(parsed?.presets)) return parsed.presets;

  const directSingle =
    parsed?.name !== undefined ||
    parsed?.title !== undefined ||
    parsed?.prompt !== undefined ||
    parsed?.positivePrompt !== undefined ||
    parsed?.data !== undefined ||
    parsed?.params !== undefined;
  if (directSingle) return [parsed];

  const entries = Object.entries(parsed).filter(([, value]) => value && typeof value === "object");
  if (!entries.length) return [];
  return entries.map(([key, value]) => ({
    ...(value as Record<string, any>),
    name: String((value as any)?.name ?? key).trim(),
  }));
};

const normalizeForgePresetImportItem = (value: any, fallbackName: string): ForgePresetItem | null => {
  const source = normalizeForgePresetImportSource(value);
  if (!source) return null;

  const name = String(
    source?.name ??
      source?.title ??
      source?.presetName ??
      source?.label ??
      fallbackName,
  ).trim();
  if (!name) return null;

  const dataCandidate =
    source?.params && typeof source.params === "object"
      ? source.params
      : source?.data && typeof source.data === "object"
        ? source.data
        : source;
  const mappedDataSource = normalizeForgePresetImportSource(dataCandidate);
  const normalizedData =
    mappedDataSource?.data && typeof mappedDataSource.data === "object"
      ? mappedDataSource.data
      : dataCandidate;

  return sanitizeForgePresetItem({
    ...source,
    name,
    category: source?.category ?? source?.group ?? source?.type ?? "custom",
    data: normalizedData,
  });
};

const getManagedApiKeysFromStore = (store: PromptCreateStoreFile): ManagedApiKeyItem[] =>
  Object.entries(store.apiKeys ?? {})
    .map(([name, value]) => ({
      name: String(name ?? "").trim(),
      value: String(value ?? "").trim(),
    }))
    .filter((item) => item.name.length > 0 && item.value.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

const getAiChatApiKeysFromStore = (store: PromptCreateStoreFile): ManagedApiKeyItem[] =>
  Object.entries(store.aiChatApiKeys ?? {})
    .map(([name, value]) => ({
      name: String(name ?? "").trim(),
      value: String(value ?? "").trim(),
    }))
    .filter((item) => item.name.length > 0 && item.value.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

const buildUniqueApiKeyName = (
  store: PromptCreateStoreFile,
  value: string,
  preferredName?: string,
) => {
  const normalizedPreferred = String(preferredName ?? "").trim();
  if (
    normalizedPreferred &&
    !store.apiKeys[normalizedPreferred]
  ) {
    return normalizedPreferred;
  }
  const base = normalizeApiKeyName(value);
  if (!base) return "";
  if (!store.apiKeys[base]) return base;
  let index = 2;
  while (store.apiKeys[`${base}-${index}`]) {
    index += 1;
  }
  return `${base}-${index}`;
};

const buildUniqueAiChatApiKeyName = (
  store: PromptCreateStoreFile,
  value: string,
  preferredName?: string,
) => {
  const normalizedPreferred = String(preferredName ?? "").trim();
  if (
    normalizedPreferred &&
    !store.aiChatApiKeys[normalizedPreferred]
  ) {
    return normalizedPreferred;
  }
  const base = normalizeApiKeyName(value);
  if (!base) return "";
  if (!store.aiChatApiKeys[base]) return base;
  let index = 2;
  while (store.aiChatApiKeys[`${base}-${index}`]) {
    index += 1;
  }
  return `${base}-${index}`;
};

const findEntryByName = async (folder: any, name: string) => {
  const target = String(name ?? "").trim();
  if (!folder || !target) return null;

  try {
    const entry = await folder.getEntry(target);
    if (entry) return entry;
  } catch {
    // fallback to listing entries
  }

  if (typeof folder.getEntries !== "function") return null;
  try {
    const entries = await folder.getEntries();
    if (!Array.isArray(entries)) return null;
    const lowerTarget = target.toLowerCase();
    const matched = entries.find(
      (entry: any) => String(entry?.name ?? "").trim().toLowerCase() === lowerTarget,
    );
    return matched || null;
  } catch {
    return null;
  }
};

const padDatePart = (value: number) => String(value).padStart(2, "0");

const formatLocalLogDate = (date = new Date()) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;

const formatLocalLogTimestamp = (date = new Date()) =>
  `${formatLocalLogDate(date)} ${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}.${String(date.getMilliseconds()).padStart(3, "0")}`;

const createApiTraceId = () =>
  `api-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const maskSecretValue = (value: unknown) => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (text.length <= 8) return "*".repeat(text.length);
  return `${text.slice(0, 4)}***${text.slice(-4)}`;
};

const sanitizeUrlForLog = (value: unknown) =>
  String(value ?? "").replace(/([?&]key=)[^&]+/gi, "$1***");

const sanitizeStringForApiLog = (value: unknown) => {
  const text = String(value ?? "");
  if (!text) return "";
  if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(text)) {
    return `<data-url length=${text.length}>`;
  }
  if (/^[A-Za-z0-9+/=\r\n]+$/.test(text) && text.length > 512) {
    return `<base64 length=${text.length}>`;
  }
  if (text.length > 20000) {
    return `${text.slice(0, 12000)}\n...[truncated length=${text.length}]...`;
  }
  return text;
};

const sanitizeValueForApiLog = (value: any, depth = 0): any => {
  if (value == null) return value;
  if (depth >= 6) return "[MaxDepth]";
  if (typeof value === "string") return sanitizeStringForApiLog(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    const list = value.slice(0, 50).map((item) => sanitizeValueForApiLog(item, depth + 1));
    if (value.length > 50) {
      list.push(`[Truncated ${value.length - 50} more items]`);
    }
    return list;
  }
  if (typeof value !== "object") return String(value);

  const output: Record<string, any> = {};
  const entries = Object.entries(value).slice(0, 80);
  for (const [key, entryValue] of entries) {
    if (/authorization|api[_-]?key|token|secret/i.test(key)) {
      output[key] = maskSecretValue(entryValue);
      continue;
    }
    if (/url$/i.test(key) || key === "url") {
      output[key] = sanitizeUrlForLog(entryValue);
      continue;
    }
    output[key] = sanitizeValueForApiLog(entryValue, depth + 1);
  }
  if (Object.keys(value).length > entries.length) {
    output.__truncatedKeys = Object.keys(value).length - entries.length;
  }
  return output;
};

const getApiTraceLogFile = async (dateKey = formatLocalLogDate()) => {
  const cached = apiTraceLogFileCache.get(dateKey);
  if (cached) return cached;

  const pending = apiTraceLogFilePromiseCache.get(dateKey);
  if (pending) return pending;

  const promise = (async () => {
    const dataFolder = await fs.getDataFolder();
    let logFolder: any = await findEntryByName(dataFolder, API_TRACE_LOG_FOLDER_NAME);
    if (!logFolder) {
      try {
        logFolder = await dataFolder.createFolder(API_TRACE_LOG_FOLDER_NAME);
      } catch {
        logFolder = await findEntryByName(dataFolder, API_TRACE_LOG_FOLDER_NAME);
      }
    }
    if (!logFolder) {
      throw new Error(`Cannot access storage folder: ${API_TRACE_LOG_FOLDER_NAME}`);
    }

    const fileName = `${dateKey}.jsonl`;
    let file: any = await findEntryByName(logFolder, fileName);
    if (!file) {
      try {
        file = await logFolder.createFile(fileName);
      } catch {
        file = await findEntryByName(logFolder, fileName);
      }
    }
    if (!file) {
      throw new Error(`Cannot access storage file: ${fileName}`);
    }

    const path = String(file?.nativePath ?? `${String(logFolder?.nativePath ?? API_TRACE_LOG_FOLDER_NAME)}/${fileName}`);
    const entry = { file, path };
    apiTraceLogFileCache.set(dateKey, entry);
    return entry;
  })();

  apiTraceLogFilePromiseCache.set(dateKey, promise);
  try {
    return await promise;
  } finally {
    apiTraceLogFilePromiseCache.delete(dateKey);
  }
};

const appendApiTraceLog = async (
  level: ApiTraceLogLevel,
  stage: string,
  details: Record<string, any>,
) => {
  const writeLog = async () => {
    const now = new Date();
    const dateKey = formatLocalLogDate(now);
    const { file, path } = await getApiTraceLogFile(dateKey);
    const record = {
      timestamp: formatLocalLogTimestamp(now),
      level,
      stage,
      ...sanitizeValueForApiLog(details),
    };
    const line = `${JSON.stringify(record)}\n`;
    const existing = String((await file.read()) ?? "");
    await file.write(existing + line);
    return path;
  };

  apiTraceLogWriteQueue = apiTraceLogWriteQueue.then(writeLog, writeLog);
  return apiTraceLogWriteQueue;
};

const appendApiTraceLogSafe = async (
  level: ApiTraceLogLevel,
  stage: string,
  details: Record<string, any>,
) => {
  try {
    await appendApiTraceLog(level, stage, details);
  } catch (error) {
    console.warn("[api-trace-log] append failed", error);
  }
};

const getPromptCreateStoreFile = async () => {
  if (promptCreateStoreEntryCache) return promptCreateStoreEntryCache;
  if (promptCreateStoreEntryPromise) return promptCreateStoreEntryPromise;

  promptCreateStoreEntryPromise = (async () => {
    const dataFolder = await fs.getDataFolder();
    let promptFolder: any = await findEntryByName(dataFolder, PROMPT_CREATE_FOLDER_NAME);
    if (!promptFolder) {
      try {
        promptFolder = await dataFolder.createFolder(PROMPT_CREATE_FOLDER_NAME);
      } catch {
        promptFolder = await findEntryByName(dataFolder, PROMPT_CREATE_FOLDER_NAME);
      }
    }
    if (!promptFolder) {
      throw new Error(`Cannot access storage folder: ${PROMPT_CREATE_FOLDER_NAME}`);
    }

    let file: any = await findEntryByName(promptFolder, PROMPT_CREATE_FILE_NAME);
    let created = false;
    if (!file) {
      try {
        // Do not overwrite if file already exists.
        file = await promptFolder.createFile(PROMPT_CREATE_FILE_NAME);
        created = true;
      } catch {
        file = await findEntryByName(promptFolder, PROMPT_CREATE_FILE_NAME);
      }
    }
    if (!file) {
      throw new Error(`Cannot access storage file: ${PROMPT_CREATE_FILE_NAME}`);
    }
    if (created) {
      await file.write(JSON.stringify(createEmptyPromptCreateStore(), null, 2));
    }

    const folderPath = String(promptFolder?.nativePath ?? PROMPT_CREATE_FOLDER_NAME);
    const filePath = String(file?.nativePath ?? `${folderPath}/${PROMPT_CREATE_FILE_NAME}`);
    const entry = { file, path: filePath };
    promptCreateStoreEntryCache = entry;
    return entry;
  })();

  try {
    return await promptCreateStoreEntryPromise;
  } finally {
    promptCreateStoreEntryPromise = null;
  }
};

const readPromptCreateStore = async (options?: {
  bypassCache?: boolean;
}): Promise<{
  file: any;
  path: string;
  store: PromptCreateStoreFile;
}> => {
  const { file, path } = await getPromptCreateStoreFile();
  const bypassCache = Boolean(options?.bypassCache);
  if (!bypassCache && promptCreateStoreCache) {
    return { file, path, store: promptCreateStoreCache };
  }

  const rawText = String((await file.read()) ?? "").trim();
  const defaultStore = createEmptyPromptCreateStore();

  if (!rawText) {
    promptCreateStoreCache = defaultStore;
    return { file, path, store: promptCreateStoreCache };
  }

  try {
    const parsed = JSON.parse(rawText);
    const rawItems = Array.isArray(parsed) ? parsed : parsed?.items;
    const items = Array.isArray(rawItems)
      ? rawItems.map(sanitizePromptCreateItem).filter(Boolean) as PromptCreateItem[]
      : [];

    promptCreateStoreCache = {
      version: Number(parsed?.version) || 1,
      updatedAt: String(parsed?.updatedAt ?? "").trim() || new Date().toISOString(),
      skipRemoteSync: Number(parsed?.skipRemoteSync) === 1 ? 1 : 0,
      librarySyncFlag: Number(parsed?.librarySyncFlag) === 1 ? 1 : 0,
      librarySyncLastStatus:
        String(parsed?.librarySyncLastStatus ?? "").trim() === "success"
          ? "success"
          : String(parsed?.librarySyncLastStatus ?? "").trim() === "error"
            ? "error"
            : "idle",
      librarySyncLastMessage: String(parsed?.librarySyncLastMessage ?? "").trim(),
      librarySyncLastAt: String(parsed?.librarySyncLastAt ?? "").trim(),
      apiKeys: normalizeStoredApiKeyMap(parsed?.apiKeys),
      aiChatApiKeys: normalizeStoredApiKeyMap(parsed?.aiChatApiKeys),
      uiThemePreset: String(parsed?.uiThemePreset ?? "").trim(),
      uiBackgroundSettingsStored: Number(parsed?.uiBackgroundSettingsStored) === 1 ? 1 : 0,
      uiBackgroundSettings: normalizeUiBackgroundSettings(parsed?.uiBackgroundSettings),
      promptHistoryRecords: normalizePromptHistoryRecords(parsed?.promptHistoryRecords),
      forgePresets: normalizeForgePresets(parsed?.forgePresets),
      startupNoticeConfirmed: Number(parsed?.startupNoticeConfirmed) === 1 ? 1 : 0,
      customFeatureEnabled: Number(parsed?.customFeatureEnabled) === 1 ? 1 : 0,
      singleRunConfirmSkipDate: normalizeSingleRunConfirmSkipDate(parsed?.singleRunConfirmSkipDate),
      providerConfigs: normalizeProviderConfigsStore(parsed?.providerConfigs),
      items,
    };
    return {
      file,
      path,
      store: promptCreateStoreCache,
    };
  } catch {
    promptCreateStoreCache = defaultStore;
    return { file, path, store: promptCreateStoreCache };
  }
};

const fetchPromptLibraryItems = async (): Promise<PromptCreateItem[]> => {
  console.info("[prompt-library-sync] request start", {
    url: PROMPT_LIBRARY_LIST_URL,
    page: PROMPT_LIBRARY_PAGE,
    page_size: PROMPT_LIBRARY_PAGE_SIZE,
  });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROMPT_LIBRARY_TIMEOUT_SECONDS * 1000);

  let response: Response;
  try {
    response = await fetch(PROMPT_LIBRARY_LIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: PROMPT_LIBRARY_PAGE,
        page_size: PROMPT_LIBRARY_PAGE_SIZE,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error(`Prompt library request timeout (${PROMPT_LIBRARY_TIMEOUT_SECONDS}s)`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Prompt library request failed (HTTP ${response.status})`);
  }

  const json = (await response.json()) as PromptLibraryApiResponse;
  const code = Number(json?.code ?? -1);
  if (code !== 0) {
    throw new Error(String(json?.msg ?? `Prompt library API error code: ${code}`));
  }

  const data = json?.data ?? {};
  const rawList = Array.isArray(data?.list)
    ? data.list
    : Array.isArray(json?.list)
      ? json.list
      : [];

  const uniqueByName = new Set<string>();
  const mapped: PromptCreateItem[] = [];
  const nowIso = new Date().toISOString();
  for (const row of rawList) {
    const normalized = sanitizePromptCreateItem({
      type: 2,
      name: row?.name,
      content: row?.prompt ?? row?.content,
      description: row?.description,
      category: row?.category,
      tags: row?.tags,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    if (!normalized) continue;
    if (uniqueByName.has(normalized.name)) continue;
    uniqueByName.add(normalized.name);
    mapped.push({
      ...normalized,
      type: 2,
    });
  }

  console.info("[prompt-library-sync] request success", {
    remoteCount: rawList.length,
    validCount: mapped.length,
  });

  return mapped;
};

const mergePromptLibraryItems = (
  store: PromptCreateStoreFile,
  libraryItems: PromptCreateItem[],
) => {
  const localItems = store.items.filter((item) => item.type !== 2);
  const prevLibraryByName = new Map(
    store.items
      .filter((item) => item.type === 2)
      .map((item) => [item.name, item] as const),
  );

  const nextLibraryItems: PromptCreateItem[] = [];
  for (const item of libraryItems) {
    const prev = prevLibraryByName.get(item.name);
    nextLibraryItems.push({
      ...item,
      type: 2,
      favorite: prev?.favorite === 1 ? 1 : item.favorite === 1 ? 1 : 0,
      createdAt: prev?.createdAt || item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const nextItems = [...localItems, ...nextLibraryItems];
  if (JSON.stringify(nextItems) === JSON.stringify(store.items)) {
    return false;
  }

  store.items = nextItems;
  return true;
};

const writePromptCreateStore = async (file: any, store: PromptCreateStoreFile) => {
  try {
    store.updatedAt = new Date().toISOString();
    await file.write(JSON.stringify(store, null, 2));
    promptCreateStoreCache = store;
    return true;
  } catch (error) {
    console.warn("[prompt-library-sync] write failed:", error);
    return false;
  }
};

const ensurePromptLibrarySynced = async (
  file: any,
  store: PromptCreateStoreFile,
  options?: {
    forceSyncLibrary?: boolean;
    skipRemoteSync?: boolean;
    updateSkipRemoteSyncOnly?: boolean;
  },
) => {
  const forceSyncLibrary = Boolean(options?.forceSyncLibrary);
  const hasSkipRemoteSyncOption = typeof options?.skipRemoteSync === "boolean";
  const nextSkipRemoteSync = hasSkipRemoteSyncOption
    ? (options?.skipRemoteSync ? 1 : 0)
    : store.skipRemoteSync;
  let changed = false;
  if (store.skipRemoteSync !== nextSkipRemoteSync) {
    store.skipRemoteSync = nextSkipRemoteSync;
    changed = true;
  }
  const skipRemoteSync = store.skipRemoteSync === 1;
  if (options?.updateSkipRemoteSyncOnly) {
    if (changed) await writePromptCreateStore(file, store);
    return;
  }
  if (skipRemoteSync && !forceSyncLibrary) {
    const skipMessage = "skipRemoteSync=1, skipped remote sync";
    store.librarySyncLastStatus = "idle";
    store.librarySyncLastMessage = skipMessage;
    store.librarySyncLastAt = new Date().toISOString();
    changed = true;
    if (changed) await writePromptCreateStore(file, store);
    console.info("[prompt-library-sync]", skipMessage);
    return;
  }
  if (promptCreateLibrarySyncPromise) {
    if (changed) await writePromptCreateStore(file, store);
    await promptCreateLibrarySyncPromise;
    return;
  }

  promptCreateLibrarySyncPromise = (async () => {
    let syncChanged = changed;
    try {
      const libraryItems = await fetchPromptLibraryItems();
      syncChanged = mergePromptLibraryItems(store, libraryItems) || syncChanged;
      store.librarySyncFlag = 1;
      store.librarySyncLastStatus = "success";
      store.librarySyncLastMessage = `remote=${libraryItems.length}, mergedType2=${store.items.filter((item) => item.type === 2).length}, force=${forceSyncLibrary ? 1 : 0}`;
      store.librarySyncLastAt = new Date().toISOString();
      syncChanged = true;
      console.info("[prompt-library-sync] merge success", store.librarySyncLastMessage);
    } catch (error) {
      const message = (error as Error)?.message || String(error);
      store.librarySyncLastStatus = "error";
      store.librarySyncLastMessage = message;
      store.librarySyncLastAt = new Date().toISOString();
      syncChanged = true;
      console.warn("[prompt-library-sync] failed:", message);
    }
    if (syncChanged) {
      await writePromptCreateStore(file, store);
    }
  })();

  try {
    await promptCreateLibrarySyncPromise;
  } finally {
    promptCreateLibrarySyncPromise = null;
  }
};

const base64ToArrayBuffer = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 32768;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    let chunkBinary = "";
    for (let j = 0; j < chunk.length; j++) {
      chunkBinary += String.fromCharCode(chunk[j]);
    }
    binary += chunkBinary;
  }
  return btoa(binary);
};

const detectImageFileExtensionFromBase64 = (base64: string) => {
  try {
    const buffer = base64ToArrayBuffer(String(base64 ?? "").trim());
    const bytes = new Uint8Array(buffer);
    if (bytes.length >= 8) {
      const isPng =
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a;
      if (isPng) return "png";
    }
    if (bytes.length >= 3) {
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      if (isJpeg) return "jpg";
    }
    if (bytes.length >= 12) {
      const riff =
        bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
      const webp =
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
      if (riff && webp) return "webp";
    }
  } catch {
    // no-op
  }
  return "png";
};

const sanitizeExtractedUrl = (value: string) =>
  String(value ?? "")
    .trim()
    .replace(/[>)\]}.,]+$/g, "");

const extractImageUrlFromText = (text: string) => {
  const normalized = String(text ?? "").trim();
  if (!normalized) return "";

  const markdownMatches = Array.from(
    normalized.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/gi),
  );
  for (const match of markdownMatches) {
    const url = sanitizeExtractedUrl(match[1] || "");
    if (url) return url;
  }

  const downloadMatches = Array.from(
    normalized.matchAll(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/gi),
  );
  for (const match of downloadMatches) {
    const url = sanitizeExtractedUrl(match[1] || "");
    if (url && /\.(png|jpg|jpeg|webp)(?:[?#].*)?$/i.test(url)) return url;
  }

  const directMatches = Array.from(normalized.matchAll(/https?:\/\/[^\s)]+/gi));
  for (const match of directMatches) {
    const url = sanitizeExtractedUrl(match[0] || "");
    if (url && /\.(png|jpg|jpeg|webp)(?:[?#].*)?$/i.test(url)) return url;
  }

  return "";
};

const extractImageUrlFromOpenAiContent = (content: unknown): string => {
  if (typeof content === "string") {
    return extractImageUrlFromText(content);
  }
  if (!Array.isArray(content)) return "";

  for (const item of content) {
    if (typeof item === "string") {
      const url = extractImageUrlFromText(item);
      if (url) return url;
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, any>;
    if (typeof row.text === "string") {
      const url = extractImageUrlFromText(row.text);
      if (url) return url;
    }
    const inlineUrl = String(
      row.image_url?.url ??
      row.imageUrl?.url ??
      row.url ??
      "",
    ).trim();
    if (inlineUrl) return sanitizeExtractedUrl(inlineUrl);
  }

  return "";
};

const fetchImageUrlAsBase64 = async (
  imageUrl: string,
  timeoutSeconds: number,
  traceId = "",
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  try {
    await appendApiTraceLogSafe("info", "image_download_start", {
      traceId,
      imageUrl,
      timeoutSeconds,
    });
    const response = await fetch(imageUrl, {
      method: "GET",
      signal: controller.signal,
    });
    if (!response.ok) {
      await appendApiTraceLogSafe("error", "image_download_http_error", {
        traceId,
        imageUrl,
        status: response.status,
      });
      throw new Error(`图片下载失败（HTTP ${response.status}）`);
    }
    const buffer = await response.arrayBuffer();
    await appendApiTraceLogSafe("info", "image_download_success", {
      traceId,
      imageUrl,
      byteLength: Number(buffer?.byteLength) || 0,
    });
    return arrayBufferToBase64(buffer);
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      await appendApiTraceLogSafe("error", "image_download_timeout", {
        traceId,
        imageUrl,
        timeoutSeconds,
      });
      throw new Error(`图片下载超时（${timeoutSeconds}秒）`);
    }
    const message = String((error as Error)?.message ?? "").trim();
    if (
      message.includes("Manifest entry not found")
      || message.includes("Permission denied to the url")
    ) {
      let host = imageUrl;
      try {
        host = new URL(imageUrl).host || imageUrl;
      } catch {
        host = imageUrl;
      }
      throw new Error(
        `图片下载被 UXP 网络白名单拦截，当前域名未在 manifest 权限中声明：${host}`,
      );
    }
    await appendApiTraceLogSafe("error", "image_download_error", {
      traceId,
      imageUrl,
      errorMessage: message || "Unknown error",
    });
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const appendRawResponseToErrorMessage = (message: string, rawResponseText: string) => {
  const raw = String(rawResponseText ?? "");
  if (!raw) return message;
  return `${message}\n[接口响应原文]\n${raw}`;
};

const deselectAll = async () => {
  try {
    await photoshop.core.executeAsModal(async () => {
      await photoshop.app.activeDocument.selection.deselect();
    }, { commandName: "Deselect Selection" });
  } catch {
    // no-op
  }
};

const getCaptureTargetSize = (
  width: number,
  height: number,
  maxResolution: number,
): { width: number; height: number } | undefined => {
  if (width <= 0 || height <= 0) return undefined;
  if (width <= maxResolution && height <= maxResolution) return undefined;
  if (width >= height) {
    return {
      width: maxResolution,
      height: Math.max(1, Math.round(height * (maxResolution / width))),
    };
  }
  return {
    width: Math.max(1, Math.round(width * (maxResolution / height))),
    height: maxResolution,
  };
};

const hueToRgb = (p: number, q: number, t: number) => {
  let value = t;
  if (value < 0) value += 1;
  if (value > 1) value -= 1;
  if (value < 1 / 6) return p + (q - p) * 6 * value;
  if (value < 1 / 2) return q;
  if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
  return p;
};

const shiftHue180InPlace = (buffer: Uint8Array, components: number) => {
  if (components < 3) return;
  for (let i = 0; i + 2 < buffer.length; i += components) {
    const r = buffer[i] / 255;
    const g = buffer[i + 1] / 255;
    const b = buffer[i + 2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) {
        h = (g - b) / d + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / d + 2;
      } else {
        h = (r - g) / d + 4;
      }
      h /= 6;
    }

    h = (h + 0.5) % 1;

    let nr = l;
    let ng = l;
    let nb = l;
    if (s !== 0) {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      nr = hueToRgb(p, q, h + 1 / 3);
      ng = hueToRgb(p, q, h);
      nb = hueToRgb(p, q, h - 1 / 3);
    }

    buffer[i] = Math.min(255, Math.max(0, Math.round(nr * 255)));
    buffer[i + 1] = Math.min(255, Math.max(0, Math.round(ng * 255)));
    buffer[i + 2] = Math.min(255, Math.max(0, Math.round(nb * 255)));
  }
};

const flipVerticalInPlace = (
  buffer: Uint8Array,
  width: number,
  height: number,
  components: number,
) => {
  const rowSize = width * components;
  const tempRow = new Uint8Array(rowSize);
  for (let y = 0; y < Math.floor(height / 2); y++) {
    const topStart = y * rowSize;
    const bottomStart = (height - 1 - y) * rowSize;
    tempRow.set(buffer.subarray(topStart, topStart + rowSize));
    buffer.copyWithin(topStart, bottomStart, bottomStart + rowSize);
    buffer.set(tempRow, bottomStart);
  }
};

const applyAntiTruncationToImageData = async (
  imageData: any,
  antiMode: AntiMode,
) => {
  if (antiMode <= 0) return imageData;

  const width = Math.max(1, Math.round(toNumber(imageData.width)));
  const height = Math.max(1, Math.round(toNumber(imageData.height)));
  const components = Math.max(1, Math.round(toNumber(imageData.components)));
  const rawData = await imageData.getData({ chunky: true });
  const sourceBytes = rawData instanceof Uint8Array ? rawData : new Uint8Array(rawData as any);
  const nextBytes = new Uint8Array(sourceBytes);

  // Match previous anti-truncation order: hue shift first, then vertical flip.
  shiftHue180InPlace(nextBytes, components);
  if (antiMode === 2) {
    flipVerticalInPlace(nextBytes, width, height, components);
  }

  return photoshop.imaging.createImageDataFromBuffer(nextBytes, {
    width,
    height,
    components,
    chunky: true,
    colorSpace: String(imageData.colorSpace || "RGB"),
    colorProfile: String(imageData.colorProfile || ""),
  });
};

const applyAntiTruncationForOutput = async (antiMode: AntiMode) => {
  if (antiMode <= 0) return;

  if (antiMode === 2) {
    await photoshop.action.batchPlay(
      [
        {
          _obj: "flip",
          _target: [{ _ref: "document", _enum: "ordinal", _value: "first" }],
          axis: { _enum: "orientation", _value: "vertical" },
        },
      ],
      {},
    );
  }

  await photoshop.action.batchPlay(
    [
      {
        _obj: "hueSaturation",
        adjustment: [
          {
            _obj: "hueSatAdjustmentV2",
            hue: 180,
            saturation: 0,
            lightness: 0,
          },
        ],
        colorize: false,
      },
    ],
    {},
  );
};

export const reverseAntiTruncationEffect = async (options: {
  antiMode: AntiMode;
}): Promise<{ applied: boolean; antiMode: AntiMode }> => {
  const antiMode = ([1, 2].includes(Number(options?.antiMode))
    ? Number(options?.antiMode)
    : 0) as AntiMode;
  if (antiMode <= 0) {
    throw new Error("请先选择抗截断模式（普通或高强）");
  }

  await photoshop.core.executeAsModal(async () => {
    const doc = photoshop.app.activeDocument;
    if (!doc) {
      throw new Error("当前没有打开的 Photoshop 文档");
    }
    await applyAntiTruncationForOutput(antiMode);
  }, { commandName: "Reverse Anti Truncation" });

  return {
    applied: true,
    antiMode,
  };
};

const getSelectionAndImage = async (
  maxResolution: number,
  antiMode: AntiMode,
  predefinedSelection?: SelectionBounds,
): Promise<{ base64: string; selection: SelectionBounds } | null> => {
  const captureSelection = async (): Promise<{ base64: string; selection: SelectionBounds }> => {
    const originalDoc = photoshop.app.activeDocument;
    if (!originalDoc) {
      throw new Error("No active Photoshop document");
    }

    let selectionBounds: SelectionBounds;
    if (predefinedSelection) {
      const left = Math.round(toNumber(predefinedSelection.left));
      const top = Math.round(toNumber(predefinedSelection.top));
      const right = Math.round(toNumber(predefinedSelection.right));
      const bottom = Math.round(toNumber(predefinedSelection.bottom));
      selectionBounds = {
        left,
        top,
        right,
        bottom,
        width: Math.max(1, right - left),
        height: Math.max(1, bottom - top),
      };
    } else {
      try {
        const bounds: any = originalDoc.selection.bounds;
        const left = Math.round(toNumber(bounds.left));
        const top = Math.round(toNumber(bounds.top));
        const right = Math.round(toNumber(bounds.right));
        const bottom = Math.round(toNumber(bounds.bottom));
        selectionBounds = {
          left,
          top,
          right,
          bottom,
          width: right - left,
          height: bottom - top,
        };
      } catch {
        throw new Error("NO_SELECTION");
      }
    }

    const sourceBounds = {
      left: selectionBounds.left,
      top: selectionBounds.top,
      right: selectionBounds.right,
      bottom: selectionBounds.bottom,
    };
    const targetSize = getCaptureTargetSize(
      selectionBounds.width,
      selectionBounds.height,
      maxResolution,
    );

    let sourceImageData: any = null;
    let encodedImageData: any = null;
    try {
      const pixelResult = await photoshop.imaging.getPixels({
        documentID: originalDoc.id,
        sourceBounds,
        ...(targetSize ? { targetSize } : {}),
        componentSize: 8,
        colorSpace: "RGB",
        applyAlpha: true,
      });
      sourceImageData = pixelResult.imageData;
      encodedImageData = await applyAntiTruncationToImageData(sourceImageData, antiMode);

      const encoded = await photoshop.imaging.encodeImageData({
        imageData: encodedImageData,
        base64: true,
      });
      const base64 = typeof encoded === "string" ? encoded : "";
      if (!base64) {
        throw new Error("Failed to encode selection image");
      }

      return {
        base64,
        selection: selectionBounds,
      };
    } finally {
      if (encodedImageData && encodedImageData !== sourceImageData) {
        try {
          await encodedImageData.dispose();
        } catch {
          // no-op
        }
      }
      if (sourceImageData) {
        try {
          await sourceImageData.dispose();
        } catch {
          // no-op
        }
      }
    }
  };

  try {
    return await captureSelection();
  } catch (error) {
    if ((error as Error).message === "NO_SELECTION") {
      return null;
    }
    const message = String((error as Error)?.message || "").toLowerCase();
    const needsModal = message.includes("modal") || message.includes("executeasmodal");
    if (!needsModal) {
      throw error;
    }

    try {
      return await photoshop.core.executeAsModal(
        async () => captureSelection(),
        { commandName: "Capture Selection", interactive: false },
      );
    } catch (modalError) {
      if ((modalError as Error).message === "NO_SELECTION") {
        return null;
      }
      throw modalError;
    }
  }
};

const getHttpErrorMessage = (status: number) => {
  const messages: Record<number, string> = {
    401: "API Key invalid",
    403: "Access denied",
    404: "API endpoint not found",
    429: "Too many requests",
    500: "Server internal error",
    502: "Bad gateway",
    503: "Service unavailable",
  };
  return messages[status] || `API error (HTTP ${status})`;
};

const getHttpErrorSolution = (status: number) => {
  const solutions: Record<number, string> = {
    401: "Check whether API Key is correct or expired",
    403: "Check account permission and quota",
    404: "Check whether API base URL is correct",
    429: "Retry later",
    500: "Service exception, retry later",
    502: "Service exception, retry later",
    503: "Service exception, retry later",
  };
  return solutions[status] || "Retry later";
};

const inferModelFixedSize = (model: string): ImageSize | null => {
  const normalized = String(model ?? "").trim().toLowerCase();
  const matched = normalized.match(/(?:^|[-_])(1k|2k|4k)$/i);
  if (!matched) return null;
  const suffix = matched[1]?.toLowerCase();
  if (suffix === "1k") return "1K";
  if (suffix === "2k") return "2K";
  if (suffix === "4k") return "4K";
  return null;
};

const normalizeForgeUrl = (value: unknown) =>
  String(value ?? "").trim().replace(/\/+$/, "");

const clampForgeNumber = (value: unknown, min: number, max: number, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
};

const throwForgeHttpError = async (response: Response, endpoint: string) => {
  let detail = "";
  try {
    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("application/json")) {
      const payload: any = await response.json();
      detail =
        String(payload?.detail ?? "").trim() ||
        String(payload?.error ?? "").trim() ||
        String(payload?.message ?? "").trim();
    } else {
      detail = String(await response.text()).trim();
    }
  } catch {
    detail = "";
  }

  const baseMessage = `[Forge] ${endpoint} 请求失败（HTTP ${response.status}）`;
  if (detail) {
    throw new Error(`${baseMessage}: ${detail.slice(0, 300)}`);
  }
  throw new Error(baseMessage);
};

const tryGetActiveSelectionBounds = (): SelectionBounds | null => {
  const doc = photoshop.app.activeDocument;
  if (!doc) return null;
  try {
    const bounds: any = doc.selection.bounds;
    const left = Math.round(toNumber(bounds.left));
    const top = Math.round(toNumber(bounds.top));
    const right = Math.round(toNumber(bounds.right));
    const bottom = Math.round(toNumber(bounds.bottom));
    const width = Math.max(1, right - left);
    const height = Math.max(1, bottom - top);
    return {
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
    };
  } catch {
    return null;
  }
};

const callAiApi = async (
  apiKey: string,
  prompt: string,
  inputImageBase64: string,
  imageSize: ImageSize,
  timeoutSeconds: number,
  apiBaseUrl: string,
  providerProtocol: ProviderRuntimeProtocol,
  model: SingleModel = DEFAULT_MODEL_NAME,
) : Promise<AiApiCallResult> => {
  const traceId = createApiTraceId();
  const selectedModel = String(model ?? "").trim() || DEFAULT_MODEL_NAME;
  const modelName = selectedModel;
  const url =
    providerProtocol === "openai"
      ? `${apiBaseUrl}/v1/chat/completions`
      : `${apiBaseUrl}/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  console.log(`[request-url] ${url}`);

  const payload =
    providerProtocol === "openai"
      ? {
          model: modelName,
          stream: false,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/png;base64,${inputImageBase64}`,
                  },
                },
              ],
            },
          ],
        }
      : {
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/png", data: inputImageBase64 } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            maxOutputTokens: 8192,
            ...(imageSize !== "Auto" ? { imageConfig: { imageSize } } : {}),
          },
        };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

  try {
    await appendApiTraceLogSafe("info", "request_start", {
      traceId,
      protocol: providerProtocol,
      model: modelName,
      method: "POST",
      url,
      timeoutSeconds,
      requestHeaders:
        providerProtocol === "openai"
          ? {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            }
          : {
              "Content-Type": "application/json",
            },
      requestBody: payload,
      prompt,
      imageSize,
      inputImageBase64Length: inputImageBase64.length,
    });
    const response = await fetch(url, {
      method: "POST",
      headers:
        providerProtocol === "openai"
          ? {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            }
          : { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const rawResponseText = await response.text();
    await appendApiTraceLogSafe("info", "response_received", {
      traceId,
      protocol: providerProtocol,
      model: modelName,
      status: response.status,
      ok: response.ok,
      responseText: rawResponseText,
    });

    if (!response.ok) {
      const msg = getHttpErrorMessage(response.status);
      const solution = getHttpErrorSolution(response.status);
      throw new Error(appendRawResponseToErrorMessage(`${msg}. ${solution}`, rawResponseText));
    }

    let data: any;
    try {
      data = rawResponseText ? JSON.parse(rawResponseText) : null;
    } catch {
      throw new Error(appendRawResponseToErrorMessage("接口返回了非 JSON 响应", rawResponseText));
    }
    const responseLog = rawResponseText;
    const imagePart = data?.candidates?.[0]?.content?.parts?.find(
      (part: any) => part?.inlineData?.data,
    );
    if (imagePart?.inlineData?.data) {
      await appendApiTraceLogSafe("info", "response_inline_image_ready", {
        traceId,
        protocol: providerProtocol,
        model: modelName,
        imageBase64Length: String(imagePart.inlineData.data ?? "").length,
      });
      return {
        imageBase64: imagePart.inlineData.data as string,
        responseLog,
        traceId,
      };
    }

    const textPart = data?.candidates?.[0]?.content?.parts?.find(
      (part: any) => part?.text,
    );
    if (textPart) {
      throw new Error(
        appendRawResponseToErrorMessage(
          "仅收到文本响应，图像生成可能被拦截。建议开启抗截断或调整原图敏感区域后重试",
          rawResponseText,
        ),
      );
    }

    const openAiContent = data?.choices?.[0]?.message?.content;
    const imageUrl = extractImageUrlFromOpenAiContent(openAiContent);
    if (imageUrl) {
      await appendApiTraceLogSafe("info", "response_image_url_ready", {
        traceId,
        protocol: providerProtocol,
        model: modelName,
        imageUrl,
      });
      const imageBase64 = await fetchImageUrlAsBase64(imageUrl, timeoutSeconds, traceId);
      return {
        imageBase64,
        responseLog,
        traceId,
      };
    }

    if (typeof openAiContent === "string" && openAiContent.trim()) {
      throw new Error(
        appendRawResponseToErrorMessage("接口返回了文本响应，但未找到可下载的图片链接", rawResponseText),
      );
    }

    throw new Error(appendRawResponseToErrorMessage("API did not return image data", rawResponseText));
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      await appendApiTraceLogSafe("error", "request_timeout", {
        traceId,
        protocol: providerProtocol,
        model: modelName,
        timeoutSeconds,
      });
      throw new Error(`请求超时（${timeoutSeconds}秒）`);
    }

    const message = (error as Error).message || "";
    await appendApiTraceLogSafe("error", "request_error", {
      traceId,
      protocol: providerProtocol,
      model: modelName,
      errorMessage: message || "Unknown error",
    });
    if (message.includes("fetch") || message.includes("NetworkError")) {
      throw new Error("网络连接失败，请检查网络与 API 地址");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const placeImageToSpecificDoc = async (
  base64Str: string,
  targetDocId: number,
  targetSelection: SelectionBounds,
  antiMode: AntiMode,
  layerType: LayerType,
  traceId = "",
) => {
  await appendApiTraceLogSafe("info", "place_start", {
    traceId,
    targetDocId,
    targetSelection,
    antiMode,
    layerType,
    imageBase64Length: base64Str.length,
  });
  const tempFolder = await fs.getTemporaryFolder();
  const fileExt = detectImageFileExtensionFromBase64(base64Str);
  const tempFile = await tempFolder.createFile(`single_out_${Date.now()}.${fileExt}`, {
    overwrite: true,
  });

  const buffer = base64ToArrayBuffer(base64Str);
  await tempFile.write(buffer, { format: storage.formats.binary });
  await appendApiTraceLogSafe("info", "place_temp_file_ready", {
    traceId,
    targetDocId,
    fileExt,
    byteLength: Number(buffer?.byteLength) || 0,
    tempFilePath: String(tempFile?.nativePath ?? tempFile?.name ?? ""),
  });

  let createdLayerId: number | null = null;

  try {
    await photoshop.core.executeAsModal(async () => {
      await appendApiTraceLogSafe("info", "place_modal_enter", {
        traceId,
        targetDocId,
      });
      const targetDoc = photoshop.app.documents.find((doc: any) => doc.id === targetDocId);
      if (!targetDoc) throw new Error("Target document is closed");

      await photoshop.action.batchPlay(
        [
          {
            _obj: "select",
            _target: [{ _ref: "document", _id: targetDocId }],
          },
        ],
        {},
      );

      const tempDoc = await photoshop.app.open(tempFile);
      await appendApiTraceLogSafe("info", "place_temp_doc_opened", {
        traceId,
        targetDocId,
        tempDocId: Number(tempDoc?.id) || 0,
        tempDocName: String(tempDoc?.name ?? ""),
      });
      await tempDoc.resizeImage(targetSelection.width, targetSelection.height);
      await appendApiTraceLogSafe("info", "place_temp_doc_resized", {
        traceId,
        targetDocId,
        width: targetSelection.width,
        height: targetSelection.height,
      });

      await applyAntiTruncationForOutput(antiMode);
      await appendApiTraceLogSafe("info", "place_output_anti_applied", {
        traceId,
        targetDocId,
        antiMode,
      });

      await photoshop.action.batchPlay(
        [
          {
            _obj: "duplicate",
            _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
            to: { _ref: "document", _id: targetDocId },
            version: 5,
          },
        ],
        {},
      );
      await appendApiTraceLogSafe("info", "place_layer_duplicated", {
        traceId,
        targetDocId,
      });

      await tempDoc.closeWithoutSaving();
      await appendApiTraceLogSafe("info", "place_temp_doc_closed", {
        traceId,
        targetDocId,
      });

      await photoshop.action.batchPlay(
        [
          {
            _obj: "select",
            _target: [{ _ref: "document", _id: targetDocId }],
          },
        ],
        {},
      );

      await photoshop.action.batchPlay(
        [
          {
            _obj: "select",
            _target: [{ _ref: "layer", _enum: "ordinal", _value: "front" }],
            makeVisible: false,
          },
        ],
        {},
      );

      const boundsResult: any[] = await photoshop.action.batchPlay(
        [
          {
            _obj: "get",
            _target: [
              { _property: "bounds" },
              { _ref: "layer", _enum: "ordinal", _value: "targetEnum" },
            ],
          },
        ],
        {},
      );

      const bounds = boundsResult?.[0]?.bounds;
      const currentLeft = toNumber(bounds?.left);
      const currentTop = toNumber(bounds?.top);
      const deltaX = targetSelection.left - currentLeft;
      const deltaY = targetSelection.top - currentTop;
      await appendApiTraceLogSafe("info", "place_bounds_ready", {
        traceId,
        targetDocId,
        currentLeft,
        currentTop,
        deltaX,
        deltaY,
      });

      if (deltaX !== 0 || deltaY !== 0) {
        await photoshop.action.batchPlay(
          [
            {
              _obj: "move",
              _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
              to: {
                _obj: "offset",
                horizontal: { _unit: "pixelsUnit", _value: deltaX },
                vertical: { _unit: "pixelsUnit", _value: deltaY },
              },
            },
          ],
          {},
        );
        await appendApiTraceLogSafe("info", "place_layer_moved", {
          traceId,
          targetDocId,
          deltaX,
          deltaY,
        });
      }

      if (layerType === "smartObject") {
        await photoshop.action.batchPlay([{ _obj: "newPlacedLayer" }], {});
        await appendApiTraceLogSafe("info", "place_smart_object_converted", {
          traceId,
          targetDocId,
        });
      }

      const layer = photoshop.app.activeDocument.activeLayers?.[0];
      createdLayerId = layer?.id ?? null;
      await appendApiTraceLogSafe("info", "place_layer_resolved", {
        traceId,
        targetDocId,
        createdLayerId,
      });
    }, { commandName: "Place AI Result" });
  } catch (error) {
    await appendApiTraceLogSafe("error", "place_error", {
      traceId,
      targetDocId,
      errorMessage: (error as Error)?.message || "Unknown error",
    });
    throw error;
  }

  await appendApiTraceLogSafe("info", "place_complete", {
    traceId,
    targetDocId,
    createdLayerId,
  });

  return createdLayerId;
};

const createGroupAndMask = async (layerIds: number[], groupNamePrefix = "单图") => {
  if (layerIds.length === 0) return;

  const selectTargets = layerIds.map((id) => ({ _ref: "layer", _id: id }));

  await photoshop.action.batchPlay(
    [
      {
        _obj: "select",
        _target: selectTargets,
        selectionModifier: {
          _enum: "selectionModifierType",
          _value: "replaceSelection",
        },
        makeVisible: false,
      },
    ],
    {},
  );

  await photoshop.action.batchPlay(
    [
      {
        _obj: "make",
        _target: [{ _ref: "layerSection" }],
        from: { _ref: "layer", _enum: "ordinal", _value: "targetEnum" },
        name: `${groupNamePrefix} Generated Group`,
      },
    ],
    {},
  );

  await photoshop.action.batchPlay(
    [
      {
        _obj: "set",
        _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
        to: {
          _obj: "layer",
          color: { _enum: "color", _value: "yellowColor" },
        },
      },
    ],
    {},
  );

  await photoshop.action.batchPlay(
    [
      {
        _obj: "move",
        _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
        to: { _ref: "layer", _enum: "ordinal", _value: "front" },
      },
    ],
    {},
  );

  await photoshop.action.batchPlay(
    [
      {
        _obj: "make",
        new: { _class: "channel" },
        at: { _ref: "channel", _enum: "channel", _value: "mask" },
        using: { _enum: "userMaskEnabled", _value: "revealAll" },
      },
    ],
    {},
  );
};

const normalizeBatchTaskItem = (task: BatchTaskItem): BatchTaskItem => {
  const prompt = String(task.prompt ?? "").trim();
  if (!prompt) throw new Error("批处理任务提示词不能为空");

  const base64 = String(task.base64 ?? "").trim();
  if (!base64) throw new Error("Batch task missing input image");

  const docId = Math.floor(Number(task.docId));
  if (!Number.isFinite(docId) || docId <= 0) {
    throw new Error("Batch task document info invalid");
  }

  const left = Math.round(toNumber(task.selection?.left));
  const top = Math.round(toNumber(task.selection?.top));
  const fallbackWidth = Math.round(toNumber(task.selection?.right) - left);
  const fallbackHeight = Math.round(toNumber(task.selection?.bottom) - top);
  const width = Math.max(1, Math.round(toNumber(task.selection?.width) || fallbackWidth || 1));
  const height = Math.max(1, Math.round(toNumber(task.selection?.height) || fallbackHeight || 1));

  const settings = {
    providerProtocol: resolveProviderRuntimeProtocol(task.settings?.providerProtocol),
    size: (["Auto", "1K", "2K", "4K"].includes(String(task.settings?.size))
      ? task.settings.size
      : "Auto") as ImageSize,
    count: clamp(Math.floor(Number(task.settings?.count) || 1), 1, 5),
    timeoutSeconds: Math.max(5, Math.floor(Number(task.settings?.timeoutSeconds) || 60)),
    antiTruncationMode: ([0, 1, 2].includes(Number(task.settings?.antiTruncationMode))
      ? Number(task.settings.antiTruncationMode)
      : 0) as AntiMode,
    layerType:
      task.settings?.layerType === "smartObject" ? "smartObject" : "rasterized",
    maxResolution: clamp(Math.floor(Number(task.settings?.maxResolution) || 1536), 512, 4096),
  };

  return {
    id: Math.floor(Number(task.id) || Date.now()),
    docId,
    docName: String(task.docName ?? `Doc ${docId}`),
    prompt,
    base64,
    selection: {
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
    },
    settings,
  };
};

const delay = async (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const calculatePartitionSelections = (width: number, height: number): PartitionSelection[] => {
  if (width <= 0 || height <= 0) return [];

  if (width > height) {
    const size = height;
    return [
      {
        left: 0,
        top: 0,
        right: size,
        bottom: size,
        width: size,
        height: size,
        name: "左上",
      },
      {
        left: width - size,
        top: 0,
        right: width,
        bottom: size,
        width: size,
        height: size,
        name: "右上",
      },
    ];
  }

  if (height > width) {
    const size = width;
    return [
      {
        left: 0,
        top: 0,
        right: size,
        bottom: size,
        width: size,
        height: size,
        name: "左上",
      },
      {
        left: 0,
        top: height - size,
        right: size,
        bottom: height,
        width: size,
        height: size,
        name: "左下",
      },
    ];
  }

  return [
    {
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      name: "全图",
    },
  ];
};

const selectDocumentById = async (docId: number) => {
  await photoshop.core.executeAsModal(async () => {
    await photoshop.action.batchPlay(
      [
        {
          _obj: "select",
          _target: [{ _ref: "document", _id: docId }],
        },
      ],
      {},
    );
  }, { commandName: "Select Document" });
};

export const runGlobalPartition = async (
  options: RunGlobalPartitionOptions,
): Promise<RunGlobalPartitionResult> => {
  const prompt = options.prompt.trim();
  const apiKey = options.apiKey.trim();
  const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl.trim());
  const providerProtocol = resolveProviderRuntimeProtocol(options.providerProtocol);
  const size = (["Auto", "1K", "2K", "4K"].includes(String(options.size))
    ? options.size
    : "Auto") as ImageSize;
  const batchSize = clamp(Math.floor(Number(options.batchSize) || 1), 1, 5);
  const timeoutSeconds = Math.max(5, Math.floor(Number(options.timeoutSeconds) || 120));
  const antiMode = ([0, 1, 2].includes(Number(options.antiTruncationMode))
    ? Number(options.antiTruncationMode)
    : 0) as AntiMode;
  const layerType: LayerType =
    options.layerType === "smartObject" ? "smartObject" : "rasterized";
  const maxResolution = clamp(Math.floor(Number(options.maxResolution) || 1536), 512, 4096);

  if (!prompt) throw new Error("Global partition prompt cannot be empty");
  if (!apiKey) throw new Error("API Key 不能为空");
  if (!apiBaseUrl) throw new Error("API 地址不能为空");

  const docs = Array.from(photoshop.app.documents as any[]);
  if (docs.length === 0) {
    throw new Error("No open documents");
  }

  const docPlans: GlobalPartitionDocPlan[] = docs.map((doc: any) => {
    const width = Math.max(1, Math.round(toNumber(doc.width)));
    const height = Math.max(1, Math.round(toNumber(doc.height)));
    return {
      docId: doc.id,
      docName: String(doc.name ?? `文档 ${doc.id}`),
      width,
      height,
      selections: calculatePartitionSelections(width, height),
    };
  });

  const taskCount = docPlans.reduce(
    (total, plan) => total + plan.selections.length * batchSize,
    0,
  );

  const docResults: GlobalPartitionDocResult[] = [];
  const errorMessages: string[] = [];
  let successCount = 0;

  for (const plan of docPlans) {
    const docErrors: string[] = [];
    let docSuccessCount = 0;
    let docFailureCount = 0;

    try {
      await selectDocumentById(plan.docId);
    } catch (error) {
      const message = `切换文档失败: ${(error as Error).message || "未知错误"}`;
      docErrors.push(message);
      errorMessages.push(`[${plan.docName}] ${message}`);
      docFailureCount = plan.selections.length * batchSize;
      docResults.push({
        docId: plan.docId,
        docName: plan.docName,
        partitionCount: plan.selections.length,
        successCount: 0,
        failureCount: docFailureCount,
        errorMessages: docErrors,
      });
      continue;
    }

    const captures: Array<{ selection: PartitionSelection; base64: string }> = [];
    for (const selection of plan.selections) {
      try {
        const capture = await getSelectionAndImage(maxResolution, antiMode, selection);
        if (!capture) {
          const message = `分区 ${selection.name} 抓取失败`;
          docErrors.push(message);
          errorMessages.push(`[${plan.docName}] ${message}`);
          docFailureCount += batchSize;
          continue;
        }
        captures.push({ selection, base64: capture.base64 });
      } catch (error) {
        const message = `分区 ${selection.name} 抓取异常: ${(error as Error).message || "未知错误"}`;
        docErrors.push(message);
        errorMessages.push(`[${plan.docName}] ${message}`);
        docFailureCount += batchSize;
      }
      await delay(60);
    }

    for (const capture of captures) {
      const requestResults = await Promise.all(
        Array.from({ length: batchSize }, async (_, index) => {
          try {
            const data = await callAiApi(
              apiKey,
              prompt,
              capture.base64,
              size,
              timeoutSeconds,
              apiBaseUrl,
              providerProtocol,
            );
            return { index: index + 1, success: true as const, data };
          } catch (error) {
            return {
              index: index + 1,
              success: false as const,
              errorMessage: (error as Error).message || "生成失败",
            };
          }
        }),
      );

      const successRequests = requestResults
        .filter((item) => item.success)
        .sort((a, b) => a.index - b.index);

      requestResults
        .filter((item) => !item.success)
        .forEach((item) => {
          const message = `Partition ${capture.selection.name} item ${item.index} generation failed: ${item.errorMessage}`;
          docErrors.push(message);
          errorMessages.push(`[${plan.docName}] ${message}`);
        });

      const createdLayerIds: number[] = [];
      for (const item of successRequests) {
        try {
          const layerId = await placeImageToSpecificDoc(
              item.data.imageBase64,
              plan.docId,
              capture.selection,
              antiMode,
              layerType,
              item.data.traceId,
          );
          if (typeof layerId === "number") {
            createdLayerIds.push(layerId);
          } else {
            const message = `Partition ${capture.selection.name} item ${item.index} place failed`;
            docErrors.push(message);
            errorMessages.push(`[${plan.docName}] ${message}`);
          }
        } catch (error) {
          const message = `Partition ${capture.selection.name} item ${item.index} place exception: ${(error as Error).message || "Unknown error"}`;
          docErrors.push(message);
          errorMessages.push(`[${plan.docName}] ${message}`);
        }
      }

      if (createdLayerIds.length > 0) {
        try {
          await selectDocumentById(plan.docId);
          await createGroupAndMask(createdLayerIds, `分区-${capture.selection.name}`);
        } catch (error) {
          const message = `分区 ${capture.selection.name} 分组失败: ${(error as Error).message || "未知错误"}`;
          docErrors.push(message);
          errorMessages.push(`[${plan.docName}] ${message}`);
        }
      }

      docSuccessCount += createdLayerIds.length;
      docFailureCount += batchSize - createdLayerIds.length;
      await delay(120);
    }

    successCount += docSuccessCount;
    await deselectAll();

    docResults.push({
      docId: plan.docId,
      docName: plan.docName,
      partitionCount: plan.selections.length,
      successCount: docSuccessCount,
      failureCount: docFailureCount,
      errorMessages: docErrors,
    });
  }

  return {
    documentCount: docPlans.length,
    taskCount,
    successCount,
    failureCount: taskCount - successCount,
    docResults,
    errorMessages,
  };
};

export const captureBatchTask = async (
  options: CaptureBatchTaskOptions,
): Promise<BatchTaskItem> => {
  const prompt = options.prompt.trim();
  if (!prompt) throw new Error("Prompt cannot be empty");

  if (!photoshop.app.activeDocument) {
    throw new Error("当前没有打开的 Photoshop 文档");
  }

  const size = (["Auto", "1K", "2K", "4K"].includes(String(options.size))
    ? options.size
    : "Auto") as ImageSize;
  const providerProtocol = resolveProviderRuntimeProtocol(options.providerProtocol);
  const count = clamp(Math.floor(Number(options.count) || 1), 1, 5);
  const timeoutSeconds = Math.max(5, Math.floor(Number(options.timeoutSeconds) || 60));
  const antiTruncationMode = ([0, 1, 2].includes(Number(options.antiTruncationMode))
    ? Number(options.antiTruncationMode)
    : 0) as AntiMode;
  const layerType: LayerType =
    options.layerType === "smartObject" ? "smartObject" : "rasterized";
  const maxResolution = clamp(Math.floor(Number(options.maxResolution) || 1536), 512, 4096);

  const capture = await getSelectionAndImage(maxResolution, antiTruncationMode);
  if (!capture) {
    throw new Error("No selection found. Please create a selection first.");
  }

  const doc = photoshop.app.activeDocument;
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    docId: doc.id,
    docName: doc.name,
    prompt,
    base64: capture.base64,
    selection: capture.selection,
    settings: {
      providerProtocol,
      size,
      count,
      timeoutSeconds,
      antiTruncationMode,
      layerType,
      maxResolution,
    },
  };
};

export const captureAiChatCurrentSelectionImage = async (
  options?: CaptureAiChatCurrentSelectionImageOptions,
): Promise<CaptureAiChatCurrentSelectionImageResult> => {
  if (!photoshop.app.activeDocument) {
    throw new Error("No active Photoshop document");
  }

  const antiTruncationMode = ([0, 1, 2].includes(Number(options?.antiTruncationMode))
    ? Number(options?.antiTruncationMode)
    : 0) as AntiMode;
  const maxResolution = clamp(Math.floor(Number(options?.maxResolution) || 1536), 512, 4096);

  const capture = await getSelectionAndImage(maxResolution, antiTruncationMode);
  if (!capture) {
    throw new Error("No selection found. Please create a selection first.");
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return {
    base64: capture.base64,
    selection: capture.selection,
    mimeType: "image/png",
    name: `ps-selection-${timestamp}.png`,
  };
};

export const runBatchTasks = async (
  options: RunBatchTasksOptions,
): Promise<RunBatchTasksResult> => {
  const apiKey = options.apiKey.trim();
  const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl.trim());

  if (!apiKey) throw new Error("API Key 不能为空");
  if (!apiBaseUrl) throw new Error("API 地址不能为空");
  if (!Array.isArray(options.tasks) || options.tasks.length === 0) {
    throw new Error("Batch task list is empty");
  }

  const tasks = options.tasks.map(normalizeBatchTaskItem);
  const taskResults: BatchTaskGroupResult[] = [];
  const errorMessages: string[] = [];

  let totalCount = 0;
  let successCount = 0;

  for (const task of tasks) {
    const requestCount = task.settings.count;
    totalCount += requestCount;

    const requestTasks = Array.from({ length: requestCount }, async (_, index) => {
      try {
        const data = await callAiApi(
          apiKey,
          task.prompt,
          task.base64,
          task.settings.size,
          task.settings.timeoutSeconds,
          apiBaseUrl,
          resolveProviderRuntimeProtocol(task.settings.providerProtocol),
        );
        return { index: index + 1, success: true as const, data };
      } catch (error) {
        return {
          index: index + 1,
          success: false as const,
          errorMessage: (error as Error).message || "生成失败",
        };
      }
    });

    const requestResults = await Promise.all(requestTasks);
    const successfulResults = requestResults
      .filter((item) => item.success)
      .sort((a, b) => a.index - b.index);

    const groupErrors = requestResults
      .filter((item) => !item.success)
      .map((item) => `Item ${item.index} generation failed: ${item.errorMessage}`);

    const createdLayerIds: number[] = [];

    for (const result of successfulResults) {
      try {
        const layerId = await placeImageToSpecificDoc(
          result.data.imageBase64,
          task.docId,
          task.selection,
          task.settings.antiTruncationMode,
          task.settings.layerType,
          result.data.traceId,
        );

        if (typeof layerId === "number") {
          createdLayerIds.push(layerId);
        } else {
          groupErrors.push(`Item ${result.index} place failed`);
        }
      } catch (error) {
        groupErrors.push(
          `Item ${result.index} place failed: ${(error as Error).message || "Unknown error"}`,
        );
      }
    }

    if (createdLayerIds.length > 0) {
      try {
        await photoshop.core.executeAsModal(async () => {
          await photoshop.action.batchPlay(
            [
              {
                _obj: "select",
                _target: [{ _ref: "document", _id: task.docId }],
              },
            ],
            {},
          );
          await createGroupAndMask(createdLayerIds, "Batch");
        }, { commandName: "Group Batch AI Layers" });
      } catch (error) {
        groupErrors.push(`分组失败: ${(error as Error).message || "未知错误"}`);
      }
    }

    await deselectAll();

    const groupSuccessCount = createdLayerIds.length;
    const groupFailureCount = requestCount - groupSuccessCount;

    successCount += groupSuccessCount;

    const groupResult: BatchTaskGroupResult = {
      taskId: task.id,
      docId: task.docId,
      docName: task.docName,
      totalCount: requestCount,
      successCount: groupSuccessCount,
      failureCount: groupFailureCount,
      errorMessages: groupErrors,
    };
    taskResults.push(groupResult);

    if (groupErrors.length > 0) {
      errorMessages.push(...groupErrors.map((message) => `[${task.docName}] ${message}`));
    }
  }

  return {
    taskGroupCount: tasks.length,
    totalCount,
    successCount,
    failureCount: totalCount - successCount,
    taskResults,
    errorMessages,
  };
};

export const forgeTestConnection = async (params: {
  url: string;
  timeoutSeconds?: number;
}): Promise<{ connected: boolean; model: string }> => {
  const url = normalizeForgeUrl(params?.url);
  const timeoutSeconds = Math.max(3, Math.floor(Number(params?.timeoutSeconds) || 12));
  if (!url) throw new Error("[Forge] URL 不能为空");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  try {
    const response = await fetch(`${url}/sdapi/v1/options`, {
      method: "GET",
      signal: controller.signal,
    });
    if (!response.ok) {
      await throwForgeHttpError(response, "连接检测");
    }
    const payload: any = await response.json();
    const model = String(payload?.sd_model_checkpoint || payload?.sd_checkpoint_hash || "").trim();
    return {
      connected: true,
      model,
    };
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      throw new Error("[Forge] 连接超时，请确认 Forge 服务已启动");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const forgeFetchModels = async (params: {
  url: string;
  timeoutSeconds?: number;
}): Promise<{ items: string[] }> => {
  const url = normalizeForgeUrl(params?.url);
  const timeoutSeconds = Math.max(3, Math.floor(Number(params?.timeoutSeconds) || 12));
  if (!url) throw new Error("[Forge] URL 不能为空");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  try {
    const response = await fetch(`${url}/sdapi/v1/sd-models`, {
      method: "GET",
      signal: controller.signal,
    });
    if (!response.ok) {
      await throwForgeHttpError(response, "拉取模型列表");
    }
    const payload = (await response.json()) as any[];
    const items = (Array.isArray(payload) ? payload : [])
      .map((item) => String(item?.title || item?.model_name || item?.name || "").trim())
      .filter(Boolean);
    return { items };
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      throw new Error("[Forge] 拉取模型列表超时");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const forgeFetchSamplers = async (params: {
  url: string;
  timeoutSeconds?: number;
}): Promise<{ items: string[] }> => {
  const url = normalizeForgeUrl(params?.url);
  const timeoutSeconds = Math.max(3, Math.floor(Number(params?.timeoutSeconds) || 12));
  if (!url) throw new Error("[Forge] URL 不能为空");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  try {
    const response = await fetch(`${url}/sdapi/v1/samplers`, {
      method: "GET",
      signal: controller.signal,
    });
    if (!response.ok) {
      await throwForgeHttpError(response, "拉取采样器列表");
    }
    const payload = (await response.json()) as any[];
    const items = (Array.isArray(payload) ? payload : [])
      .map((item) => String(item?.name || "").trim())
      .filter(Boolean);
    return { items };
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      throw new Error("[Forge] 拉取采样器列表超时");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const forgeFetchControlNetModules = async (params: {
  url: string;
  timeoutSeconds?: number;
}): Promise<{ items: string[] }> => {
  const url = normalizeForgeUrl(params?.url);
  const timeoutSeconds = Math.max(3, Math.floor(Number(params?.timeoutSeconds) || 12));
  if (!url) throw new Error("[Forge] URL 不能为空");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  try {
    const response = await fetch(`${url}/controlnet/module_list`, {
      method: "GET",
      signal: controller.signal,
    });
    if (!response.ok) {
      await throwForgeHttpError(response, "拉取ControlNet预处理器");
    }
    const payload: any = await response.json();
    const items = (Array.isArray(payload?.module_list) ? payload.module_list : payload?.modules || [])
      .map((item: any) => String(item || "").trim())
      .filter(Boolean);
    return { items };
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      throw new Error("[Forge] 拉取ControlNet预处理器超时");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const forgeFetchControlNetModels = async (params: {
  url: string;
  timeoutSeconds?: number;
}): Promise<{ items: string[] }> => {
  const url = normalizeForgeUrl(params?.url);
  const timeoutSeconds = Math.max(3, Math.floor(Number(params?.timeoutSeconds) || 12));
  if (!url) throw new Error("[Forge] URL 不能为空");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  try {
    const response = await fetch(`${url}/controlnet/model_list`, {
      method: "GET",
      signal: controller.signal,
    });
    if (!response.ok) {
      await throwForgeHttpError(response, "拉取ControlNet模型");
    }
    const payload: any = await response.json();
    const items = (Array.isArray(payload?.model_list) ? payload.model_list : payload?.models || [])
      .map((item: any) => String(item || "").trim())
      .filter(Boolean);
    return { items };
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      throw new Error("[Forge] 拉取ControlNet模型超时");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const forgeFetchLoras = async (params: {
  url: string;
  timeoutSeconds?: number;
}): Promise<{ items: string[] }> => {
  const url = normalizeForgeUrl(params?.url);
  const timeoutSeconds = Math.max(3, Math.floor(Number(params?.timeoutSeconds) || 12));
  if (!url) throw new Error("[Forge] URL 不能为空");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  try {
    const response = await fetch(`${url}/sdapi/v1/loras`, {
      method: "GET",
      signal: controller.signal,
    });
    if (!response.ok) {
      await throwForgeHttpError(response, "拉取LoRA列表");
    }
    const payload = (await response.json()) as any[];
    const items = (Array.isArray(payload) ? payload : [])
      .map((item) => String(item?.name || item?.alias || "").trim())
      .filter(Boolean);
    return { items };
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      throw new Error("[Forge] 拉取LoRA列表超时");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const forgeGenerateImages = async (
  options: ForgeGenerateOptions,
): Promise<ForgeGenerateResult> => {
  const mode: ForgeGenerateMode = options?.mode === "txt2img" ? "txt2img" : "img2img";
  const url = normalizeForgeUrl(options?.url);
  const prompt = String(options?.prompt ?? "").trim();
  const negativePrompt = String(options?.negativePrompt ?? "").trim();
  const model = String(options?.model ?? "").trim();
  const sampler = String(options?.sampler ?? "").trim();
  const scheduler = String(options?.scheduler ?? "automatic").trim().toLowerCase();
  const lora = String(options?.lora ?? "").trim();
  const controlNetModule = String(options?.controlNetModule ?? "").trim();
  const controlNetModel = String(options?.controlNetModel ?? "").trim();

  if (!url) throw new Error("[Forge] URL 不能为空");
  if (!prompt) throw new Error("[Forge] 提示词不能为空");
  if (!photoshop.app.activeDocument) {
    throw new Error("当前没有打开的 Photoshop 文档");
  }

  const steps = Math.round(clampForgeNumber(options?.steps, 1, 150, 20));
  const cfgScale = clampForgeNumber(options?.cfgScale, 1, 30, 7);
  const denoise = clampForgeNumber(options?.denoise, 0, 1, 0.35);
  const batchSize = Math.round(clampForgeNumber(options?.batchSize, 1, 8, 1));
  const seed = Math.floor(clampForgeNumber(options?.seed, -1, 2147483647, -1));
  const loraWeight = clampForgeNumber(options?.loraWeight, -3, 3, 1);
  const cnWeight = clampForgeNumber(options?.controlNetWeight, 0, 2, 1);
  const timeoutSeconds = Math.max(8, Math.floor(Number(options?.timeoutSeconds) || 180));
  const antiMode = ([0, 1, 2].includes(Number(options?.antiTruncationMode))
    ? Number(options?.antiTruncationMode)
    : 0) as AntiMode;
  const layerType: LayerType =
    options?.layerType === "smartObject" ? "smartObject" : "rasterized";
  const maxResolution = clamp(Math.floor(Number(options?.maxResolution) || 1536), 512, 4096);

  let capture: { base64: string; selection: SelectionBounds } | null = null;
  const needsInputImage =
    mode === "img2img" ||
    (Boolean(options?.controlNetEnabled) &&
      controlNetModel &&
      controlNetModel.toLowerCase() !== "none");
  if (needsInputImage) {
    capture = await getSelectionAndImage(maxResolution, antiMode);
    if (!capture) {
      throw new Error("[Forge] 未检测到选区，img2img/ControlNet 需要先创建选区");
    }
  }

  const fallbackSelection = tryGetActiveSelectionBounds();
  const width = Math.round(
    clampForgeNumber(
      options?.width,
      64,
      4096,
      capture?.selection.width || fallbackSelection?.width || 768,
    ),
  );
  const height = Math.round(
    clampForgeNumber(
      options?.height,
      64,
      4096,
      capture?.selection.height || fallbackSelection?.height || 768,
    ),
  );
  const targetSelection: SelectionBounds =
    capture?.selection ||
    fallbackSelection || {
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
    };

  let effectivePrompt = prompt;
  if (lora) {
    effectivePrompt = `${effectivePrompt} <lora:${lora}:${loraWeight}>`;
  }

  const captureDataUrl = capture?.base64 ? `data:image/png;base64,${capture.base64}` : "";

  const payload: Record<string, any> = {
    prompt: effectivePrompt,
    negative_prompt: negativePrompt,
    steps,
    cfg_scale: cfgScale,
    width,
    height,
    sampler_name: sampler || undefined,
    scheduler: scheduler && scheduler !== "automatic" ? scheduler : undefined,
    batch_size: batchSize,
    n_iter: 1,
    seed,
  };
  if (mode === "img2img") {
    payload.denoising_strength = denoise;
    payload.init_images = [captureDataUrl];
  }
  if (model) {
    payload.override_settings = {
      sd_model_checkpoint: model,
    };
  }

  const controlNetEnabled =
    Boolean(options?.controlNetEnabled) &&
    controlNetModel &&
    controlNetModel.toLowerCase() !== "none";
  if (controlNetEnabled) {
    if (!capture?.base64) {
      throw new Error("[Forge] ControlNet 需要选区图像作为输入");
    }
    const cnUnit = {
      enabled: true,
      module: controlNetModule || undefined,
      model: controlNetModel || undefined,
      weight: cnWeight,
      input_image: captureDataUrl,
      guidance_start: 0,
      guidance_end: 1,
      pixel_perfect: true,
      control_mode: 0,
      resize_mode: 1,
    };
    payload.controlnet_units = [cnUnit];
    payload.alwayson_scripts = {
      ControlNet: {
        args: [cnUnit],
      },
    };
  }

  const controller = new AbortController();
  forgeAbortController = controller;
  const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  const endpoint = mode === "img2img" ? "/sdapi/v1/img2img" : "/sdapi/v1/txt2img";

  try {
    if (model) {
      try {
        await fetch(`${url}/sdapi/v1/options`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({sd_model_checkpoint: model}),
        });
      } catch {
        // Keep going; override_settings is still attached to the generation payload.
      }
    }

    const response = await fetch(`${url}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      await throwForgeHttpError(response, mode === "img2img" ? "img2img" : "txt2img");
    }

    const resultPayload: any = await response.json();
    const images = (Array.isArray(resultPayload?.images) ? resultPayload.images : [])
      .map((item: any) => String(item ?? "").trim())
      .filter(Boolean);
    if (images.length === 0) {
      throw new Error("[Forge] 返回中未包含图像数据");
    }

    const targetDocId = photoshop.app.activeDocument.id;
    const createdLayerIds: number[] = [];
    const errorMessages: string[] = [];

    for (let index = 0; index < images.length; index++) {
      try {
        const layerId = await placeImageToSpecificDoc(
          images[index],
          targetDocId,
          targetSelection,
          antiMode,
          layerType,
        );
        if (typeof layerId === "number") {
          createdLayerIds.push(layerId);
        } else {
          errorMessages.push(`Item ${index + 1} place failed`);
        }
      } catch (error) {
        errorMessages.push(
          `Item ${index + 1} place failed: ${(error as Error).message || "Unknown error"}`,
        );
      }
    }

    if (createdLayerIds.length > 0) {
      await photoshop.core.executeAsModal(async () => {
        await createGroupAndMask(createdLayerIds, "Forge");
      }, { commandName: "Group Forge Layers" });
    }

    await deselectAll();

    return {
      mode,
      successCount: createdLayerIds.length,
      failureCount: images.length - createdLayerIds.length,
      totalCount: images.length,
      errorMessages,
    };
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      throw new Error("[Forge] 任务已中断或超时");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (forgeAbortController === controller) {
      forgeAbortController = null;
    }
  }
};

export const forgeInterrupt = async (params?: {
  url?: string;
  timeoutSeconds?: number;
}): Promise<{ interrupted: boolean }> => {
  if (forgeAbortController) {
    try {
      forgeAbortController.abort();
    } catch {
      // no-op
    } finally {
      forgeAbortController = null;
    }
  }

  const url = normalizeForgeUrl(params?.url);
  if (url) {
    const timeoutSeconds = Math.max(2, Math.floor(Number(params?.timeoutSeconds) || 6));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
    try {
      await fetch(`${url}/sdapi/v1/interrupt`, {
        method: "POST",
        signal: controller.signal,
      });
    } catch {
      // interrupt endpoint failure should not block local abort result
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    interrupted: true,
  };
};

export const youdaoTranslate = async (
  options: YoudaoTranslateOptions,
): Promise<YoudaoTranslateResult> => {
  const text = String(options?.text ?? "").trim();
  const fromLang = String(options?.fromLang ?? "auto").trim() || "auto";
  const toLang = String(options?.toLang ?? "en").trim() || "en";
  if (!text) {
    return {success: false, error: "翻译文本不能为空"};
  }

  const YOUDAO_APP_KEY = "7ea7d96eb7996e2c";
  const YOUDAO_APP_SECRET = "hDyzOzNc8UpLmnAKBtQlABTFg2tscYNG";
  const YOUDAO_API_URL = "https://openapi.youdao.com/api";

  const truncate = (value: string) => {
    const length = value.length;
    if (length <= 20) return value;
    return `${value.slice(0, 10)}${length}${value.slice(length - 10)}`;
  };

  const sha256 = (value: string) => {
    const utf8Encode = (input: string) => {
      const bytes: number[] = [];
      for (let index = 0; index < input.length; index += 1) {
        const code = input.charCodeAt(index);
        if (code < 0x80) {
          bytes.push(code);
        } else if (code < 0x800) {
          bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
        } else if (code >= 0xd800 && code <= 0xdbff) {
          const hi = code;
          const lo = input.charCodeAt(++index);
          const cp = ((hi - 0xd800) << 10) + (lo - 0xdc00) + 0x10000;
          bytes.push(
            0xf0 | (cp >> 18),
            0x80 | ((cp >> 12) & 0x3f),
            0x80 | ((cp >> 6) & 0x3f),
            0x80 | (cp & 0x3f),
          );
        } else {
          bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
        }
      }
      return bytes;
    };

    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    const rr = (input: number, count: number) => ((input >>> count) | (input << (32 - count))) >>> 0;
    const msg = utf8Encode(value);
    const bitLen = msg.length * 8;
    msg.push(0x80);
    while (msg.length % 64 !== 56) msg.push(0);
    for (let bit = 56; bit >= 0; bit -= 8) msg.push((bitLen / Math.pow(2, bit)) & 0xff);
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    for (let offset = 0; offset < msg.length; offset += 64) {
      const W = new Array<number>(64);
      for (let index = 0; index < 16; index += 1) {
        W[index] = (msg[offset + index * 4] << 24)
          | (msg[offset + index * 4 + 1] << 16)
          | (msg[offset + index * 4 + 2] << 8)
          | msg[offset + index * 4 + 3];
      }
      for (let index = 16; index < 64; index += 1) {
        const s0 = rr(W[index - 15], 7) ^ rr(W[index - 15], 18) ^ (W[index - 15] >>> 3);
        const s1 = rr(W[index - 2], 17) ^ rr(W[index - 2], 19) ^ (W[index - 2] >>> 10);
        W[index] = (W[index - 16] + s0 + W[index - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let index = 0; index < 64; index += 1) {
        const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + K[index] + W[index]) >>> 0;
        const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) >>> 0;
        h = g;
        g = f;
        f = e;
        e = (d + temp1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0;
      H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0;
      H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0;
      H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0;
      H[7] = (H[7] + h) >>> 0;
    }
    return H.map((item) => `00000000${item.toString(16)}`.slice(-8)).join("");
  };

  try {
    const salt = `${Math.round(Math.random() * 1e10)}`;
    const curtime = `${Math.round(Date.now() / 1000)}`;
    const sign = sha256(`${YOUDAO_APP_KEY}${truncate(text)}${salt}${curtime}${YOUDAO_APP_SECRET}`);
    const body = `q=${encodeURIComponent(text)}`
      + `&from=${encodeURIComponent(fromLang)}`
      + `&to=${encodeURIComponent(toLang)}`
      + `&appKey=${encodeURIComponent(YOUDAO_APP_KEY)}`
      + `&salt=${encodeURIComponent(salt)}`
      + `&sign=${encodeURIComponent(sign)}`
      + "&signType=v3"
      + `&curtime=${encodeURIComponent(curtime)}`;
    const response = await fetch(YOUDAO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });
    const result = await response.json();
    if (String(result?.errorCode ?? "") === "0") {
      return {success: true, text: String(result?.translation?.[0] ?? "")};
    }
    return {
      success: false,
      error: `有道翻译错误 (${String(result?.errorCode ?? "unknown")})`,
    };
  } catch (error) {
    return {
      success: false,
      error: `网络请求失败: ${(error as Error)?.message || error}`,
    };
  }
};

export const cloudLogin = async (
  options: CloudLoginOptions,
): Promise<CloudLoginResult> =>
  forgeCloudService.performLogin(
    String(options?.email ?? "").trim(),
    String(options?.password ?? ""),
    Boolean(options?.remember),
  );

export const cloudLogout = async (options?: { email?: string }): Promise<CloudLoginResult> => {
  const setting = await forgeCloudService.getRememberedSetting();
  await forgeCloudService.performLogout(String(options?.email ?? "").trim());
  return {
    success: true,
    setting,
  };
};

export const cloudRestoreSession = async (): Promise<CloudLoginResult> =>
  forgeCloudService.tryRestoreSession();

export const cloudGetUserPoints = async (): Promise<CloudPointsResult> => {
  try {
    const res = await forgeCloudService.apiGetUserPoints();
    const points = Number(
      res?.data?.points
      ?? res?.data?.point
      ?? res?.points
      ?? res?.point
      ?? 0,
    ) || 0;
    const success = Boolean(
      Number(res?.errno) === 0
      || Number(res?.code) === 0
      || Number(res?.code) === 200
      || String(res?.status ?? "").trim().toLowerCase() === "success",
    );
    return {
      success,
      points,
      data: res,
      message: success ? undefined : String(res?.message || res?.info || "获取积分失败"),
    };
  } catch (error) {
    return {
      success: false,
      points: 0,
      message: (error as Error)?.message || String(error),
    };
  }
};

export const cloudGetForgeUrl = async (): Promise<CloudForgeUrlResult> =>
  forgeCloudService.apiGetExposedPublicUrl();

export const cloudTestForgeConnection = async (params: {
  encrypted: string;
}): Promise<CloudForgeTestResult> =>
  forgeCloudService.testCloudForgeConnection(String(params?.encrypted ?? ""));

export const cloudForgeGenerateImages = async (
  options: CloudForgeGenerateOptions,
): Promise<CloudForgeGenerateResult> => {
  const encrypted = String(options?.encrypted ?? "").trim();
  const url = forgeCloudService.decryptUrl(encrypted).replace(/\/+$/, "");
  if (!url) {
    throw new Error("无效的云Forge地址");
  }

  const mode: ForgeGenerateMode = options?.mode === "txt2img" ? "txt2img" : "img2img";
  const width = Math.max(0, Math.floor(Number(options?.width) || 0));
  const height = Math.max(0, Math.floor(Number(options?.height) || 0));
  const maxEdge = Math.max(width, height, 512);
  const modelName = String(options?.model ?? "unknown").trim() || "unknown";

  const consumeRes = await forgeCloudService.apiConsumePoints({
    model: modelName,
    resolution: maxEdge,
  });
  if (!(Number(consumeRes?.code) === 0 || Number(consumeRes?.errno) === 0) || !consumeRes?.data) {
    throw new Error(String(consumeRes?.message || consumeRes?.msg || consumeRes?.info || "积分扣除失败"));
  }

  const result = await forgeGenerateImages({
    ...options,
    url,
    mode,
  });

  return {
    ...result,
    cloudConsumed: Number(consumeRes?.data?.consumed ?? 0) || 0,
    cloudBalance: Number(consumeRes?.data?.points ?? 0) || 0,
  };
};

export const stampVisibleLayer = async (): Promise<{ stamped: boolean }> => {
  const doc = photoshop.app.activeDocument;
  if (!doc) {
    throw new Error("当前没有打开的 Photoshop 文档");
  }

  await appendApiTraceLogSafe("info", "stamp_visible_start", {
    docId: Number(doc?.id) || 0,
    docName: String(doc?.name ?? ""),
  });

  await photoshop.core.executeAsModal(
    async () => {
      await photoshop.action.batchPlay(
        [
          {
            _obj: "mergeVisible",
            duplicate: true,
          },
        ],
        {},
      );
    },
    { commandName: "Stamp Visible Layer" },
  );

  await appendApiTraceLogSafe("info", "stamp_visible_complete", {
    docId: Number(doc?.id) || 0,
    docName: String(doc?.name ?? ""),
  });

  return {
    stamped: true,
  };
};

export const runSingleImage = async (
  options: RunSingleImageOptions,
): Promise<RunSingleImageResult> => {
  const prompt = options.prompt.trim();
  const apiKey = options.apiKey.trim();
  const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl.trim());
  const model = String(options.model ?? "").trim() || DEFAULT_MODEL_NAME;
  const providerProtocol = resolveProviderRuntimeProtocol(options.providerProtocol);
  const inputSize = (["Auto", "1K", "2K", "4K"].includes(String(options.size))
    ? options.size
    : "Auto") as ImageSize;
  const modelFixedSize = inferModelFixedSize(model);
  const size =
    model === GEMINI_FLASH_IMAGE_MODEL
      ? "1K"
      : modelFixedSize || inputSize;
  const batchSize = clamp(Math.floor(options.batchSize || 1), 1, 5);
  const timeoutSeconds = Math.max(5, Math.floor(options.timeoutSeconds || 60));
  const antiMode = options.antiTruncationMode ?? 0;
  const layerType: LayerType =
    options.layerType === "smartObject" ? "smartObject" : "rasterized";
  const maxResolution = clamp(Math.floor(options.maxResolution || 1536), 512, 4096);

  if (!prompt) throw new Error("Prompt cannot be empty");
  if (!apiKey) throw new Error("API Key 不能为空");
  if (!apiBaseUrl) throw new Error("API 地址不能为空");

  if (!photoshop.app.activeDocument) {
    throw new Error("当前没有打开的 Photoshop 文档");
  }

  await appendApiTraceLogSafe("info", "single_run_start", {
    mode: "single",
    model,
    providerProtocol,
    apiBaseUrl,
    batchSize,
    timeoutSeconds,
    antiMode,
    layerType,
    maxResolution,
    prompt,
  });
  const capture = await getSelectionAndImage(maxResolution, antiMode);
  if (!capture) {
    throw new Error("未检测到选区，请先创建选区后再执行");
  }
  await appendApiTraceLogSafe("info", "single_capture_ready", {
    mode: "single",
    selection: capture.selection,
    base64Length: capture.base64.length,
  });

  const requestTasks = Array.from({ length: batchSize }, async (_, index) => {
    try {
      const data = await callAiApi(
        apiKey,
        prompt,
        capture.base64,
        size,
        timeoutSeconds,
        apiBaseUrl,
        providerProtocol,
        model,
      );
      return { index: index + 1, success: true as const, data };
    } catch (error) {
      return {
        index: index + 1,
        success: false as const,
        errorMessage: (error as Error).message || "生成失败",
      };
    }
  });

  const requestResults = await Promise.all(requestTasks);
  const successfulResults = requestResults
    .filter((item) => item.success)
    .sort((a, b) => a.index - b.index);

  if (successfulResults.length === 0) {
    const firstError = requestResults.find((item) => !item.success);
    throw new Error(firstError?.errorMessage || "所有生成任务均失败");
  }

  const createdLayerIds: number[] = [];
  const errorMessages = requestResults
    .filter((item) => !item.success)
    .map((item) => `Item ${item.index} failed: ${item.errorMessage}`);
  const responseLogs = successfulResults.map(
    (item) => `Item ${item.index} response:\n${item.data.responseLog}`,
  );

  const targetDocId = photoshop.app.activeDocument.id;
  for (const result of successfulResults) {
    try {
      const layerId = await placeImageToSpecificDoc(
        result.data.imageBase64,
        targetDocId,
        capture.selection,
        antiMode,
        layerType,
        result.data.traceId,
      );
      if (typeof layerId === "number") {
        createdLayerIds.push(layerId);
      } else {
        errorMessages.push(`Item ${result.index} place failed`);
      }
    } catch (error) {
      errorMessages.push(
        `Item ${result.index} place failed: ${(error as Error).message || "Unknown error"}`,
      );
    }
  }

  if (createdLayerIds.length > 0) {
    await appendApiTraceLogSafe("info", "single_group_start", {
      mode: "single",
      targetDocId,
      layerCount: createdLayerIds.length,
    });
    await photoshop.core.executeAsModal(async () => {
      await createGroupAndMask(createdLayerIds, "单图");
    }, { commandName: "Group AI Layers" });
    await appendApiTraceLogSafe("info", "single_group_complete", {
      mode: "single",
      targetDocId,
      layerCount: createdLayerIds.length,
    });
  }

  await deselectAll();
  await appendApiTraceLogSafe("info", "single_run_complete", {
    mode: "single",
    targetDocId,
    successCount: createdLayerIds.length,
    failureCount: batchSize - createdLayerIds.length,
    totalCount: batchSize,
    errorMessages,
  });

  return {
    // Avoid transferring large base64 blobs over the webview bridge in packaged mode.
    // This improves stability of host<->webview messaging.
    previewBase64: "",
    successCount: createdLayerIds.length,
    failureCount: batchSize - createdLayerIds.length,
    totalCount: batchSize,
    errorMessages,
    responseLogs,
  };
};

export const undoLastAction = async (): Promise<{ undone: boolean; historyStateName: string }> => {
  let historyStateName = "";
  await photoshop.core.executeAsModal(async () => {
    const doc = photoshop.app.activeDocument;
    if (!doc) {
      throw new Error("当前没有打开的 Photoshop 文档");
    }

    const historyStates = doc.historyStates;
    if (!historyStates || historyStates.length <= 1) {
      throw new Error("没有可撤销的历史动作");
    }

    const activeState = doc.activeHistoryState;
    const currentIndex = historyStates.findIndex((item: any) => Number(item?.id) === Number(activeState?.id));
    const targetIndex = currentIndex > 0 ? currentIndex - 1 : historyStates.length - 2;
    const targetState = historyStates[targetIndex];
    if (!targetState) {
      throw new Error("没有可撤销的历史动作");
    }

    historyStateName = String(targetState.name || "");
    doc.activeHistoryState = targetState;
  }, { commandName: "Undo Last Action" });

  return {
    undone: true,
    historyStateName,
  };
};

export const getAiQuota = async (params: {
  apiKey: string;
  apiBaseUrl: string;
  timeoutSeconds?: number;
}): Promise<QuotaInfo> => {
  const apiKey = params.apiKey.trim();
  const apiBaseUrl = normalizeApiBaseUrl(params.apiBaseUrl.trim());
  const timeoutSeconds = Math.max(5, Math.floor(params.timeoutSeconds ?? 20));

  if (!apiKey) throw new Error("API Key 不能为空");
  if (!apiBaseUrl) throw new Error("API 地址不能为空");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

  let response: Response;
  try {
    const url = `${apiBaseUrl}/api/usage/token`;
    console.log(`[request-url] ${url}`);
    response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error(`额度查询超时（${timeoutSeconds}秒）`);
    }

    const message = (error as Error).message || "";
    if (message.includes("fetch") || message.includes("NetworkError")) {
      throw new Error("Network connection failed, please check API URL and network access");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(
      `${getHttpErrorMessage(response.status)}. ${getHttpErrorSolution(response.status)}`,
    );
  }

  let json: any;
  try {
    json = await response.json();
  } catch {
    throw new Error("额度接口返回非 JSON 数据");
  }
  const info = json?.data;
  if (!info) throw new Error("额度接口返回格式异常");

  const totalGranted = Number(info.total_granted ?? 0);
  const totalUsed = Number(info.total_used ?? 0);
  const totalAvailable = Number(info.total_available ?? 0);
  const availableUSD = totalAvailable / POINTS_PER_USD;

  return {
    totalGranted,
    totalUsed,
    totalAvailable,
    availableUSD,
    count1K: Math.floor(availableUSD / PRICE_1K),
    count2K: Math.floor(availableUSD / PRICE_2K),
    count4K: Math.floor(availableUSD / PRICE_4K),
  };
};

export const exportPromptPresets = async (presets: PromptPreset[]) => {
  const file = await fs.getFileForSaving("presets.json", { types: ["json"] });
  if (!file) return false;

  await file.write(JSON.stringify(presets, null, 2));
  return true;
};

export const importPromptPresets = async (): Promise<PromptPreset[] | null> => {
  const fileEntry = await fs.getFileForOpening({ types: ["json"] });
  if (!fileEntry) return null;

  const file = Array.isArray(fileEntry) ? fileEntry[0] : fileEntry;
  const text = await file.read();
  const parsed = JSON.parse(String(text));
  if (!Array.isArray(parsed)) {
    throw new Error("预设文件格式错误");
  }

  const presets = parsed
    .map((item: any) => ({
      title: String(item?.title ?? "").trim(),
      content: String(item?.content ?? "").trim(),
    }))
    .filter((item: PromptPreset) => item.title && item.content);

  return presets;
};

export const initPromptCreateStorage = async (options?: {
  forceSyncLibrary?: boolean;
  skipRemoteSync?: boolean;
  updateSkipRemoteSyncOnly?: boolean;
}): Promise<PromptCreateStorageInfo> => {
  const { file, path, store } = await readPromptCreateStore();
  await ensurePromptLibrarySynced(file, store, options);
  return {
    path,
    total: store.items.length,
    skipRemoteSync: store.skipRemoteSync,
    librarySyncFlag: store.librarySyncFlag,
    librarySyncLastStatus: store.librarySyncLastStatus,
    librarySyncLastMessage: store.librarySyncLastMessage,
    librarySyncLastAt: store.librarySyncLastAt,
  };
};

export const getPromptCreateStorageInfo = async (options?: {
  forceSyncLibrary?: boolean;
  skipRemoteSync?: boolean;
  updateSkipRemoteSyncOnly?: boolean;
}): Promise<PromptCreateStorageInfo> =>
  initPromptCreateStorage(options);

export const listPromptCreateItems = async (options?: {
  forceReloadDisk?: boolean;
  clearCacheFirst?: boolean;
}): Promise<PromptCreateListResult> => {
  if (options?.clearCacheFirst) {
    promptCreateStoreCache = null;
  }
  const { path, store } = await readPromptCreateStore({
    bypassCache: Boolean(options?.forceReloadDisk),
  });
  const items = [...store.items].sort((a, b) => {
    const fa = a.favorite === 1 ? 1 : 0;
    const fb = b.favorite === 1 ? 1 : 0;
    if (fa !== fb) return fb - fa;
    const ta = Date.parse(a.updatedAt || a.createdAt || "");
    const tb = Date.parse(b.updatedAt || b.createdAt || "");
    if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return tb - ta;
    return String(a.name).localeCompare(String(b.name));
  });

  return {
    path,
    total: items.length,
    items,
  };
};

export const savePromptCreateItem = async (
  input: SavePromptCreateInput,
): Promise<SavePromptCreateResult> => {
  const name = String(input?.name ?? "").trim();
  const content = String(input?.content ?? "").trim();
  const description = String(input?.description ?? "").trim();
  const category = String(input?.category ?? "").trim();
  const tags = normalizePromptCreateTags(input?.tags);

  if (!name) {
    throw new Error("Prompt name cannot be empty");
  }
  if (!content) {
    throw new Error("Prompt content cannot be empty");
  }

  const { file, path, store } = await readPromptCreateStore();
  const nowIso = new Date().toISOString();

  const existingIndex = store.items.findIndex((item) => item.name === name);
  let savedItem: PromptCreateItem;

  if (existingIndex >= 0) {
    const prev = store.items[existingIndex];
    savedItem = {
      ...prev,
      type: 1,
      favorite: prev.favorite === 1 ? 1 : 0,
      name,
      content,
      description,
      category,
      tags,
      updatedAt: nowIso,
    };
    store.items.splice(existingIndex, 1, savedItem);
  } else {
    savedItem = {
      type: 1,
      favorite: 0,
      name,
      content,
      description,
      category,
      tags,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.items.push(savedItem);
  }

  store.updatedAt = nowIso;
  await file.write(JSON.stringify(store, null, 2));
  promptCreateStoreCache = store;

  return {
    path,
    total: store.items.length,
    item: savedItem,
  };
};

export const deletePromptCreateItem = async (
  nameInput: string,
): Promise<DeletePromptCreateResult> => {
  const name = String(nameInput ?? "").trim();
  if (!name) {
    throw new Error("Prompt name cannot be empty");
  }

  const { file, path, store } = await readPromptCreateStore();
  const existingIndex = store.items.findIndex((item) => item.type === 1 && item.name === name);
  if (existingIndex < 0) {
    return {
      path,
      total: store.items.length,
      deleted: false,
      name,
    };
  }

  store.items.splice(existingIndex, 1);
  store.updatedAt = new Date().toISOString();
  await file.write(JSON.stringify(store, null, 2));
  promptCreateStoreCache = store;

  return {
    path,
    total: store.items.length,
    deleted: true,
    name,
  };
};

export const togglePromptCreateFavorite = async (
  nameInput: string,
): Promise<TogglePromptCreateFavoriteResult> => {
  const name = String(nameInput ?? "").trim();
  if (!name) {
    throw new Error("Prompt name cannot be empty");
  }

  const { file, path, store } = await readPromptCreateStore();
  const index = store.items.findIndex((item) => item.name === name);
  if (index < 0) {
    throw new Error("Prompt not found");
  }

  const prev = store.items[index];
  const next: PromptCreateItem = {
    ...prev,
    favorite: prev.favorite === 1 ? 0 : 1,
    updatedAt: new Date().toISOString(),
  };
  store.items.splice(index, 1, next);
  await writePromptCreateStore(file, store);

  return {
    path,
    total: store.items.length,
    item: next,
  };
};

export const listForgePresets = async (): Promise<ListForgePresetsResult> => {
  const { path, store } = await readPromptCreateStore();
  const items = normalizeForgePresets(store.forgePresets);
  store.forgePresets = items;
  return {
    path,
    total: items.length,
    items,
  };
};

export const saveForgePreset = async (
  input: SaveForgePresetInput,
): Promise<SaveForgePresetResult> => {
  const name = String(input?.name ?? "").trim();
  if (!name) {
    throw new Error("Forge 预设名称不能为空");
  }
  const category = String(input?.category ?? "custom").trim() || "custom";
  const { file, path, store } = await readPromptCreateStore();

  const now = new Date().toISOString();
  const normalizedData = normalizeForgePresetData(input?.data);
  const targetId = String(input?.id ?? "").trim();
  const favorite = Number(input?.favorite) === 1 || input?.favorite === true ? 1 : 0;

  const existingIndex = targetId
    ? store.forgePresets.findIndex((item) => item.id === targetId)
    : -1;

  let nextItem: ForgePresetItem;
  let created = false;
  if (existingIndex >= 0) {
    const prev = store.forgePresets[existingIndex];
    const nextName = buildUniqueForgePresetName(store, name, prev.id) || prev.name;
    nextItem = {
      ...prev,
      name: nextName,
      category: category.slice(0, 40),
      favorite: favorite === 1 ? 1 : prev.favorite === 1 ? 1 : 0,
      updatedAt: now,
      data: normalizedData,
    };
    store.forgePresets.splice(existingIndex, 1, nextItem);
  } else {
    const nextName = buildUniqueForgePresetName(store, name) || name.slice(0, 80);
    nextItem = {
      id: `forge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: nextName,
      category: category.slice(0, 40),
      favorite,
      createdAt: now,
      updatedAt: now,
      data: normalizedData,
    };
    store.forgePresets.push(nextItem);
    created = true;
  }

  sortForgePresetsInPlace(store.forgePresets);
  await writePromptCreateStore(file, store);

  return {
    path,
    total: store.forgePresets.length,
    item: nextItem,
    created,
  };
};

export const deleteForgePreset = async (
  idInput: string,
): Promise<DeleteForgePresetResult> => {
  const id = String(idInput ?? "").trim();
  if (!id) {
    throw new Error("Forge 预设ID不能为空");
  }
  const { file, path, store } = await readPromptCreateStore();
  const index = store.forgePresets.findIndex((item) => item.id === id);
  if (index < 0) {
    return {
      path,
      total: store.forgePresets.length,
      deleted: false,
      id,
    };
  }
  store.forgePresets.splice(index, 1);
  sortForgePresetsInPlace(store.forgePresets);
  await writePromptCreateStore(file, store);
  return {
    path,
    total: store.forgePresets.length,
    deleted: true,
    id,
  };
};

export const toggleForgePresetFavorite = async (
  idInput: string,
): Promise<ToggleForgePresetFavoriteResult> => {
  const id = String(idInput ?? "").trim();
  if (!id) {
    throw new Error("Forge 预设ID不能为空");
  }
  const { file, path, store } = await readPromptCreateStore();
  const index = store.forgePresets.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new Error("Forge 预设不存在");
  }
  const prev = store.forgePresets[index];
  const next: ForgePresetItem = {
    ...prev,
    favorite: prev.favorite === 1 ? 0 : 1,
    updatedAt: new Date().toISOString(),
  };
  store.forgePresets.splice(index, 1, next);
  sortForgePresetsInPlace(store.forgePresets);
  await writePromptCreateStore(file, store);
  return {
    path,
    total: store.forgePresets.length,
    item: next,
  };
};

export const exportForgePresets = async (): Promise<ExportForgePresetsResult> => {
  const { path, store } = await readPromptCreateStore();
  const items = normalizeForgePresets(store.forgePresets);

  const file = await fs.getFileForSaving("forge-presets.json", { types: ["json"] });
  if (!file) {
    throw new Error("已取消导出");
  }

  const payload = {
    version: 1,
    source: "xcyd_v2",
    exportedAt: new Date().toISOString(),
    total: items.length,
    items,
  };
  console.info("[single-image-request]", {
    url,
    model: modelName,
    providerProtocol,
    requestedImageSize: imageSize,
    timeoutSeconds,
    prompt,
    promptLength: prompt.length,
    inputImageBase64Length: inputImageBase64.length,
    hasImageConfig: imageSize !== "Auto",
    generationConfig: payload.generationConfig,
  });

  await file.write(JSON.stringify(payload, null, 2));
  return {
    path: String((file as any)?.nativePath ?? path),
    exported: items.length,
  };
};

export const importForgePresets = async (
  input?: ImportForgePresetsInput,
): Promise<ImportForgePresetsResult> => {
  const replace = Boolean(input?.replace);
  const { file: storeFile, path, store } = await readPromptCreateStore();

  const fileEntry = await fs.getFileForOpening({ types: ["json"] });
  if (!fileEntry) {
    throw new Error("已取消导入");
  }
  const importFile = Array.isArray(fileEntry) ? fileEntry[0] : fileEntry;
  const text = String((await importFile.read()) ?? "").trim();
  if (!text) {
    throw new Error("导入文件为空");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("导入文件不是有效的 JSON");
  }

  const candidates = collectForgePresetImportCandidates(parsed);
  if (!candidates.length) {
    throw new Error("导入文件中未找到可识别的 Forge 预设");
  }

  const incoming: ForgePresetItem[] = [];
  const incomingIds = new Set<string>();
  let skipped = 0;
  for (let i = 0; i < candidates.length; i += 1) {
    const normalized = normalizeForgePresetImportItem(candidates[i], `导入预设 ${i + 1}`);
    if (!normalized) {
      skipped += 1;
      continue;
    }
    normalized.id = buildUniqueForgePresetId(incomingIds, normalized.id);
    incoming.push(normalized);
  }

  if (!incoming.length) {
    throw new Error("没有可导入的有效 Forge 预设");
  }

  let created = 0;
  let updated = 0;
  const nowIso = new Date().toISOString();

  if (replace) {
    const tempStore: PromptCreateStoreFile = {
      ...store,
      forgePresets: [],
    };
    const replaceIds = new Set<string>();
    for (const item of incoming) {
      const nextName = buildUniqueForgePresetName(tempStore, item.name) || item.name;
      const nextItem: ForgePresetItem = {
        ...item,
        id: buildUniqueForgePresetId(replaceIds, item.id),
        name: nextName,
        createdAt: String(item.createdAt || nowIso),
        updatedAt: nowIso,
        data: normalizeForgePresetData(item.data),
      };
      tempStore.forgePresets.push(nextItem);
    }
    store.forgePresets = tempStore.forgePresets;
    created = store.forgePresets.length;
  } else {
    const existingIds = new Set(store.forgePresets.map((item) => String(item.id)));
    for (const item of incoming) {
      const byIdIndex = store.forgePresets.findIndex((preset) => preset.id === item.id);
      const nameLower = String(item.name).trim().toLowerCase();
      const byNameIndex =
        byIdIndex >= 0
          ? -1
          : store.forgePresets.findIndex(
            (preset) => String(preset.name).trim().toLowerCase() === nameLower,
          );

      if (byIdIndex >= 0 || byNameIndex >= 0) {
        const index = byIdIndex >= 0 ? byIdIndex : byNameIndex;
        const prev = store.forgePresets[index];
        const nextName = buildUniqueForgePresetName(store, item.name, prev.id) || prev.name;
        const next: ForgePresetItem = {
          ...prev,
          name: nextName,
          category: String(item.category || "custom").slice(0, 40),
          favorite: item.favorite === 1 ? 1 : prev.favorite === 1 ? 1 : 0,
          updatedAt: nowIso,
          data: normalizeForgePresetData(item.data),
        };
        store.forgePresets.splice(index, 1, next);
        updated += 1;
      } else {
        const nextName = buildUniqueForgePresetName(store, item.name) || item.name;
        const next: ForgePresetItem = {
          ...item,
          id: buildUniqueForgePresetId(existingIds, item.id),
          name: nextName,
          createdAt: String(item.createdAt || nowIso),
          updatedAt: nowIso,
          data: normalizeForgePresetData(item.data),
        };
        store.forgePresets.push(next);
        created += 1;
      }
    }
  }

  sortForgePresetsInPlace(store.forgePresets);
  store.forgePresets = normalizeForgePresets(store.forgePresets);
  await writePromptCreateStore(storeFile, store);

  return {
    path,
    total: store.forgePresets.length,
    created,
    updated,
    skipped,
    replaced: replace,
  };
};

export const listManagedApiKeys = async (): Promise<ManagedApiKeyListResult> => {
  const { path, store } = await readPromptCreateStore();
  const items = getManagedApiKeysFromStore(store);
  return {
    path,
    total: items.length,
    items,
  };
};

export const saveManagedApiKey = async (
  input: SaveManagedApiKeyInput,
): Promise<SaveManagedApiKeyResult> => {
  const value = String(input?.value ?? "").trim();
  if (!value) {
    throw new Error("API Key cannot be empty");
  }

  const { file, path, store } = await readPromptCreateStore();
  const existing = getManagedApiKeysFromStore(store).find((item) => item.value === value);
  if (existing) {
    return {
      path,
      total: getManagedApiKeysFromStore(store).length,
      item: existing,
      created: false,
    };
  }

  const name = buildUniqueApiKeyName(store, value);
  if (!name) {
    throw new Error("Unable to generate API Key name");
  }
  store.apiKeys[name] = value;
  await writePromptCreateStore(file, store);

  return {
    path,
    total: getManagedApiKeysFromStore(store).length,
    item: { name, value },
    created: true,
  };
};

export const saveAiChatApiKey = async (
  input: SaveManagedApiKeyInput,
): Promise<SaveManagedApiKeyResult> => {
  const value = String(input?.value ?? "").trim();
  if (!value) {
    throw new Error("AI Chat API Key cannot be empty");
  }

  const { file, path, store } = await readPromptCreateStore();
  const existing = getAiChatApiKeysFromStore(store).find((item) => item.value === value);
  if (existing) {
    return {
      path,
      total: getAiChatApiKeysFromStore(store).length,
      item: existing,
      created: false,
    };
  }

  const name = buildUniqueAiChatApiKeyName(store, value);
  if (!name) {
    throw new Error("Unable to generate AI Chat API Key name");
  }
  store.aiChatApiKeys[name] = value;
  await writePromptCreateStore(file, store);

  return {
    path,
    total: getAiChatApiKeysFromStore(store).length,
    item: { name, value },
    created: true,
  };
};

export const readAiChatApiKey = async (): Promise<ReadAiChatApiKeyResult> => {
  const { path, store } = await readPromptCreateStore();
  const entries = Object.entries(store.aiChatApiKeys ?? {})
    .map(([name, value]) => ({
      name: String(name ?? "").trim(),
      value: String(value ?? "").trim(),
    }))
    .filter((item) => item.name.length > 0 && item.value.length > 0);

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;
  return {
    path,
    total: entries.length,
    item: latest,
  };
};

export const saveUiThemePreset = async (
  input: SaveUiThemePresetInput,
): Promise<SaveUiThemePresetResult> => {
  const value = String(input?.value ?? "").trim();
  if (!value) {
    throw new Error("UI theme preset cannot be empty");
  }

  const { file, path, store } = await readPromptCreateStore();
  store.uiThemePreset = value;
  await writePromptCreateStore(file, store);

  return {
    path,
    value,
  };
};

export const readUiThemePreset = async (): Promise<ReadUiThemePresetResult> => {
  const { path, store } = await readPromptCreateStore();
  return {
    path,
    value: String(store.uiThemePreset ?? "").trim(),
  };
};

export const saveUiBackgroundSettings = async (
  input: SaveUiBackgroundSettingsInput,
): Promise<SaveUiBackgroundSettingsResult> => {
  const { file, path, store } = await readPromptCreateStore();
  const settings = normalizeUiBackgroundSettings(input ?? {});
  store.uiBackgroundSettingsStored = 1;
  store.uiBackgroundSettings = settings;
  await writePromptCreateStore(file, store);
  return {
    path,
    stored: true,
    settings,
  };
};

export const readUiBackgroundSettings = async (): Promise<ReadUiBackgroundSettingsResult> => {
  const { path, store } = await readPromptCreateStore();
  return {
    path,
    stored: Number(store.uiBackgroundSettingsStored) === 1,
    settings: normalizeUiBackgroundSettings(store.uiBackgroundSettings),
  };
};

export const savePromptHistoryRecords = async (
  input: SavePromptHistoryRecordsInput,
): Promise<SavePromptHistoryRecordsResult> => {
  const { file, path, store } = await readPromptCreateStore();
  const records = normalizePromptHistoryRecords(input?.records);
  store.promptHistoryRecords = records;
  await writePromptCreateStore(file, store);
  return {
    path,
    total: records.length,
    records,
  };
};

export const readPromptHistoryRecords = async (): Promise<ReadPromptHistoryRecordsResult> => {
  const { path, store } = await readPromptCreateStore();
  const records = normalizePromptHistoryRecords(store.promptHistoryRecords);
  return {
    path,
    total: records.length,
    records,
  };
};

export const saveStartupNoticeConfirmed = async (
  input: SaveStartupNoticeConfirmedInput,
): Promise<SaveStartupNoticeConfirmedResult> => {
  const value = String(input?.value ?? "").trim();
  const confirmed = value === "1" || value === "true" ? 1 : 0;
  const { file, path, store } = await readPromptCreateStore();
  store.startupNoticeConfirmed = confirmed;
  await writePromptCreateStore(file, store);
  return {
    path,
    value: confirmed,
  };
};

export const readStartupNoticeConfirmed = async (): Promise<ReadStartupNoticeConfirmedResult> => {
  const { path, store } = await readPromptCreateStore();
  return {
    path,
    value: Number(store.startupNoticeConfirmed) === 1 ? 1 : 0,
  };
};

export const saveCustomFeatureEnabled = async (
  input: SaveCustomFeatureEnabledInput,
): Promise<SaveCustomFeatureEnabledResult> => {
  const value = String(input?.value ?? "").trim();
  const enabled = value === "1" || value === "true" ? 1 : 0;
  const { file, path, store } = await readPromptCreateStore();
  store.customFeatureEnabled = enabled;
  await writePromptCreateStore(file, store);
  return {
    path,
    value: enabled,
  };
};

export const readCustomFeatureEnabled = async (): Promise<ReadCustomFeatureEnabledResult> => {
  const { path, store } = await readPromptCreateStore();
  return {
    path,
    value: Number(store.customFeatureEnabled) === 1 ? 1 : 0,
  };
};

export const saveSingleRunConfirmSkipDate = async (
  input: SaveSingleRunConfirmSkipDateInput,
): Promise<SaveSingleRunConfirmSkipDateResult> => {
  const { file, path, store } = await readPromptCreateStore();
  const value = normalizeSingleRunConfirmSkipDate(input?.value);
  store.singleRunConfirmSkipDate = value;
  await writePromptCreateStore(file, store);
  return {
    path,
    value,
  };
};

export const readSingleRunConfirmSkipDate = async (): Promise<ReadSingleRunConfirmSkipDateResult> => {
  const { path, store } = await readPromptCreateStore();
  return {
    path,
    value: normalizeSingleRunConfirmSkipDate(store.singleRunConfirmSkipDate),
  };
};

export const saveProviderConfigs = async (
  input: SaveProviderConfigsInput,
): Promise<SaveProviderConfigsResult> => {
  const { file, path, store } = await readPromptCreateStore();
  const normalized = normalizeProviderConfigsStore({
    items: input?.items,
    selectedSingleProviderId: input?.selectedSingleProviderId,
    selectedAiChatProviderId: input?.selectedAiChatProviderId,
  });
  store.providerConfigs = normalized;
  await writePromptCreateStore(file, store);
  return {
    path,
    total: normalized.items.length,
    items: normalized.items,
    selectedSingleProviderId: normalized.selectedSingleProviderId,
    selectedAiChatProviderId: normalized.selectedAiChatProviderId,
  };
};

export const readProviderConfigs = async (): Promise<ReadProviderConfigsResult> => {
  const { path, store } = await readPromptCreateStore();
  const normalized = normalizeProviderConfigsStore(store.providerConfigs);
  return {
    path,
    total: normalized.items.length,
    items: normalized.items,
    selectedSingleProviderId: normalized.selectedSingleProviderId,
    selectedAiChatProviderId: normalized.selectedAiChatProviderId,
  };
};

export const updateManagedApiKey = async (
  input: UpdateManagedApiKeyInput,
): Promise<SaveManagedApiKeyResult> => {
  const name = String(input?.name ?? "").trim();
  const value = String(input?.value ?? "").trim();
  if (!name) {
    throw new Error("API Key name cannot be empty");
  }
  if (!value) {
    throw new Error("API Key cannot be empty");
  }

  const { file, path, store } = await readPromptCreateStore();
  if (!store.apiKeys[name]) {
    throw new Error("Selected API Key not found");
  }

  delete store.apiKeys[name];

  // If value already exists after removing current key, reuse that existing name.
  const duplicated = getManagedApiKeysFromStore(store).find((item) => item.value === value);
  if (duplicated) {
    await writePromptCreateStore(file, store);
    return {
      path,
      total: getManagedApiKeysFromStore(store).length,
      item: duplicated,
      created: false,
    };
  }

  const preferredName = normalizeApiKeyName(value);
  const resolvedName = buildUniqueApiKeyName(store, value, preferredName);
  if (!resolvedName) {
    throw new Error("Unable to generate API Key name");
  }
  store.apiKeys[resolvedName] = value;
  await writePromptCreateStore(file, store);

  return {
    path,
    total: getManagedApiKeysFromStore(store).length,
    item: { name: resolvedName, value },
    created: false,
  };
};

export const deleteManagedApiKey = async (
  nameInput: string,
): Promise<DeleteManagedApiKeyResult> => {
  const name = String(nameInput ?? "").trim();
  if (!name) {
    throw new Error("API Key name cannot be empty");
  }

  const { file, path, store } = await readPromptCreateStore();
  if (!store.apiKeys[name]) {
    return {
      path,
      total: getManagedApiKeysFromStore(store).length,
      deleted: false,
      name,
    };
  }

  delete store.apiKeys[name];
  await writePromptCreateStore(file, store);
  return {
    path,
    total: getManagedApiKeysFromStore(store).length,
    deleted: true,
    name,
  };
};

export const clearManagedApiKeys = async (): Promise<ManagedApiKeyListResult> => {
  const { file, path, store } = await readPromptCreateStore();
  store.apiKeys = {};
  await writePromptCreateStore(file, store);
  return {
    path,
    total: 0,
    items: [],
  };
};

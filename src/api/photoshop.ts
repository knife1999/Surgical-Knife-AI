import { photoshop, uxp } from "../globals";

const DEFAULT_MODEL_NAME = "AJbanana3";
const POINTS_PER_USD = 500000;
const PRICE_1K = 0.15;
const PRICE_2K = 0.16;
const PRICE_4K = 0.18;

const storage = (uxp as any).storage;
const fs = storage.localFileSystem;

type ImageSize = "Auto" | "1K" | "2K" | "4K";
type AntiMode = 0 | 1 | 2;
type LayerType = "rasterized" | "smartObject";

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

export type RunSingleImageOptions = {
  prompt: string;
  apiKey: string;
  apiBaseUrl: string;
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
};

export type BatchTaskSettings = {
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

const PROMPT_CREATE_FOLDER_NAME = "prompt-create";
const PROMPT_CREATE_FILE_NAME = "prompt-create.json";
const PROMPT_LIBRARY_LIST_URL = "https://library.ai.pachouli.kiclover.com/public/list";
const PROMPT_LIBRARY_PAGE = 1;
const PROMPT_LIBRARY_PAGE_SIZE = 999;
const PROMPT_LIBRARY_TIMEOUT_SECONDS = 12;

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
  startupNoticeConfirmed: 0 | 1;
  customFeatureEnabled: 0 | 1;
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
  startupNoticeConfirmed: 0,
  customFeatureEnabled: 0,
  items: [],
});

let promptCreateStoreEntryCache: PromptCreateStoreEntry | null = null;
let promptCreateStoreEntryPromise: Promise<PromptCreateStoreEntry> | null = null;
let promptCreateStoreCache: PromptCreateStoreFile | null = null;
let promptCreateLibrarySyncPromise: Promise<void> | null = null;

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
      startupNoticeConfirmed: Number(parsed?.startupNoticeConfirmed) === 1 ? 1 : 0,
      customFeatureEnabled: Number(parsed?.customFeatureEnabled) === 1 ? 1 : 0,
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

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
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

const applyAntiTruncationForInput = async (antiMode: AntiMode) => {
  if (antiMode <= 0) return;

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

const getSelectionAndImage = async (
  maxResolution: number,
  antiMode: AntiMode,
  predefinedSelection?: SelectionBounds,
): Promise<{ base64: string; selection: SelectionBounds } | null> => {
  let result: { base64: string; selection: SelectionBounds } | null = null;
  let duplicateDoc: any = null;

  try {
    await photoshop.core.executeAsModal(async () => {
      const originalDoc = photoshop.app.activeDocument;

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

      duplicateDoc = await originalDoc.duplicate("temp_ai_process");
      await duplicateDoc.flatten();

      const bitsPerChannel = toNumber(duplicateDoc.bitsPerChannel);
      if (bitsPerChannel !== 8) {
        await photoshop.action.batchPlay(
          [
            {
              _obj: "convertMode",
              _target: [
                { _ref: "document", _enum: "ordinal", _value: "targetEnum" },
              ],
              depth: 8,
            },
          ],
          {},
        );
      }

      await duplicateDoc.crop({
        left: selectionBounds.left,
        top: selectionBounds.top,
        right: selectionBounds.right,
        bottom: selectionBounds.bottom,
      });

      await applyAntiTruncationForInput(antiMode);

      const currentWidth = toNumber(duplicateDoc.width);
      const currentHeight = toNumber(duplicateDoc.height);
      if (currentWidth > maxResolution || currentHeight > maxResolution) {
        let newWidth: number;
        let newHeight: number;
        if (currentWidth > currentHeight) {
          newWidth = maxResolution;
          newHeight = Math.round(currentHeight * (maxResolution / currentWidth));
        } else {
          newHeight = maxResolution;
          newWidth = Math.round(currentWidth * (maxResolution / currentHeight));
        }
        await duplicateDoc.resizeImage(newWidth, newHeight);
      }

      const tempFolder = await fs.getTemporaryFolder();
      const tempFile = await tempFolder.createFile("single_input.png", {
        overwrite: true,
      });
      const saveToken = await fs.createSessionToken(tempFile);

      await photoshop.action.batchPlay(
        [
          {
            _obj: "save",
            as: {
              _obj: "PNGFormat",
              method: { _enum: "PNGMethod", _value: "quick" },
            },
            in: { _path: saveToken, _kind: "local" },
            documentID: duplicateDoc.id,
            lowerCase: true,
            saveStage: { _enum: "saveStageType", _value: "saveStageOS" },
          },
        ],
        {},
      );

      const arrayBuffer = await tempFile.read({ format: storage.formats.binary });
      result = {
        base64: arrayBufferToBase64(arrayBuffer),
        selection: selectionBounds,
      };
    }, { commandName: "Capture Selection" });
  } catch (error) {
    if ((error as Error).message === "NO_SELECTION") {
      return null;
    }
    throw error;
  } finally {
    if (duplicateDoc) {
      try {
        await photoshop.core.executeAsModal(async () => {
          await duplicateDoc.closeWithoutSaving();
        }, { commandName: "Close Temp Document" });
      } catch {
        // no-op
      }
    }
  }

  return result;
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

const callAiApi = async (
  apiKey: string,
  prompt: string,
  inputImageBase64: string,
  imageSize: ImageSize,
  timeoutSeconds: number,
  apiBaseUrl: string,
) => {
  let modelName = DEFAULT_MODEL_NAME;
  if (imageSize !== "Auto") {
    const suffix = `-${imageSize.toLowerCase()}`;
    if (!modelName.endsWith(suffix)) modelName = `${modelName}${suffix}`;
  }

  const url = `${apiBaseUrl}/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const payload = {
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
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const msg = getHttpErrorMessage(response.status);
      const solution = getHttpErrorSolution(response.status);
      throw new Error(`${msg}銆?{solution}`);
    }

    const data = await response.json();
    const imagePart = data?.candidates?.[0]?.content?.parts?.find(
      (part: any) => part?.inlineData?.data,
    );
    if (imagePart?.inlineData?.data) return imagePart.inlineData.data as string;

    const textPart = data?.candidates?.[0]?.content?.parts?.find(
      (part: any) => part?.text,
    );
    if (textPart) {
      throw new Error(
        "浠呮敹鍒版枃鏈搷搴旓紝鍥惧儚鐢熸垚鍙兘琚嫤鎴€傚缓璁紑鍚姉鎴柇鎴栬皟鏁村師鍥炬晱鎰熷尯鍩熷悗閲嶈瘯",
      );
    }

    throw new Error("API did not return image data");
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error(`璇锋眰瓒呮椂锛?{timeoutSeconds}绉掞級`);
    }

    const message = (error as Error).message || "";
    if (message.includes("fetch") || message.includes("NetworkError")) {
      throw new Error("缃戠粶杩炴帴澶辫触锛岃妫€鏌ョ綉缁滀笌 API 鍦板潃");
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
) => {
  const tempFolder = await fs.getTemporaryFolder();
  const tempFile = await tempFolder.createFile(`single_out_${Date.now()}.png`, {
    overwrite: true,
  });

  const buffer = base64ToArrayBuffer(base64Str);
  await tempFile.write(buffer, { format: storage.formats.binary });

  let createdLayerId: number | null = null;

  await photoshop.core.executeAsModal(async () => {
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
    await tempDoc.resizeImage(targetSelection.width, targetSelection.height);

    await applyAntiTruncationForOutput(antiMode);

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

    await tempDoc.closeWithoutSaving();

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
    }

    if (layerType === "smartObject") {
      await photoshop.action.batchPlay([{ _obj: "newPlacedLayer" }], {});
    }

    const layer = photoshop.app.activeDocument.activeLayers?.[0];
    createdLayerId = layer?.id ?? null;
  }, { commandName: "Place AI Result" });

  return createdLayerId;
};

const createGroupAndMask = async (layerIds: number[], groupNamePrefix = "鍗曞浘") => {
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
  if (!prompt) throw new Error("鎵瑰鐞嗕换鍔℃彁绀鸿瘝涓虹┖");

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
        name: "宸︿笂",
      },
      {
        left: width - size,
        top: 0,
        right: width,
        bottom: size,
        width: size,
        height: size,
        name: "鍙充笂",
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
        name: "宸︿笂",
      },
      {
        left: 0,
        top: height - size,
        right: size,
        bottom: height,
        width: size,
        height: size,
        name: "宸︿笅",
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
      name: "鍏ㄥ浘",
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
  if (!apiKey) throw new Error("API Key 涓嶈兘涓虹┖");
  if (!apiBaseUrl) throw new Error("API 鍦板潃涓嶈兘涓虹┖");

  const docs = Array.from(photoshop.app.documents as any[]);
  if (docs.length === 0) {
    throw new Error("No open documents");
  }

  const docPlans: GlobalPartitionDocPlan[] = docs.map((doc: any) => {
    const width = Math.max(1, Math.round(toNumber(doc.width)));
    const height = Math.max(1, Math.round(toNumber(doc.height)));
    return {
      docId: doc.id,
      docName: String(doc.name ?? `鏂囨。 ${doc.id}`),
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
      const message = `鍒囨崲鏂囨。澶辫触: ${(error as Error).message || "鏈煡閿欒"}`;
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
          const message = `鍒嗗尯 ${selection.name} 鎶撳彇澶辫触`;
          docErrors.push(message);
          errorMessages.push(`[${plan.docName}] ${message}`);
          docFailureCount += batchSize;
          continue;
        }
        captures.push({ selection, base64: capture.base64 });
      } catch (error) {
        const message = `鍒嗗尯 ${selection.name} 鎶撳彇寮傚父: ${(error as Error).message || "鏈煡閿欒"}`;
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
            );
            return { index: index + 1, success: true as const, data };
          } catch (error) {
            return {
              index: index + 1,
              success: false as const,
              errorMessage: (error as Error).message || "鐢熸垚澶辫触",
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
            item.data,
            plan.docId,
            capture.selection,
            antiMode,
            layerType,
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
          await createGroupAndMask(createdLayerIds, `鍒嗗尯-${capture.selection.name}`);
        } catch (error) {
          const message = `鍒嗗尯 ${capture.selection.name} 鍒嗙粍澶辫触: ${(error as Error).message || "鏈煡閿欒"}`;
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
    throw new Error("褰撳墠娌℃湁鎵撳紑鐨?Photoshop 鏂囨。");
  }

  const size = (["Auto", "1K", "2K", "4K"].includes(String(options.size))
    ? options.size
    : "Auto") as ImageSize;
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

  let stampLayerId: number | null = null;
  try {
    await photoshop.core.executeAsModal(
      async () => {
        const doc: any = photoshop.app.activeDocument;
        await photoshop.action.batchPlay(
          [
            {
              _obj: "mergeVisible",
              duplicate: true,
            },
          ],
          {},
        );
        const activeLayer = doc?.activeLayers?.[0];
        const activeLayerId = Number(activeLayer?.id);
        stampLayerId = Number.isFinite(activeLayerId) ? activeLayerId : null;
      },
      { commandName: "Stamp Visible Layer for AI Chat Upload" },
    );

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
  } finally {
    if (stampLayerId) {
      try {
        await photoshop.core.executeAsModal(
          async () => {
            await photoshop.action.batchPlay(
              [
                {
                  _obj: "delete",
                  _target: [{ _ref: "layer", _id: stampLayerId as number }],
                },
              ],
              {},
            );
          },
          { commandName: "Cleanup AI Chat Stamp Layer" },
        );
      } catch {
        // no-op
      }
    }
  }
};

export const runBatchTasks = async (
  options: RunBatchTasksOptions,
): Promise<RunBatchTasksResult> => {
  const apiKey = options.apiKey.trim();
  const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl.trim());

  if (!apiKey) throw new Error("API Key 涓嶈兘涓虹┖");
  if (!apiBaseUrl) throw new Error("API 鍦板潃涓嶈兘涓虹┖");
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
        );
        return { index: index + 1, success: true as const, data };
      } catch (error) {
        return {
          index: index + 1,
          success: false as const,
          errorMessage: (error as Error).message || "鐢熸垚澶辫触",
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
          result.data,
          task.docId,
          task.selection,
          task.settings.antiTruncationMode,
          task.settings.layerType,
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
        groupErrors.push(`鍒嗙粍澶辫触: ${(error as Error).message || "鏈煡閿欒"}`);
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

export const runSingleImage = async (
  options: RunSingleImageOptions,
): Promise<RunSingleImageResult> => {
  const prompt = options.prompt.trim();
  const apiKey = options.apiKey.trim();
  const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl.trim());
  const size = options.size ?? "Auto";
  const batchSize = clamp(Math.floor(options.batchSize || 1), 1, 5);
  const timeoutSeconds = Math.max(5, Math.floor(options.timeoutSeconds || 60));
  const antiMode = options.antiTruncationMode ?? 0;
  const layerType: LayerType =
    options.layerType === "smartObject" ? "smartObject" : "rasterized";
  const maxResolution = clamp(Math.floor(options.maxResolution || 1536), 512, 4096);

  if (!prompt) throw new Error("Prompt cannot be empty");
  if (!apiKey) throw new Error("API Key 涓嶈兘涓虹┖");
  if (!apiBaseUrl) throw new Error("API 鍦板潃涓嶈兘涓虹┖");

  if (!photoshop.app.activeDocument) {
    throw new Error("褰撳墠娌℃湁鎵撳紑鐨?Photoshop 鏂囨。");
  }

  const capture = await getSelectionAndImage(maxResolution, antiMode);
  if (!capture) {
    throw new Error("鏈娴嬪埌閫夊尯锛岃鍏堝垱寤洪€夊尯鍚庡啀鎵ц");
  }

  const requestTasks = Array.from({ length: batchSize }, async (_, index) => {
    try {
      const data = await callAiApi(
        apiKey,
        prompt,
        capture.base64,
        size,
        timeoutSeconds,
        apiBaseUrl,
      );
      return { index: index + 1, success: true as const, data };
    } catch (error) {
      return {
        index: index + 1,
        success: false as const,
        errorMessage: (error as Error).message || "鐢熸垚澶辫触",
      };
    }
  });

  const requestResults = await Promise.all(requestTasks);
  const successfulResults = requestResults
    .filter((item) => item.success)
    .sort((a, b) => a.index - b.index);

  if (successfulResults.length === 0) {
    const firstError = requestResults.find((item) => !item.success);
    throw new Error(firstError?.errorMessage || "鎵€鏈夌敓鎴愪换鍔″潎澶辫触");
  }

  const createdLayerIds: number[] = [];
  const errorMessages = requestResults
    .filter((item) => !item.success)
    .map((item) => `Item ${item.index} failed: ${item.errorMessage}`);

  const targetDocId = photoshop.app.activeDocument.id;
  for (const result of successfulResults) {
    try {
      const layerId = await placeImageToSpecificDoc(
        result.data,
        targetDocId,
        capture.selection,
        antiMode,
        layerType,
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
    await photoshop.core.executeAsModal(async () => {
      await createGroupAndMask(createdLayerIds, "鍗曞浘");
    }, { commandName: "Group AI Layers" });
  }

  await deselectAll();

  return {
    // Avoid transferring large base64 blobs over the webview bridge in packaged mode.
    // This improves stability of host<->webview messaging.
    previewBase64: "",
    successCount: createdLayerIds.length,
    failureCount: batchSize - createdLayerIds.length,
    totalCount: batchSize,
    errorMessages,
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

  if (!apiKey) throw new Error("API Key 涓嶈兘涓虹┖");
  if (!apiBaseUrl) throw new Error("API 鍦板潃涓嶈兘涓虹┖");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/usage/token`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error(`棰濆害鏌ヨ瓒呮椂锛?{timeoutSeconds}绉掞級`);
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
      `${getHttpErrorMessage(response.status)}銆?{getHttpErrorSolution(response.status)}`,
    );
  }

  let json: any;
  try {
    json = await response.json();
  } catch {
    throw new Error("棰濆害鎺ュ彛杩斿洖闈?JSON 鏁版嵁");
  }
  const info = json?.data;
  if (!info) throw new Error("棰濆害鎺ュ彛杩斿洖鏍煎紡寮傚父");

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
    throw new Error("棰勮鏂囦欢鏍煎紡閿欒");
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

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from "vue";
import {MessagePlugin} from "tdesign-vue-next";
import {initWebview} from "./webview-setup";
import * as webviewAPI from "./webview-api";
import pluginGuideMarkdown from "./docs/plugin-guide.md?raw";
import MainTabSingle from "./components/main-webview-tabs/main-tab-single.vue";
import MainTabBatch from "./components/main-webview-tabs/main-tab-batch.vue";
import MainTabAiChat from "./components/main-webview-tabs/main-tab-ai-chat.vue";
import MainTabPromptQuery from "./components/main-webview-tabs/main-tab-prompt-query.vue";
import MainTabPromptCreate from "./components/main-webview-tabs/main-tab-prompt-create.vue";
import MainTabImagePreview from "./components/main-webview-tabs/main-tab-image-preview.vue";
import MainTabGuide from "./components/main-webview-tabs/main-tab-guide.vue";
import MainTabSettings from "./components/main-webview-tabs/main-tab-settings.vue";
import {AI_CHAT_JSON_MODE_ACTIVATION_TEXT} from "./constants/ai-chat-json-mode";

const {api} = initWebview(webviewAPI);
const IS_DEV = import.meta.env.DEV;

const APP_VERSION = "v2.0.2";
const DEFAULT_SHOW_IMAGE_PREVIEW_TAB = false;
const SHOW_GUIDE_TAB = false;
const DEFAULT_API_BASE_URL = "https://ai.ajiai.top";
const DEFAULT_SINGLE_RUN_SHORTCUT = "Ctrl+Alt+Enter";
const AI_CHAT_COMFLY_BASE_URL = "https://ai.comfly.chat";
const AI_CHAT_AJIAI_BASE_URL = "https://ai.ajiai.top";
const AI_CHAT_BASE_URL_OPTIONS = [AI_CHAT_COMFLY_BASE_URL, AI_CHAT_AJIAI_BASE_URL] as const;
const DEFAULT_AI_CHAT_BASE_URL = AI_CHAT_BASE_URL_OPTIONS[0];
const AI_CHAT_PATHS = {
  [AI_CHAT_COMFLY_BASE_URL]: {
    models: "/v1/models",
    completions: "/v1/chat/completions",
    protocol: "openai",
  },
  [AI_CHAT_AJIAI_BASE_URL]: {
    models: "/v1beta/models",
    completions: "/v1beta/models/{model}:generateContent",
    protocol: "gemini",
  },
} as const;
const CUSTOM_FEATURE_CODE = "4kxTcFWgG251JtcO";
const STARTUP_NOTICE_TEXT = [
  "本插件基于开源软件(by 夏三七的大香蕉 插件)二次开发，插件本体完全免费（第三方api需自费配置），如果您是通过购买获得此插件，请立即要求退款并问候卖方家人。",
  "交流群:1053965447 暗号:lv7上升气流",
  "提示词图书馆官网:https://spellbook.kiclover.com",
  "然后制作不易求大家的一个扩列  1842336512",
].join("\n");
const STARTUP_NOTICE_SIGNATURE = "--by 绣春刀 2026.2.18 v1.0.0";
const MESSAGE_DURATION_MS = 3000;
const message = {
  success: (content: string) =>
    MessagePlugin.success({ content, duration: MESSAGE_DURATION_MS }),
  warning: (content: string) =>
    MessagePlugin.warning({ content, duration: MESSAGE_DURATION_MS }),
  error: (content: string) =>
    MessagePlugin.error({ content, duration: MESSAGE_DURATION_MS }),
  info: (content: string) =>
    MessagePlugin.info({ content, duration: MESSAGE_DURATION_MS }),
};

type SizeOption = "Auto" | "1K" | "2K" | "4K";
type AntiMode = 0 | 1 | 2;
type LayerType = "rasterized" | "smartObject";
type ThemePresetKey = "midnight" | "pink" | "kittyPink" | "emerald" | "sunset" | "ocean";
type LogLevel = "info" | "warn" | "error" | "success";
type ShortcutModifier = "ctrl" | "alt" | "shift" | "meta";
type AiChatBaseUrl = (typeof AI_CHAT_BASE_URL_OPTIONS)[number];
type AiChatProtocol = "openai" | "gemini";

type ActiveTab =
    | "single"
    | "batch"
    | "settings"
    | "guide"
    | "ai-chat"
    | "prompt-query"
    | "prompt-create"
    | "image-preview";

const BASE_TAB_ORDER: ActiveTab[] = [
  "single",
  "batch",
  "ai-chat",
  "prompt-query",
  "prompt-create",
  "settings",
];
const TAB_LABEL_MAP: Record<ActiveTab, string> = {
  single: "单图处理",
  batch: "批处理",
  settings: "设置",
  guide: "使用说明",
  "ai-chat": "与AI对话",
  "prompt-query": "提示词查询",
  "prompt-create": "提示词新增",
  "image-preview": "图片预览",
};

interface LogEntry {
  id: number;
  time: string;
  level: LogLevel;
  message: string;
}

interface ShortcutDefinition {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

interface ImagePreviewItem {
  id: number;
  name: string;
  url: string;
  zoom: number;
  frameHeight: number;
  offsetX: number;
  offsetY: number;
}

interface SingleRunResult {
  previewBase64: string;
  successCount: number;
  failureCount: number;
  totalCount: number;
  errorMessages: string[];
}

interface QuotaResult {
  totalGranted: number;
  totalUsed: number;
  totalAvailable: number;
  availableUSD: number;
  count1K: number;
  count2K: number;
  count4K: number;
}

interface BatchTaskSelection {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface BatchTaskSettings {
  size: SizeOption;
  count: number;
  timeoutSeconds: number;
  antiTruncationMode: AntiMode;
  layerType: LayerType;
  maxResolution: number;
}

interface BatchTaskItem {
  id: number;
  docId: number;
  docName: string;
  prompt: string;
  base64: string;
  selection: BatchTaskSelection;
  settings: BatchTaskSettings;
}

interface BatchTaskGroupResult {
  taskId: number;
  docId: number;
  docName: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
  errorMessages: string[];
}

interface RunBatchResult {
  taskGroupCount: number;
  totalCount: number;
  successCount: number;
  failureCount: number;
  taskResults: BatchTaskGroupResult[];
  errorMessages: string[];
}

interface GlobalPartitionDocResult {
  docId: number;
  docName: string;
  partitionCount: number;
  successCount: number;
  failureCount: number;
  errorMessages: string[];
}

interface GlobalPartitionResult {
  documentCount: number;
  taskCount: number;
  successCount: number;
  failureCount: number;
  docResults: GlobalPartitionDocResult[];
  errorMessages: string[];
}

interface PromptCreateStorageInfo {
  path: string;
  total: number;
  skipRemoteSync?: 0 | 1;
  librarySyncFlag?: 0 | 1;
  librarySyncLastStatus?: string;
  librarySyncLastMessage?: string;
  librarySyncLastAt?: string;
}

interface PromptCreateSaveResult {
  path: string;
  total: number;
  item?: PromptCreateQueryItem;
}

interface PromptCreateDeleteResult {
  path: string;
  total: number;
  deleted: boolean;
  name: string;
}

interface PromptCreateQueryItem {
  type: 1 | 2;
  favorite: 0 | 1;
  name: string;
  content: string;
  description: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface PromptCreateListResult {
  path: string;
  total: number;
  items: PromptCreateQueryItem[];
}

interface ManagedApiKeyItem {
  name: string;
  value: string;
}

interface ManagedApiKeyListResult {
  path: string;
  total: number;
  items: ManagedApiKeyItem[];
}

interface ManagedApiKeySaveResult {
  path: string;
  total: number;
  item: ManagedApiKeyItem;
  created: boolean;
}

interface ReadAiChatApiKeyResult {
  path: string;
  total: number;
  item: ManagedApiKeyItem | null;
}

interface ManagedApiKeyDeleteResult {
  path: string;
  total: number;
  deleted: boolean;
  name: string;
}

interface AiModelItem {
  id: string;
  ownedBy: string;
  created: number | null;
}

type AiChatRole = "user" | "assistant";

interface AiChatImageItem {
  id: number;
  name: string;
  dataUrl: string;
}

interface AiChatMessageSegment {
  id: string;
  type: "text" | "code";
  html?: string;
  code?: string;
  language?: string;
}

interface AiChatMessageItem {
  id: number;
  role: AiChatRole;
  text: string;
  requestText?: string;
  images: AiChatImageItem[];
  createdAt: number;
  segments: AiChatMessageSegment[];
}

interface CaptureAiChatCurrentSelectionImageResult {
  base64: string;
  name?: string;
  mimeType?: string;
}

interface HostCapabilitiesResult {
  hostName?: string;
  hostApiAttached?: boolean;
  runSingleImage?: boolean;
  getAiQuota?: boolean;
  captureBatchTask?: boolean;
  captureAiChatCurrentSelectionImage?: boolean;
  runBatchTasks?: boolean;
  runGlobalPartition?: boolean;
  savePromptCreateItem?: boolean;
  initPromptCreateStorage?: boolean;
  getPromptCreateStorageInfo?: boolean;
  listPromptCreateItems?: boolean;
  deletePromptCreateItem?: boolean;
  togglePromptCreateFavorite?: boolean;
  listManagedApiKeys?: boolean;
  saveManagedApiKey?: boolean;
  saveAiChatApiKey?: boolean;
  readAiChatApiKey?: boolean;
  saveUiThemePreset?: boolean;
  readUiThemePreset?: boolean;
  saveStartupNoticeConfirmed?: boolean;
  readStartupNoticeConfirmed?: boolean;
  saveCustomFeatureEnabled?: boolean;
  readCustomFeatureEnabled?: boolean;
  updateManagedApiKey?: boolean;
  deleteManagedApiKey?: boolean;
  clearManagedApiKeys?: boolean;
}

const STORAGE_KEYS = {
  selectedApiKeyName: "selected_api_key_name",
  startupNoticeConfirmed: "startup_notice_confirmed_v1",
  customFeatureEnabled: "custom_feature_enabled_v1",
  promptQueryFavoritesOnly: "prompt_query_favorites_only",
  promptQuerySourceType: "prompt_query_source_type",
  promptLibraryForceSync: "prompt_library_force_sync",
  aiChatBaseUrl: "ai_chat_base_url",
  aiChatApiKeyName: "ai_chat_api_key_name",
  aiChatApiKey: "ai_chat_api_key",
  aiChatUserAvatar: "ai_chat_user_avatar",
  aiChatContextCount: "ai_chat_context_count",
  aiChatMaxTokens: "ai_chat_max_tokens",
  aiChatSystemPrompt: "ai_chat_system_prompt",
  aiChatTemperature: "ai_chat_temperature",
  aiChatTopP: "ai_chat_top_p",
  aiChatPresencePenalty: "ai_chat_presence_penalty",
  aiChatFrequencyPenalty: "ai_chat_frequency_penalty",
  aiChatJsonModeEnabled: "ai_chat_json_mode_enabled",
  themePreset: "ui_theme_preset",
  singleRunShortcut: "single_run_shortcut",
  apiBaseUrl: "single_api_base_url",
  prompt: "single_prompt",
  size: "single_size",
  batchSize: "single_batch_size",
  timeoutSeconds: "single_timeout_seconds",
  singleDefaultsMigration: "single_defaults_2k_1_200_migrated_v1",
  antiMode: "single_anti_mode",
  layerType: "single_layer_type",
  maxResolution: "single_max_resolution",
  globalPrompt: "global_prompt",
  globalSize: "global_size",
  globalBatchSize: "global_batch_size",
  globalTimeoutSeconds: "global_timeout_seconds",
};

const LEGACY_STORAGE_KEYS = {
  savedApiKey: "saved_api_key",
  savedApiKeys: "saved_api_keys",
  imagePreviewFeatureUnlocked: "image_preview_feature_unlocked_v1",
};

const sizeOptions = [
  {label: "Auto", value: "Auto" as SizeOption},
  {label: "1K", value: "1K" as SizeOption},
  {label: "2K", value: "2K" as SizeOption},
  {label: "4K", value: "4K" as SizeOption},
];

const layerTypeOptions = [
  {label: "栅格化图层", value: "rasterized" as LayerType},
  {label: "智能对象", value: "smartObject" as LayerType},
];

const THEME_PRESET_LABEL_MAP: Record<ThemePresetKey, string> = {
  midnight: "深空蓝（默认）",
  pink: "樱花粉",
  kittyPink: "少女粉",
  emerald: "青柠绿",
  sunset: "日落橙",
  ocean: "海洋青",
};

const themePresetOptions = (Object.entries(THEME_PRESET_LABEL_MAP) as Array<[ThemePresetKey, string]>).map(
    ([value, label]) => ({value, label}),
);

const THEME_PRESET_LIST = Object.keys(THEME_PRESET_LABEL_MAP) as ThemePresetKey[];

const THEME_PRESET_TOKENS: Record<ThemePresetKey, Record<string, string>> = {
  midnight: {
    "--panel-bg": "#171a1f",
    "--panel-bg-soft": "#1f242b",
    "--input-bg": "#13171c",
    "--border-color": "#2f3640",
    "--accent-color": "#9ba8bd",
    "--text-main": "#d8dee8",
    "--text-sub": "#98a3b3",
    "--log-bg": "#11151a",
    "--btn-bg": "#242b34",
    "--btn-hover": "#2c3541",
    "--btn-border": "#3b4552",
    "--btn-primary-bg": "#323f52",
    "--btn-primary-hover": "#3e4f67",
    "--btn-primary-border": "#4b5f7a",
    "--main-tabs-bg": "#1b2027",
    "--main-tabs-bar-bg": "#4f617a",
    "--main-tabs-nav-bg": "#161b21",
    "--main-tabs-nav-border": "#2b3340",
    "--main-tabs-active-bg": "#27303b",
    "--tab-slider-label-color": "#b8cbe4",
    "--tab-slider-accent-color": "#5f7ea8",
    "--card-gradient-start": "rgba(33, 40, 50, 0.95)",
    "--card-gradient-end": "rgba(29, 35, 43, 0.95)",
    "--field-border-color": "#2a323e",
    "--field-block-bg": "#1a2028",
    "--select-option-bg": "#20262e",
    "--tag-primary-light-bg": "rgba(125, 140, 161, 0.2)",
    "--tag-primary-light-text": "#c8d4e7",
    "--button-hover-border": "#4a5563",
    "--button-hover-text": "#e2e8f2",
    "--button-primary-text": "#dde5f2",
    "--button-primary-hover-border": "#637a9a",
    "--button-warning-bg": "#3a3334",
    "--button-warning-border": "#54484a",
    "--button-warning-text": "#d6c7c7",
    "--button-text-color": "#aab7cb",
    "--button-text-hover-bg": "rgba(139, 154, 176, 0.12)",
    "--log-time-color": "#a8bdd8",
    "--log-info-color": "#8fa8c6",
    "--log-warn-color": "#c9b37a",
    "--log-error-color": "#c58a8a",
    "--log-success-color": "#8cb39d",
  },
  pink: {
    "--panel-bg": "#1f151f",
    "--panel-bg-soft": "#281b2a",
    "--input-bg": "#161016",
    "--border-color": "#54405a",
    "--accent-color": "#f7a9cf",
    "--text-main": "#f8e7f4",
    "--text-sub": "#cfacc6",
    "--log-bg": "#120d13",
    "--btn-bg": "#342537",
    "--btn-hover": "#422d45",
    "--btn-border": "#6a4b6e",
    "--btn-primary-bg": "#7e476b",
    "--btn-primary-hover": "#995786",
    "--btn-primary-border": "#b06799",
    "--main-tabs-bg": "#241927",
    "--main-tabs-bar-bg": "#a45d8d",
    "--main-tabs-nav-bg": "#1b131d",
    "--main-tabs-nav-border": "#4b3551",
    "--main-tabs-active-bg": "#3c2840",
    "--tab-slider-label-color": "#e9bddc",
    "--tab-slider-accent-color": "#cf79ad",
    "--card-gradient-start": "rgba(54, 34, 57, 0.95)",
    "--card-gradient-end": "rgba(41, 27, 44, 0.95)",
    "--field-border-color": "#4a3450",
    "--field-block-bg": "#261a28",
    "--select-option-bg": "#2a1f2d",
    "--tag-primary-light-bg": "rgba(209, 127, 173, 0.25)",
    "--tag-primary-light-text": "#ffd7ee",
    "--button-hover-border": "#7f5d84",
    "--button-hover-text": "#fff1fb",
    "--button-primary-text": "#fff2fb",
    "--button-primary-hover-border": "#cb7fb3",
    "--button-warning-bg": "#3d2f38",
    "--button-warning-border": "#695163",
    "--button-warning-text": "#f0dce8",
    "--button-text-color": "#e0bfd6",
    "--button-text-hover-bg": "rgba(223, 150, 196, 0.2)",
    "--log-time-color": "#f1bfdc",
    "--log-info-color": "#e6b5d3",
    "--log-warn-color": "#ebc683",
    "--log-error-color": "#f2a8b5",
    "--log-success-color": "#b7d8c8",
  },
  kittyPink: {
    "--panel-bg": "#211419",
    "--panel-bg-soft": "#2d1b22",
    "--input-bg": "#180f13",
    "--border-color": "#6a4553",
    "--accent-color": "#FF1493",
    "--text-main": "#ffebf2",
    "--text-sub": "#e3b8c6",
    "--log-bg": "#140c10",
    "--btn-bg": "#3b2430",
    "--btn-hover": "#4b2e3c",
    "--btn-border": "#87586b",
    "--btn-primary-bg": "#FF1493",
    "--btn-primary-hover": "#FF3EA8",
    "--btn-primary-border": "#FF66BB",
    "--main-tabs-bg": "#2a1a21",
    "--main-tabs-bar-bg": "#FF1493",
    "--main-tabs-nav-bg": "#1d1217",
    "--main-tabs-nav-border": "#6f4657",
    "--main-tabs-active-bg": "#5a203c",
    "--tab-slider-label-color": "#f4c6d7",
    "--tab-slider-accent-color": "#FF1493",
    "--card-gradient-start": "rgba(73, 43, 54, 0.95)",
    "--card-gradient-end": "rgba(53, 31, 40, 0.95)",
    "--field-border-color": "#764c5c",
    "--field-block-bg": "#2f1d25",
    "--select-option-bg": "#36222b",
    "--tag-primary-light-bg": "rgba(255, 20, 147, 0.28)",
    "--tag-primary-light-text": "#ffe6f1",
    "--button-hover-border": "#a56b80",
    "--button-hover-text": "#fff5f9",
    "--button-primary-text": "#fff8fc",
    "--button-primary-hover-border": "#FF93CE",
    "--button-warning-bg": "#473138",
    "--button-warning-border": "#7f5a66",
    "--button-warning-text": "#f5e1e8",
    "--button-text-color": "#f0bfd0",
    "--button-text-hover-bg": "rgba(255, 20, 147, 0.24)",
    "--log-time-color": "#ffb3d8",
    "--log-info-color": "#ffb9db",
    "--log-warn-color": "#f0cd8c",
    "--log-error-color": "#f7a8b7",
    "--log-success-color": "#badfcf",
  },
  emerald: {
    "--panel-bg": "#131d1a",
    "--panel-bg-soft": "#1a2824",
    "--input-bg": "#101714",
    "--border-color": "#34524a",
    "--accent-color": "#83d9ba",
    "--text-main": "#d7f0e7",
    "--text-sub": "#99c2b4",
    "--log-bg": "#0d1411",
    "--btn-bg": "#20312c",
    "--btn-hover": "#28413a",
    "--btn-border": "#3f6459",
    "--btn-primary-bg": "#2f6654",
    "--btn-primary-hover": "#3b8069",
    "--btn-primary-border": "#4d987f",
    "--main-tabs-bg": "#17231f",
    "--main-tabs-bar-bg": "#4f8a74",
    "--main-tabs-nav-bg": "#111915",
    "--main-tabs-nav-border": "#2c463d",
    "--main-tabs-active-bg": "#243831",
    "--tab-slider-label-color": "#b4ddce",
    "--tab-slider-accent-color": "#67b194",
    "--card-gradient-start": "rgba(31, 51, 45, 0.95)",
    "--card-gradient-end": "rgba(24, 40, 35, 0.95)",
    "--field-border-color": "#2d463e",
    "--field-block-bg": "#192620",
    "--select-option-bg": "#1f2d28",
    "--tag-primary-light-bg": "rgba(102, 183, 153, 0.24)",
    "--tag-primary-light-text": "#c9f2e3",
    "--button-hover-border": "#4b7b6c",
    "--button-hover-text": "#e4fbf2",
    "--button-primary-text": "#e6fff5",
    "--button-primary-hover-border": "#67b194",
    "--button-warning-bg": "#2f3531",
    "--button-warning-border": "#4f5b53",
    "--button-warning-text": "#d3ddd7",
    "--button-text-color": "#a8d0c1",
    "--button-text-hover-bg": "rgba(106, 182, 154, 0.18)",
    "--log-time-color": "#bde8d8",
    "--log-info-color": "#9fd2c0",
    "--log-warn-color": "#e0c27a",
    "--log-error-color": "#d49595",
    "--log-success-color": "#8fd0b7",
  },
  sunset: {
    "--panel-bg": "#211711",
    "--panel-bg-soft": "#2c211a",
    "--input-bg": "#18120e",
    "--border-color": "#60493e",
    "--accent-color": "#ffb182",
    "--text-main": "#f7e7d8",
    "--text-sub": "#cfae95",
    "--log-bg": "#14100d",
    "--btn-bg": "#392a22",
    "--btn-hover": "#4a362b",
    "--btn-border": "#715645",
    "--btn-primary-bg": "#865338",
    "--btn-primary-hover": "#a86847",
    "--btn-primary-border": "#c07a54",
    "--main-tabs-bg": "#281d16",
    "--main-tabs-bar-bg": "#bf7a50",
    "--main-tabs-nav-bg": "#1c1511",
    "--main-tabs-nav-border": "#533f33",
    "--main-tabs-active-bg": "#3f2d24",
    "--tab-slider-label-color": "#e7c4a8",
    "--tab-slider-accent-color": "#d78a5b",
    "--card-gradient-start": "rgba(59, 42, 33, 0.95)",
    "--card-gradient-end": "rgba(45, 31, 24, 0.95)",
    "--field-border-color": "#543f33",
    "--field-block-bg": "#261d17",
    "--select-option-bg": "#2d221b",
    "--tag-primary-light-bg": "rgba(214, 140, 90, 0.24)",
    "--tag-primary-light-text": "#ffd9be",
    "--button-hover-border": "#83634f",
    "--button-hover-text": "#fff0e2",
    "--button-primary-text": "#fff2e6",
    "--button-primary-hover-border": "#da8f5d",
    "--button-warning-bg": "#40342d",
    "--button-warning-border": "#6c5a4f",
    "--button-warning-text": "#f0ddd1",
    "--button-text-color": "#e4bea2",
    "--button-text-hover-bg": "rgba(216, 144, 96, 0.18)",
    "--log-time-color": "#f2c8a8",
    "--log-info-color": "#ddbd9f",
    "--log-warn-color": "#e7c67f",
    "--log-error-color": "#e3a19a",
    "--log-success-color": "#aacda8",
  },
  ocean: {
    "--panel-bg": "#111c21",
    "--panel-bg-soft": "#182730",
    "--input-bg": "#0f171b",
    "--border-color": "#38515d",
    "--accent-color": "#86d7f7",
    "--text-main": "#d9edf5",
    "--text-sub": "#9fbfcd",
    "--log-bg": "#0c1318",
    "--btn-bg": "#22353f",
    "--btn-hover": "#2c4350",
    "--btn-border": "#44616f",
    "--btn-primary-bg": "#2d6074",
    "--btn-primary-hover": "#397890",
    "--btn-primary-border": "#4b8ca8",
    "--main-tabs-bg": "#16232b",
    "--main-tabs-bar-bg": "#4d8098",
    "--main-tabs-nav-bg": "#121a20",
    "--main-tabs-nav-border": "#324753",
    "--main-tabs-active-bg": "#253843",
    "--tab-slider-label-color": "#b8dbe9",
    "--tab-slider-accent-color": "#66aac7",
    "--card-gradient-start": "rgba(34, 53, 64, 0.95)",
    "--card-gradient-end": "rgba(25, 40, 48, 0.95)",
    "--field-border-color": "#314955",
    "--field-block-bg": "#19262d",
    "--select-option-bg": "#1f313b",
    "--tag-primary-light-bg": "rgba(93, 160, 191, 0.25)",
    "--tag-primary-light-text": "#d0ecf8",
    "--button-hover-border": "#547787",
    "--button-hover-text": "#e8f7ff",
    "--button-primary-text": "#e6f6ff",
    "--button-primary-hover-border": "#66aac7",
    "--button-warning-bg": "#2f3539",
    "--button-warning-border": "#525f65",
    "--button-warning-text": "#d7dee1",
    "--button-text-color": "#b1d0de",
    "--button-text-hover-bg": "rgba(104, 167, 196, 0.18)",
    "--log-time-color": "#bfe2f0",
    "--log-info-color": "#a5ccdc",
    "--log-warn-color": "#e0c27c",
    "--log-error-color": "#cf9b9b",
    "--log-success-color": "#9ec8b8",
  },
};

const form = reactive({
  apiBaseUrl: DEFAULT_API_BASE_URL,
  prompt: "",
  size: "2K" as SizeOption,
  batchSize: 1,
  timeoutSeconds: 200,
  antiMode: 0 as AntiMode,
  apiKey: "",
  layerType: "rasterized" as LayerType,
  maxResolution: 1536,
});

const globalForm = reactive({
  prompt: "",
  size: "Auto" as SizeOption,
  batchSize: 1,
  timeoutSeconds: 120,
});

const promptCreateForm = reactive({
  name: "",
  content: "",
  description: "",
  category: "",
  tags: [] as string[],
});

const singlePromptQuickSaveForm = reactive({
  name: "",
  content: "",
  description: "",
  category: "",
  tags: [] as string[],
});

const promptQueryEditForm = reactive({
  name: "",
  content: "",
  description: "",
  category: "",
  tags: [] as string[],
});

const state = reactive({
  running: false,
  checkingQuota: false,
  addingBatchTask: false,
  batchRunning: false,
  runningGlobalPartition: false,
  logs: [] as LogEntry[],
  hostRunSingle: false,
  hostQuota: false,
  hostBatchCapture: false,
  hostAiChatCurrentSelectionImage: false,
  hostBatchRun: false,
  hostGlobalPartition: false,
  hostPromptCreate: false,
  hostPromptQuery: false,
  hostPromptDelete: false,
  hostPromptFavorite: false,
  hostApiKeyManage: false,
});

const activeTab = ref<ActiveTab>("single");
const previewImage = ref("");
const quotaInfo = ref<QuotaResult | null>(null);
const batchQueue = ref<BatchTaskItem[]>([]);
const managedApiKeys = ref<ManagedApiKeyItem[]>([]);
const singleApiKeyName = ref("");
const apiKeyManageSelected = ref("");
const apiKeyManageDraft = ref("");
const globalPartitionResult = ref<GlobalPartitionResult | null>(null);
const imagePreviewItems = ref<ImagePreviewItem[]>([]);
const imagePreviewInputRef = ref<HTMLInputElement | null>(null);
const imagePreviewCarouselRef = ref<HTMLDivElement | null>(null);
const mainInteractionFocusAnchorRef = ref<HTMLButtonElement | null>(null);
const imagePreviewActiveIndex = ref(0);
const promptCreateSaving = ref(false);
const singlePromptQuickSaveVisible = ref(false);
const promptQueryEditVisible = ref(false);
const promptQueryEditOriginName = ref("");
const startupNoticeVisible = ref(false);
const promptCreateStoragePath = ref("(未获取)");
const promptCreateTotal = ref(0);
const promptQueryNameKeyword = ref("");
const promptQueryTagKeyword = ref("");
const promptQueryFavoritesOnly = ref(false);
const promptQuerySourceType = ref<"" | "local" | "online">("");
const promptQueryLoading = ref(false);
const promptQueryDeletingName = ref("");
const promptQueryInitialized = ref(false);
const promptQueryItems = ref<PromptCreateQueryItem[]>([]);
const promptQueryDetailItem = ref<PromptCreateQueryItem | null>(null);
const promptLibraryForceSync = ref(false);
const promptLibraryRefreshLoading = ref(false);
const aiChatBaseUrl = ref<AiChatBaseUrl>(DEFAULT_AI_CHAT_BASE_URL);
const aiChatApiKeyName = ref("");
const aiChatApiKey = ref("");
const aiChatApiKeySaving = ref(false);
const aiChatModelLoading = ref(false);
const aiChatSelectedModel = ref("");
const aiChatModels = ref<AiModelItem[]>([]);
const aiChatLastFetchAt = ref("");
const aiChatLoadedApiKey = ref("");
const aiChatLoadedBaseUrl = ref<AiChatBaseUrl | "">("");
const aiChatSending = ref(false);
const aiChatUploadingCurrentImage = ref(false);
const aiChatInputText = ref("");
const aiChatPendingImages = ref<AiChatImageItem[]>([]);
const aiChatMessages = ref<AiChatMessageItem[]>([]);
const aiChatContextCount = ref(12);
const aiChatMaxTokens = ref(4096);
const aiChatSystemPrompt = ref("");
const aiChatTemperature = ref(0.7);
const aiChatTopP = ref(1);
const aiChatPresencePenalty = ref(0);
const aiChatFrequencyPenalty = ref(0);
const aiChatJsonModeEnabled = ref(false);
const aiChatLastAssistantJson = ref("");
const aiChatUploadInputRef = ref<HTMLInputElement | null>(null);
const aiChatAvatarInputRef = ref<HTMLInputElement | null>(null);
const aiChatUserAvatarDataUrl = ref("");
const aiChatMessagesRef = ref<HTMLDivElement | null>(null);
const logPanelHidden = ref(false);
const themePreset = ref<ThemePresetKey>("midnight");
const singleRunShortcut = ref(DEFAULT_SINGLE_RUN_SHORTCUT);
const customFeatureEnabled = ref(false);
let aiChatMessageIdSeed = 0;
let aiChatImageIdSeed = 0;
let imagePreviewIdSeed = 0;
const setImagePreviewInputRef = (el: HTMLInputElement | null) => {
  imagePreviewInputRef.value = el;
};
const setImagePreviewCarouselRef = (el: HTMLDivElement | null) => {
  imagePreviewCarouselRef.value = el;
};
const setAiChatUploadInputRef = (el: HTMLInputElement | null) => {
  aiChatUploadInputRef.value = el;
};
const setAiChatAvatarInputRef = (el: HTMLInputElement | null) => {
  aiChatAvatarInputRef.value = el;
};
const setAiChatMessagesRef = (el: HTMLDivElement | null) => {
  aiChatMessagesRef.value = el;
};
const imagePreviewResizeState = reactive({
  dragging: false,
  itemId: null as number | null,
  startY: 0,
  startHeight: 220,
});
const imagePreviewPanState = reactive({
  dragging: false,
  itemId: null as number | null,
  startX: 0,
  startY: 0,
  startOffsetX: 0,
  startOffsetY: 0,
  boxWidth: 0,
  boxHeight: 0,
});

const IMAGE_PREVIEW_MIN_ZOOM = 0.2;
const IMAGE_PREVIEW_MAX_ZOOM = 4;
const IMAGE_PREVIEW_WHEEL_STEP = 0.1;
const IMAGE_PREVIEW_MIN_HEIGHT = 140;
const PROMPT_QUERY_DETAIL_DOUBLE_CLICK_MS = 320;
const HOST_NAV_DEDUP_MS = 120;
const AI_CHAT_IMAGE_MAX_EDGE = 1600;
const AI_CHAT_IMAGE_TARGET_BYTES = 1.5 * 1024 * 1024;
const AI_CHAT_IMAGE_JPEG_QUALITY_STEPS = [0.86, 0.78, 0.7, 0.62];

const showImagePreviewTab = computed(
  () => DEFAULT_SHOW_IMAGE_PREVIEW_TAB || customFeatureEnabled.value,
);

const mainTabOrder = computed<ActiveTab[]>(() =>
    showImagePreviewTab.value
      ? SHOW_GUIDE_TAB
        ? ["single", "batch", "ai-chat", "prompt-query", "prompt-create", "image-preview", "guide", "settings"]
        : ["single", "batch", "ai-chat", "prompt-query", "prompt-create", "image-preview", "settings"]
      : SHOW_GUIDE_TAB
        ? ["single", "batch", "ai-chat", "prompt-query", "prompt-create", "guide", "settings"]
      : [...BASE_TAB_ORDER],
);

const activeTabIndex = computed<number>({
  get() {
    const index = mainTabOrder.value.indexOf(activeTab.value);
    return index >= 0 ? index : 0;
  },
  set(value: number) {
    const max = Math.max(mainTabOrder.value.length - 1, 0);
    const next = Math.max(0, Math.min(max, Math.floor(Number(value) || 0)));
    activeTab.value = mainTabOrder.value[next];
  },
});

const activeTabSliderLabel = computed(() => TAB_LABEL_MAP[activeTab.value] || activeTab.value);

const SHORTCUT_MODIFIERS: ShortcutModifier[] = ["ctrl", "alt", "shift", "meta"];
const SHORTCUT_MODIFIER_LABEL_MAP: Record<ShortcutModifier, string> = {
  ctrl: "Ctrl",
  alt: "Alt",
  shift: "Shift",
  meta: "Meta",
};
const SHORTCUT_KEY_ALIASES: Record<string, string> = {
  return: "enter",
  esc: "escape",
  spacebar: " ",
  space: " ",
};
const SHORTCUT_KEY_LABEL_MAP: Record<string, string> = {
  " ": "Space",
  enter: "Enter",
  escape: "Escape",
  tab: "Tab",
};

const normalizeShortcutKey = (value: unknown) => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "";
  return SHORTCUT_KEY_ALIASES[raw] || raw;
};

const parseShortcutDefinition = (value: unknown): ShortcutDefinition | null => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const tokens = raw
      .split("+")
      .map((item) => item.trim())
      .filter(Boolean);
  if (tokens.length === 0) return null;

  const config: ShortcutDefinition = {
    key: "",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
  };

  for (const token of tokens) {
    const normalized = normalizeShortcutKey(token);
    if (!normalized) continue;
    if (normalized === "ctrl") {
      config.ctrl = true;
      continue;
    }
    if (normalized === "alt") {
      config.alt = true;
      continue;
    }
    if (normalized === "shift") {
      config.shift = true;
      continue;
    }
    if (normalized === "meta") {
      config.meta = true;
      continue;
    }
    if (config.key) return null;
    config.key = normalized;
  }

  if (!config.key) return null;
  if (SHORTCUT_MODIFIERS.includes(config.key as ShortcutModifier)) return null;
  return config;
};

const formatShortcutDefinition = (config: ShortcutDefinition) => {
  const parts: string[] = [];
  for (const modifier of SHORTCUT_MODIFIERS) {
    if (config[modifier]) parts.push(SHORTCUT_MODIFIER_LABEL_MAP[modifier]);
  }
  const keyLabel =
      SHORTCUT_KEY_LABEL_MAP[config.key] || (config.key.length === 1 ? config.key.toUpperCase() : config.key);
  parts.push(keyLabel);
  return parts.join("+");
};

const normalizeKeyboardEventKey = (event: KeyboardEvent) => {
  const key = normalizeShortcutKey(event.key);
  if (key === "os" || key === "super") return "meta";
  return key;
};

const buildShortcutFromKeyboardEvent = (event: KeyboardEvent): ShortcutDefinition | null => {
  const key = normalizeKeyboardEventKey(event);
  if (!key) return null;
  if (SHORTCUT_MODIFIERS.includes(key as ShortcutModifier)) return null;
  return {
    key,
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
  };
};

const matchKeyboardEventWithShortcut = (event: KeyboardEvent, config: ShortcutDefinition) =>
    normalizeKeyboardEventKey(event) === config.key &&
    event.ctrlKey === config.ctrl &&
    event.altKey === config.alt &&
    event.shiftKey === config.shift &&
    event.metaKey === config.meta;

const getEffectiveSingleRunShortcut = () =>
    parseShortcutDefinition(singleRunShortcut.value) || parseShortcutDefinition(DEFAULT_SINGLE_RUN_SHORTCUT)!;

const captureSingleRunShortcut = (event: KeyboardEvent) => {
  if (event.repeat) return;
  if (event.isComposing) return;
  const shortcut = buildShortcutFromKeyboardEvent(event);
  if (!shortcut) return;
  if (!shortcut.ctrl && !shortcut.alt && !shortcut.shift && !shortcut.meta) {
    message.warning("快捷键至少包含一个修饰键（Ctrl/Alt/Shift/Meta）");
    return;
  }
  singleRunShortcut.value = formatShortcutDefinition(shortcut);
  scheduleSaveLocalState();
  message.success(`已设置快捷键：${singleRunShortcut.value}`);
};

const resetSingleRunShortcut = () => {
  singleRunShortcut.value = DEFAULT_SINGLE_RUN_SHORTCUT;
  scheduleSaveLocalState();
  message.success(`已恢复默认快捷键：${DEFAULT_SINGLE_RUN_SHORTCUT}`);
};

const resolveThemePresetKey = (value: unknown): ThemePresetKey =>
    typeof value === "string" && THEME_PRESET_LIST.includes(value as ThemePresetKey)
      ? (value as ThemePresetKey)
      : "midnight";

const applyThemePreset = (preset: ThemePresetKey) => {
  if (typeof document === "undefined") return;
  const tokens = THEME_PRESET_TOKENS[preset] || THEME_PRESET_TOKENS.midnight;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
};

applyThemePreset(themePreset.value);

const runDisabled = computed(
    () => state.running,
);

const quotaDisabled = computed(
    () => state.checkingQuota || !state.hostQuota,
);

const addBatchDisabled = computed(
    () => state.addingBatchTask || !state.hostBatchCapture || !form.prompt.trim(),
);

const runBatchDisabled = computed(
    () =>
        state.batchRunning ||
        !state.hostBatchRun ||
        batchQueue.value.length === 0 ||
        !form.apiKey.trim() ||
        !form.apiBaseUrl.trim(),
);

const runGlobalPartitionDisabled = computed(
    () =>
        state.runningGlobalPartition ||
        !state.hostGlobalPartition ||
        !globalForm.prompt.trim() ||
        !form.apiKey.trim() ||
        !form.apiBaseUrl.trim(),
);

const promptCreateSaveDisabled = computed(
    () => promptCreateSaving.value || !state.hostPromptCreate,
);

const promptQueryFilteredItems = computed(() => {
  const nameKeyword = promptQueryNameKeyword.value.trim().toLowerCase();
  const tagKeyword = promptQueryTagKeyword.value.trim().toLowerCase();
  const sourceType = promptQuerySourceType.value;
  return promptQueryItems.value.filter((item) => {
    const favoriteMatch = !promptQueryFavoritesOnly.value || Number(item.favorite) === 1;
    if (!favoriteMatch) return false;
    const sourceMatch =
      sourceType === "local"
        ? Number(item.type) === 1
        : sourceType === "online"
          ? Number(item.type) === 2
          : true;
    if (!sourceMatch) return false;
    const nameMatch = !nameKeyword || String(item.name ?? "").toLowerCase().includes(nameKeyword);
    const tagMatch =
        !tagKeyword ||
        (Array.isArray(item.tags) &&
            item.tags.some((tag) => String(tag ?? "").toLowerCase().includes(tagKeyword)));
    return nameMatch && tagMatch;
  });
});

const aiChatModelSelectOptions = computed(() =>
    aiChatModels.value.map((item) => ({
      label: item.ownedBy ? `${normalizeGeminiModelId(item.id)} (${item.ownedBy})` : normalizeGeminiModelId(item.id),
      value: item.id,
    })),
);

const openPromptQueryDetail = (item: PromptCreateQueryItem) => {
  promptQueryDetailItem.value = item;
};

const closePromptQueryDetail = () => {
  promptQueryDetailItem.value = null;
};

let promptQueryLastClickName = "";
let promptQueryLastClickAt = 0;

const handlePromptQueryItemClick = (item: PromptCreateQueryItem) => {
  const now = Date.now();
  const withinDoubleClickWindow =
    promptQueryLastClickName === item.name &&
    now - promptQueryLastClickAt <= PROMPT_QUERY_DETAIL_DOUBLE_CLICK_MS;

  promptQueryLastClickName = item.name;
  promptQueryLastClickAt = now;
  if (!withinDoubleClickWindow) return;

  promptQueryLastClickName = "";
  promptQueryLastClickAt = 0;
  openPromptQueryDetail(item);
};

const managedApiKeyValueMap = computed(
    () => new Map(managedApiKeys.value.map((item) => [item.name, item.value] as const)),
);

const apiKeyNameSelectOptions = computed(() =>
    managedApiKeys.value.map((item) => ({
      label: item.name,
      value: item.name,
    })),
);

const aiChatBaseUrlSelectOptions = AI_CHAT_BASE_URL_OPTIONS.map((value) => ({
  label: value,
  value,
}));

const aiChatApiKeyNameSelectOptions = computed(() =>
    managedApiKeys.value.map((item) => ({
      label: item.name,
      value: item.name,
    })),
);

const getAiChatSelectedManagedApiKey = () =>
    normalizeApiKeyValue(managedApiKeyValueMap.value.get(normalizeApiKeyValue(aiChatApiKeyName.value)));

const resolveAiChatRequestApiKey = (baseUrl: AiChatBaseUrl) =>
    baseUrl === AI_CHAT_AJIAI_BASE_URL
      ? getAiChatSelectedManagedApiKey()
      : normalizeApiKeyValue(aiChatApiKey.value);

const getAiChatMissingKeyMessage = (baseUrl: AiChatBaseUrl) =>
    baseUrl === AI_CHAT_AJIAI_BASE_URL
      ? "请先选择大香蕉Key名称"
      : "请先在设置中填写AI对话 Key";

let logId = 0;
let persistTimer: number | null = null;
let lastLocalMainTabKeyAt = 0;

const now = () =>
    new Date().toLocaleTimeString("zh-CN", {
      hour12: false,
    });

const pushLog = (message: string, level: LogLevel = "info") => {
  state.logs.unshift({
    id: ++logId,
    time: now(),
    level,
    message,
  });
  if (state.logs.length > 300) state.logs.pop();
};

const logTagged = (tag: string, message: string, level: LogLevel = "info") => {
  pushLog(`[${tag}] ${message}`, level);
};

const logErrorWithSolution = (message: string, solution?: string) => {
  logTagged("错误", message, "error");
  if (solution) logTagged("解决", solution, "warn");
};

const logErrorCode = (code: string, customMessage = "") => {
  const errorMap: Record<string, { message: string; solution?: string }> = {
    NO_API_KEY: {
      message: "API Key 未填写",
      solution: "请在 API Key 输入框中填入有效密钥",
    },
    NO_API_URL: {
      message: "API 地址未填写",
      solution: "请填写正确的 API 地址",
    },
    NO_PROMPT: {
      message: "提示词未填写",
      solution: "请先输入提示词内容",
    },
    HOST_NOT_SUPPORTED: {
      message: "当前宿主环境不支持该功能",
      solution: "请在 Photoshop 中运行，并确认插件已重新加载",
    },
    BATCH_EMPTY: {
      message: "批处理列表为空",
      solution: "请先在单图页添加任务",
    },
  };

  const info = errorMap[code];
  if (!info) {
    logErrorWithSolution(customMessage || code);
    return;
  }

  if (customMessage) {
    logErrorWithSolution(customMessage, info.solution);
    return;
  }

  logErrorWithSolution(info.message, info.solution);
};

const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

const normalizeAiModelItems = (payload: unknown): AiModelItem[] => {
  let rawItems: unknown[] = [];
  if (Array.isArray(payload)) {
    rawItems = payload;
  } else if (payload && typeof payload === "object") {
    const root = payload as Record<string, unknown>;
    if (Array.isArray(root.data)) rawItems = root.data;
    else if (Array.isArray(root.models)) rawItems = root.models;
    else if (Array.isArray(root.items)) rawItems = root.items;
    else if (root.data && typeof root.data === "object") {
      const data = root.data as Record<string, unknown>;
      if (Array.isArray(data.models)) rawItems = data.models;
      else if (Array.isArray(data.items)) rawItems = data.items;
      else if (Array.isArray(data.list)) rawItems = data.list;
    }
  }

  const next: AiModelItem[] = [];
  const seen = new Set<string>();
  for (const item of rawItems) {
    const row = item as Record<string, unknown>;
    const id = normalizeApiKeyValue(
        typeof item === "string"
          ? item
          : row?.id ?? row?.model ?? row?.model_name ?? row?.name,
    );
    if (!id || seen.has(id)) continue;
    const ownedBy = normalizeApiKeyValue(
        row?.owned_by ?? row?.ownedBy ?? row?.provider ?? row?.organization,
    );
    const createdNum = Number(row?.created);
    next.push({
      id,
      ownedBy,
      created: Number.isFinite(createdNum) ? Math.floor(createdNum) : null,
    });
    seen.add(id);
  }
  return next;
};

const clearAiChatModels = () => {
  aiChatModels.value = [];
  aiChatSelectedModel.value = "";
  aiChatLastFetchAt.value = "";
  aiChatLoadedApiKey.value = "";
  aiChatLoadedBaseUrl.value = "";
};

const aiChatJsonSaveSupported = computed(
    () => typeof (api as any).saveAiChatApiKey === "function",
);

const aiChatJsonReadSupported = computed(
    () => typeof (api as any).readAiChatApiKey === "function",
);

const uiThemePresetSaveSupported = computed(
    () => typeof (api as any).saveUiThemePreset === "function",
);

const uiThemePresetReadSupported = computed(
    () => typeof (api as any).readUiThemePreset === "function",
);

const saveThemePresetToJson = async (value: ThemePresetKey) => {
  if (!uiThemePresetSaveSupported.value) return;
  try {
    await (api as any).saveUiThemePreset({value});
  } catch (error) {
    const message = getErrorMessage(error);
    logTagged("设置", `保存主题到 JSON 失败: ${message}`, "warn");
  }
};

const loadThemePresetFromJson = async () => {
  if (!uiThemePresetReadSupported.value) return;
  try {
    const result = (await (api as any).readUiThemePreset()) as { value?: string };
    const raw = normalizeApiKeyValue(result?.value);
    if (!raw) return;
    if (!THEME_PRESET_LIST.includes(raw as ThemePresetKey)) return;
    const next = raw as ThemePresetKey;
    if (next === themePreset.value) return;
    themePreset.value = next;
    scheduleSaveLocalState();
    logTagged("设置", `已从 JSON 恢复主题：${THEME_PRESET_LABEL_MAP[next]}`, "info");
  } catch (error) {
    const message = getErrorMessage(error);
    logTagged("设置", `读取主题 JSON 失败: ${message}`, "warn");
  }
};

const loadAiChatApiKeyFromJson = async (options?: { silent?: boolean }) => {
  if (!aiChatJsonReadSupported.value) return;
  try {
    const result = (await (api as any).readAiChatApiKey()) as ReadAiChatApiKeyResult;
    const nextKey = normalizeApiKeyValue(result?.item?.value);
    const previousKey = normalizeApiKeyValue(aiChatApiKey.value);
    if (nextKey === previousKey) return;
    aiChatApiKey.value = nextKey;
    if (
      aiChatLoadedBaseUrl.value === AI_CHAT_COMFLY_BASE_URL &&
      aiChatLoadedApiKey.value !== nextKey
    ) {
      clearAiChatModels();
    }
  } catch (error) {
    if (options?.silent) return;
    const message = getErrorMessage(error);
    logTagged("设置", `读取AI对话 Key失败: ${message}`, "warn");
  }
};

const onSaveAiChatApiKeyClick = async (event?: Event) => {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  await saveAiChatApiKeyToJson();
};

const saveAiChatApiKeyToJson = async () => {
  const key = normalizeApiKeyValue(aiChatApiKey.value);
  if (!key) {
    message.warning("请先输入AI对话 Key");
    return;
  }
  if (!aiChatJsonSaveSupported.value) {
    message.error("AI对话 Key 的 JSON 存储接口未挂载");
    return;
  }
  if (aiChatApiKeySaving.value) return;

  aiChatApiKeySaving.value = true;
  try {
    const result = (await (api as any).saveAiChatApiKey({ value: key })) as ManagedApiKeySaveResult;
    scheduleSaveLocalState();
    if (normalizeAiChatBaseUrl(aiChatBaseUrl.value) === AI_CHAT_COMFLY_BASE_URL) {
      await loadAiChatModels({ silentIfNoKey: true });
    }
    const savedPath = normalizeApiKeyValue(result?.path);
    logTagged(
      "与AI对话",
      result?.created
        ? `AI对话 Key 已写入 JSON${savedPath ? `：${savedPath}` : ""}`
        : `AI对话 Key 已存在于 JSON${savedPath ? `：${savedPath}` : ""}`,
      "success",
    );
    message.success(result?.created ? "已保存到 JSON" : "JSON 中已存在该 Key");
  } catch (error) {
    const message = getErrorMessage(error);
    logTagged("与AI对话", `保存AI对话 Key 失败: ${message}`, "error");
    message.error(`保存失败: ${message}`);
  } finally {
    aiChatApiKeySaving.value = false;
  }
};

const pickPreferredAiChatModel = (items: AiModelItem[]) => {
  if (!Array.isArray(items) || items.length === 0) return "";
  const preferredPrefix = "gemini-3-pro-preview-thinking";
  const preferred = items.find((item) => normalizeGeminiModelId(item.id).startsWith(preferredPrefix));
  if (preferred) return preferred.id;
  return items[0].id;
};

const loadAiChatModels = async (options?: { silentIfNoKey?: boolean }) => {
  const baseUrl = normalizeAiChatBaseUrl(aiChatBaseUrl.value);
  const key = resolveAiChatRequestApiKey(baseUrl);
  if (!key) {
    if (!options?.silentIfNoKey) {
      message.warning(getAiChatMissingKeyMessage(baseUrl));
    }
    return;
  }

  aiChatModelLoading.value = true;
  try {
    const config = getAiChatApiConfig(baseUrl);
    const url = `${baseUrl}${config.models}`;
    const response = await withTimeout(
        fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${key}`,
          },
        }),
        12000,
        "模型列表查询",
    );

    if (!response.ok) {
      const bodyText = await response.text();
      const detail = bodyText ? ` ${bodyText.slice(0, 180)}` : "";
      throw new Error(`HTTP ${response.status}.${detail}`);
    }

    const payload = (await response.json()) as unknown;
    const models = normalizeAiModelItems(payload);
    aiChatModels.value = models;
    aiChatLoadedApiKey.value = key;
    aiChatLoadedBaseUrl.value = baseUrl;
    aiChatSelectedModel.value = pickPreferredAiChatModel(models);
    aiChatLastFetchAt.value = now();
    if (models.length === 0) {
      message.warning("接口返回成功，但未解析到模型列表");
      logTagged("与AI对话", "模型列表为空或格式不匹配", "warn");
      return;
    }

    message.success(`模型加载完成，共 ${models.length} 个`);
    logTagged("与AI对话", `模型列表加载成功，共 ${models.length} 个`, "success");
  } catch (error) {
    const message = getErrorMessage(error);
    message.error(`模型获取失败: ${message}`);
    logTagged("与AI对话", `模型获取失败: ${message}`, "error");
  } finally {
    aiChatModelLoading.value = false;
  }
};

const tryAutoLoadAiChatModels = async () => {
  const baseUrl = normalizeAiChatBaseUrl(aiChatBaseUrl.value);
  const key = resolveAiChatRequestApiKey(baseUrl);
  if (!key) return;
  if (aiChatModelLoading.value) return;
  if (aiChatLoadedApiKey.value === key && aiChatLoadedBaseUrl.value === baseUrl && aiChatModels.value.length > 0) {
    return;
  }
  await loadAiChatModels({silentIfNoKey: true});
};

const aiChatSendDisabled = computed(() => {
  const baseUrl = normalizeAiChatBaseUrl(aiChatBaseUrl.value);
  if (aiChatSending.value) return true;
  if (baseUrl === AI_CHAT_AJIAI_BASE_URL && !normalizeApiKeyValue(aiChatApiKeyName.value)) return true;
  if (!resolveAiChatRequestApiKey(baseUrl)) return true;
  if (!normalizeApiKeyValue(aiChatSelectedModel.value)) return true;
  const hasText = normalizeApiKeyValue(aiChatInputText.value).length > 0;
  const hasImages = aiChatPendingImages.value.length > 0;
  return !(hasText || hasImages);
});

const aiChatUseJsonDisabled = computed(() => {
  if (aiChatSending.value) return true;
  if (!aiChatJsonModeEnabled.value) return true;
  return !normalizeApiKeyValue(aiChatLastAssistantJson.value);
});

const escapeHtml = (text: string) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

const formatInlineMarkdown = (text: string) => {
  let next = text;
  next = next.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  next = next.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  next = next.replace(/`([^`]+)`/g, "<code>$1</code>");
  return next;
};

const renderMarkdownTextToHtml = (source: string) => {
  const escaped = escapeHtml(source).replace(/\r\n/g, "\n");
  const lines = escaped.split("\n");
  const htmlParts: string[] = [];
  let listMode: "" | "ul" | "ol" = "";

  const closeList = () => {
    if (!listMode) return;
    htmlParts.push(listMode === "ul" ? "</ul>" : "</ol>");
    listMode = "";
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      htmlParts.push(`<h${level}>${formatInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      if (listMode !== "ul") {
        closeList();
        htmlParts.push("<ul>");
        listMode = "ul";
      }
      htmlParts.push(`<li>${formatInlineMarkdown(unordered[1])}</li>`);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      if (listMode !== "ol") {
        closeList();
        htmlParts.push("<ol>");
        listMode = "ol";
      }
      htmlParts.push(`<li>${formatInlineMarkdown(ordered[1])}</li>`);
      continue;
    }

    closeList();
    htmlParts.push(`<p>${formatInlineMarkdown(line)}</p>`);
  }

  closeList();
  return htmlParts.join("");
};

const usageGuideHtml = computed(() => renderMarkdownTextToHtml(pluginGuideMarkdown));

const parseAiChatSegments = (text: string, messageId: number): AiChatMessageSegment[] => {
  const source = String(text ?? "").replace(/\r\n/g, "\n");
  if (!source.trim()) return [];
  const fencePattern = /```([^\n`]*)\n?([\s\S]*?)```/g;
  const segments: AiChatMessageSegment[] = [];
  let lastIndex = 0;
  let segmentIndex = 0;

  for (let match = fencePattern.exec(source); match; match = fencePattern.exec(source)) {
    const start = match.index;
    if (start > lastIndex) {
      const textPart = source.slice(lastIndex, start).trim();
      if (textPart) {
        segments.push({
          id: `${messageId}-text-${segmentIndex++}`,
          type: "text",
          html: renderMarkdownTextToHtml(textPart),
        });
      }
    }

    const language = String(match[1] || "").trim();
    const code = String(match[2] || "").replace(/\n$/, "");
    segments.push({
      id: `${messageId}-code-${segmentIndex++}`,
      type: "code",
      code,
      language,
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < source.length) {
    const tail = source.slice(lastIndex).trim();
    if (tail) {
      segments.push({
        id: `${messageId}-text-${segmentIndex++}`,
        type: "text",
        html: renderMarkdownTextToHtml(tail),
      });
    }
  }

  if (segments.length === 0) return [];
  return segments;
};

const copyText = async (text: string) => {
  const value = String(text ?? "");
  if (!value) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return Boolean(ok);
  } catch {
    return false;
  }
};

const handleAiChatCopyCode = async (code: string) => {
  const ok = await copyText(code);
  if (ok) message.success("代码已复制");
  else message.error("复制失败，请手动复制");
};

const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error(`读取文件失败: ${file.name}`));
      reader.readAsDataURL(file);
    });

const readDataUrlApproxBytes = (dataUrl: string) => {
  const source = String(dataUrl ?? "");
  const commaIndex = source.indexOf(",");
  if (commaIndex < 0) return 0;
  const base64 = source.slice(commaIndex + 1);
  if (!base64) return 0;
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
};

const loadImageFromDataUrl = (dataUrl: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("图片解析失败"));
      image.src = dataUrl;
    });

const compressAiChatImageDataUrl = async (
    dataUrl: string,
    options?: { maxEdge?: number; targetBytes?: number },
) => {
  const source = String(dataUrl ?? "").trim();
  if (!source.startsWith("data:image/")) {
    throw new Error("不支持的图片格式");
  }

  const image = await loadImageFromDataUrl(source);
  const originWidth = Math.max(1, Math.floor(image.naturalWidth || image.width || 1));
  const originHeight = Math.max(1, Math.floor(image.naturalHeight || image.height || 1));
  const maxEdge = Math.max(256, Math.floor(Number(options?.maxEdge) || AI_CHAT_IMAGE_MAX_EDGE));
  const targetBytes = Math.max(120 * 1024, Math.floor(Number(options?.targetBytes) || AI_CHAT_IMAGE_TARGET_BYTES));

  const ratio = Math.min(1, maxEdge / Math.max(originWidth, originHeight));
  const width = Math.max(1, Math.round(originWidth * ratio));
  const height = Math.max(1, Math.round(originHeight * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("无法创建图片压缩上下文");
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  let best = "";
  for (const quality of AI_CHAT_IMAGE_JPEG_QUALITY_STEPS) {
    const candidate = canvas.toDataURL("image/jpeg", quality);
    if (!best) best = candidate;
    const size = readDataUrlApproxBytes(candidate);
    if (size > 0 && size <= targetBytes) {
      best = candidate;
      break;
    }
    if (size > 0 && size < readDataUrlApproxBytes(best)) {
      best = candidate;
    }
  }
  return best || source;
};

const openAiChatAvatarPicker = () => {
  aiChatAvatarInputRef.value?.click();
};

const clearAiChatUserAvatar = () => {
  aiChatUserAvatarDataUrl.value = "";
};

const onAiChatAvatarChange = async (event: Event) => {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) return;
  input.value = "";

  if (!String(file.type || "").toLowerCase().startsWith("image/")) {
    message.warning("请选择图片文件作为头像");
    return;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    if (!dataUrl.startsWith("data:image/")) {
      message.error("头像格式不支持");
      return;
    }
    aiChatUserAvatarDataUrl.value = dataUrl;
    message.success("头像已更新");
  } catch (error) {
    message.error(getErrorMessage(error));
  }
};

const openAiChatImagePicker = () => {
  aiChatUploadInputRef.value?.click();
};

const uploadAiChatCurrentSelectionImage = async () => {
  if (aiChatUploadingCurrentImage.value) return;

  const captureCurrentSelection = (api as any).captureAiChatCurrentSelectionImage;
  if (typeof captureCurrentSelection !== "function") {
    message.error("宿主未挂载上传当前图片能力");
    return;
  }

  aiChatUploadingCurrentImage.value = true;
  try {
    const payload = (await captureCurrentSelection({
      maxResolution: form.maxResolution,
      antiTruncationMode: form.antiMode,
    })) as CaptureAiChatCurrentSelectionImageResult;
    const base64 = String(payload?.base64 ?? "").trim();
    if (!base64) {
      throw new Error("未获取到图片数据");
    }
    const mimeType = String(payload?.mimeType ?? "image/png").trim() || "image/png";
    const name = String(payload?.name ?? "").trim() || `ps-selection-${Date.now()}.png`;
    const compressedDataUrl = await compressAiChatImageDataUrl(
      `data:${mimeType};base64,${base64}`,
      { maxEdge: form.maxResolution },
    );
    aiChatPendingImages.value = [
      ...aiChatPendingImages.value,
      {
        id: ++aiChatImageIdSeed,
        name,
        dataUrl: compressedDataUrl,
      },
    ];
    message.success("已上传当前图片");
  } catch (error) {
    message.error(`上传当前图片失败: ${getErrorMessage(error)}`);
  } finally {
    aiChatUploadingCurrentImage.value = false;
  }
};

const removeAiChatPendingImage = (id: number) => {
  aiChatPendingImages.value = aiChatPendingImages.value.filter((item) => item.id !== id);
};

const onAiChatFilesChange = async (event: Event) => {
  const input = event.target as HTMLInputElement | null;
  if (!input?.files || input.files.length === 0) return;
  const files = Array.from(input.files);
  input.value = "";

  try {
    const nextItems: AiChatImageItem[] = [];
    for (const file of files) {
      if (!String(file.type || "").toLowerCase().startsWith("image/")) continue;
      const dataUrl = await readFileAsDataUrl(file);
      if (!dataUrl.startsWith("data:image/")) continue;
      const compressedDataUrl = await compressAiChatImageDataUrl(dataUrl, {
        maxEdge: form.maxResolution,
      });
      nextItems.push({
        id: ++aiChatImageIdSeed,
        name: file.name || `image-${aiChatImageIdSeed}`,
        dataUrl: compressedDataUrl,
      });
    }

    if (nextItems.length === 0) {
      message.warning("未检测到可用图片");
      return;
    }
    aiChatPendingImages.value = [...aiChatPendingImages.value, ...nextItems];
  } catch (error) {
    message.error(getErrorMessage(error));
  }
};

const normalizeAiResponseContent = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const chunks: string[] = [];
    for (const part of content) {
      if (typeof part === "string") {
        chunks.push(part);
        continue;
      }
      if (!part || typeof part !== "object") continue;
      const row = part as Record<string, unknown>;
      if (typeof row.text === "string") chunks.push(row.text);
      else if (typeof row.content === "string") chunks.push(row.content);
      else if (typeof row.value === "string") chunks.push(row.value);
    }
    return chunks.join("\n").trim();
  }
  if (content && typeof content === "object") {
    const row = content as Record<string, unknown>;
    if (typeof row.text === "string") return row.text;
    if (typeof row.content === "string") return row.content;
  }
  return "";
};

const extractGeminiCandidateText = (candidate: unknown): string => {
  if (!candidate || typeof candidate !== "object") return "";
  const row = candidate as Record<string, unknown>;
  const content = row.content as Record<string, unknown> | undefined;
  const parts = Array.isArray(content?.parts) ? content?.parts : [];
  const chunks: string[] = [];
  for (const part of parts) {
    if (!part || typeof part !== "object") continue;
    const item = part as Record<string, unknown>;
    if (typeof item.text === "string") {
      chunks.push(item.text);
    }
  }
  return chunks.join("\n").trim();
};

const extractAiAssistantText = (payload: unknown, protocol: AiChatProtocol): string => {
  if (!payload || typeof payload !== "object") return "";
  const root = payload as Record<string, unknown>;

  if (protocol === "gemini" && Array.isArray(root.candidates) && root.candidates.length > 0) {
    const fromGemini = extractGeminiCandidateText(root.candidates[0]);
    if (fromGemini) return fromGemini;
  }

  if (Array.isArray(root.choices) && root.choices.length > 0) {
    const first = root.choices[0] as Record<string, unknown>;
    const msg = first?.message as Record<string, unknown> | undefined;
    const fromMessage = normalizeAiResponseContent(msg?.content);
    if (fromMessage) return fromMessage;
    const fromDelta = normalizeAiResponseContent((first?.delta as Record<string, unknown> | undefined)?.content);
    if (fromDelta) return fromDelta;
    const fromText = normalizeAiResponseContent(first?.text);
    if (fromText) return fromText;
  }

  if (typeof root.output_text === "string") return root.output_text;
  if (typeof root.reply === "string") return root.reply;
  if (root.data && typeof root.data === "object") {
    const data = root.data as Record<string, unknown>;
    if (typeof data.content === "string") return data.content;
    if (typeof data.text === "string") return data.text;
  }
  return "";
};

const buildAiChatJsonModeRequestText = (text: string) => {
  const cleanText = String(text ?? "").trim();
  const prefix = AI_CHAT_JSON_MODE_ACTIVATION_TEXT.trim();
  if (!aiChatJsonModeEnabled.value || !prefix) return cleanText;
  return cleanText ? `${prefix}\n\n${cleanText}` : prefix;
};

const normalizeJsonCandidateText = (source: string): string | null => {
  const base = String(source ?? "").trim();
  if (!base) return null;
  const isJsonLike = (value: string) =>
      (value.startsWith("{") && value.endsWith("}")) ||
      (value.startsWith("[") && value.endsWith("]"));

  const candidates: string[] = [base];
  const firstObject = base.indexOf("{");
  const lastObject = base.lastIndexOf("}");
  if (firstObject >= 0 && lastObject > firstObject) {
    candidates.push(base.slice(firstObject, lastObject + 1).trim());
  }
  const firstArray = base.indexOf("[");
  const lastArray = base.lastIndexOf("]");
  if (firstArray >= 0 && lastArray > firstArray) {
    candidates.push(base.slice(firstArray, lastArray + 1).trim());
  }

  const jsonLikeFallbacks: string[] = [];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (isJsonLike(candidate)) jsonLikeFallbacks.push(candidate);
    try {
      return JSON.stringify(JSON.parse(candidate), null, 2);
    } catch {
      // ignore invalid JSON candidate
    }
  }
  return jsonLikeFallbacks[0] || null;
};

const extractAiChatJsonFromText = (text: string): string => {
  const source = String(text ?? "").trim();
  if (!source) return "";

  const blockPattern = /```(?:json)?\s*([\s\S]*?)```/gi;
  let blockMatch: RegExpExecArray | null = null;
  while ((blockMatch = blockPattern.exec(source)) !== null) {
    const parsed = normalizeJsonCandidateText(blockMatch[1] || "");
    if (parsed) return parsed;
  }

  return normalizeJsonCandidateText(source) || "";
};

const scrollAiChatToBottom = () => {
  window.setTimeout(() => {
    const node = aiChatMessagesRef.value;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, 0);
};

const createAiChatMessage = (params: {
  role: AiChatRole;
  text: string;
  requestText?: string;
  images?: AiChatImageItem[];
}): AiChatMessageItem => {
  const id = ++aiChatMessageIdSeed;
  const text = String(params.text ?? "").trim();
  const requestText = String(params.requestText ?? text).trim();
  return {
    id,
    role: params.role,
    text,
    requestText,
    images: Array.isArray(params.images) ? params.images : [],
    createdAt: Date.now(),
    segments: parseAiChatSegments(text, id),
  };
};

const formatAiChatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString("zh-CN", {hour12: false});

const clearAiChatConversation = () => {
  aiChatMessages.value = [];
  aiChatPendingImages.value = [];
  aiChatInputText.value = "";
  aiChatLastAssistantJson.value = "";
};

const clampAiChatParams = () => {
  const contextCount = Math.floor(Number(aiChatContextCount.value) || 12);
  aiChatContextCount.value = Math.min(30, Math.max(1, contextCount));

  const maxTokens = Math.floor(Number(aiChatMaxTokens.value) || 4096);
  aiChatMaxTokens.value = Math.min(32000, Math.max(1, maxTokens));

  const temperature = Number(aiChatTemperature.value);
  aiChatTemperature.value = Math.min(2, Math.max(0, Number.isFinite(temperature) ? temperature : 0.7));

  const topP = Number(aiChatTopP.value);
  aiChatTopP.value = Math.min(1, Math.max(0, Number.isFinite(topP) ? topP : 1));

  const presencePenalty = Number(aiChatPresencePenalty.value);
  aiChatPresencePenalty.value = Math.min(
    2,
    Math.max(-2, Number.isFinite(presencePenalty) ? presencePenalty : 0),
  );

  const frequencyPenalty = Number(aiChatFrequencyPenalty.value);
  aiChatFrequencyPenalty.value = Math.min(
    2,
    Math.max(-2, Number.isFinite(frequencyPenalty) ? frequencyPenalty : 0),
  );
};

const getAiChatUserRequestText = (item: AiChatMessageItem) => {
  if (aiChatJsonModeEnabled.value) {
    return String(item.requestText ?? item.text ?? "").trim();
  }
  return String(item.text ?? "").trim();
};

const getAiChatContextMessages = () =>
    aiChatMessages.value.slice(-Math.max(1, Math.floor(Number(aiChatContextCount.value) || 12)));

const buildAiChatOpenAiRequestMessages = () =>
    getAiChatContextMessages().map((item) => {
      if (item.role === "assistant") {
        return {
          role: "assistant",
          content: item.text,
        };
      }

      if (item.images.length > 0) {
        const content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail: "auto" } }> = [];
        const text = getAiChatUserRequestText(item) || "请结合这些图片进行分析。";
        content.push({type: "text", text});
        for (const image of item.images) {
          content.push({
            type: "image_url",
            image_url: {
              url: image.dataUrl,
              detail: "auto",
            },
          });
        }
        return {
          role: "user",
          content,
        };
      }

      return {
        role: "user",
        content: getAiChatUserRequestText(item),
      };
    });

const parseImageDataUrl = (value: string) => {
  const raw = String(value ?? "").trim();
  if (!raw.startsWith("data:")) return null;
  const match = raw.match(/^data:([^;,]+);base64,(.+)$/i);
  if (!match) return null;
  return {
    mimeType: match[1] || "image/png",
    data: match[2] || "",
  };
};

const buildAiChatGeminiRequestContents = () =>
    getAiChatContextMessages().map((item) => {
      if (item.role === "assistant") {
        return {
          role: "model",
          parts: [{ text: item.text }],
        };
      }

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      const text = getAiChatUserRequestText(item) || (item.images.length > 0 ? "请结合这些图片进行分析。" : "");
      if (text) {
        parts.push({ text });
      }
      if (item.images.length > 0) {
        for (const image of item.images) {
          const parsed = parseImageDataUrl(image.dataUrl);
          if (!parsed || !parsed.data) continue;
          parts.push({
            inlineData: {
              mimeType: parsed.mimeType,
              data: parsed.data,
            },
          });
        }
      }

      return {
        role: "user",
        parts: parts.length > 0 ? parts : [{ text: getAiChatUserRequestText(item) }],
      };
    });

const sendAiChatMessage = async () => {
  clampAiChatParams();
  const baseUrl = normalizeAiChatBaseUrl(aiChatBaseUrl.value);
  const key = resolveAiChatRequestApiKey(baseUrl);
  if (!key) {
    message.warning(getAiChatMissingKeyMessage(baseUrl));
    return;
  }
  if (aiChatModels.value.length === 0) {
    message.warning("请先加载模型列表");
    return;
  }
  if (aiChatLoadedBaseUrl.value !== baseUrl || aiChatLoadedApiKey.value !== key) {
    const keyLabel = baseUrl === AI_CHAT_AJIAI_BASE_URL ? "大香蕉Key" : "AI对话 Key";
    message.warning(`接口地址或${keyLabel}已变化，请重新加载模型列表`);
    return;
  }
  const model = normalizeApiKeyValue(aiChatSelectedModel.value);
  if (!model) {
    message.warning("请先选择模型");
    return;
  }

  const text = normalizeApiKeyValue(aiChatInputText.value);
  const requestText = buildAiChatJsonModeRequestText(text);
  const images = [...aiChatPendingImages.value];
  if (!text && images.length === 0) {
    message.warning("请输入文本或上传图片");
    return;
  }

  const userMessage = createAiChatMessage({
    role: "user",
    text,
    requestText,
    images,
  });
  aiChatMessages.value.push(userMessage);
  aiChatInputText.value = "";
  aiChatPendingImages.value = [];
  await nextTick();
  scrollAiChatToBottom();

  aiChatSending.value = true;
  try {
    const config = getAiChatApiConfig(baseUrl);
    const protocol = config.protocol as AiChatProtocol;
    const systemPrompt = normalizeApiKeyValue(aiChatSystemPrompt.value);
    let url = "";
    let body: Record<string, unknown> = {};

    if (protocol === "gemini") {
      const geminiModel = normalizeGeminiModelId(model);
      if (!geminiModel) {
        throw new Error("模型格式不正确，请重新选择模型");
      }
      const encodedModel = encodeURIComponent(geminiModel);
      url = `${baseUrl}${config.completions.replace("{model}", encodedModel)}`;
      body = {
        contents: buildAiChatGeminiRequestContents(),
        generationConfig: {
          responseModalities: ["TEXT"],
          maxOutputTokens: aiChatMaxTokens.value,
          temperature: aiChatTemperature.value,
          topP: aiChatTopP.value,
        },
      };
      if (systemPrompt) {
        body.systemInstruction = {
          parts: [{ text: systemPrompt }],
        };
      }
    } else {
      url = `${baseUrl}${config.completions}`;
      const messages = buildAiChatOpenAiRequestMessages();
      const requestMessages = systemPrompt
        ? [{role: "system", content: systemPrompt}, ...messages]
        : messages;
      body = {
        model,
        messages: requestMessages,
        stream: false,
        max_tokens: aiChatMaxTokens.value,
        temperature: aiChatTemperature.value,
        top_p: aiChatTopP.value,
        presence_penalty: aiChatPresencePenalty.value,
        frequency_penalty: aiChatFrequencyPenalty.value,
      };
    }

    const response = await withTimeout(
        fetch(url, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify(body),
        }),
        45000,
        "与AI对话",
    );

    if (!response.ok) {
      const bodyText = await response.text();
      const detail = bodyText ? ` ${bodyText.slice(0, 220)}` : "";
      throw new Error(`HTTP ${response.status}.${detail}`);
    }

    const payload = (await response.json()) as unknown;
    const assistantText = extractAiAssistantText(payload, protocol).trim();
    if (!assistantText) {
      throw new Error("未从响应中提取到文本内容");
    }
    aiChatLastAssistantJson.value = extractAiChatJsonFromText(assistantText);

    aiChatMessages.value.push(
        createAiChatMessage({
          role: "assistant",
          text: assistantText,
          images: [],
        }),
    );
    await nextTick();
    scrollAiChatToBottom();
  } catch (error) {
    const message = getErrorMessage(error);
    logTagged("与AI对话", `发送失败: ${message}`, "error");
    message.error(`发送失败: ${message}`);
  } finally {
    aiChatSending.value = false;
  }
};

const applyAiChatLastJsonToSinglePrompt = () => {
  if (!aiChatJsonModeEnabled.value) {
    message.warning("请先勾选转json");
    return;
  }
  const jsonText = normalizeApiKeyValue(aiChatLastAssistantJson.value);
  if (!jsonText) {
    message.warning("暂无可用 JSON，请先让 AI 返回 JSON 内容");
    return;
  }
  form.prompt = jsonText;
  activeTab.value = "single";
  scheduleSaveLocalState();
  logTagged("与AI对话", "已将返回 JSON 应用到单图处理提示词", "success");
  message.success("已写入主页面提示词");
};

const applyHostCapabilities = (result?: HostCapabilitiesResult | null) => {
  state.hostRunSingle = Boolean(result?.runSingleImage);
  state.hostQuota = Boolean(result?.getAiQuota);
  state.hostBatchCapture = Boolean(result?.captureBatchTask);
  state.hostAiChatCurrentSelectionImage = Boolean(result?.captureAiChatCurrentSelectionImage);
  state.hostBatchRun = Boolean(result?.runBatchTasks);
  state.hostGlobalPartition = Boolean(result?.runGlobalPartition);
  state.hostPromptCreate =
      Boolean(result?.savePromptCreateItem) &&
      (Boolean(result?.initPromptCreateStorage) || Boolean(result?.getPromptCreateStorageInfo));
  state.hostPromptQuery = Boolean(result?.listPromptCreateItems);
  state.hostPromptDelete = Boolean(result?.deletePromptCreateItem);
  state.hostPromptFavorite = Boolean(result?.togglePromptCreateFavorite);
  state.hostApiKeyManage =
      Boolean(result?.listManagedApiKeys) &&
      Boolean(result?.saveManagedApiKey) &&
      Boolean(result?.updateManagedApiKey) &&
      Boolean(result?.deleteManagedApiKey) &&
      Boolean(result?.clearManagedApiKeys);
};

const initHostCapabilities = async () => {
  try {
    const getCapabilities = (api as any).getHostCapabilities;
    if (typeof getCapabilities !== "function") {
      throw new Error("getHostCapabilities 未挂载");
    }

    let lastError: unknown = null;
    let result: HostCapabilitiesResult | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = (await withTimeout(
            Promise.resolve(getCapabilities()) as Promise<HostCapabilitiesResult>,
            4000,
            "宿主能力检测",
        )) as HostCapabilitiesResult;
        break;
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          await new Promise((resolve) => window.setTimeout(resolve, 250));
        }
      }
    }
    if (!result) throw lastError ?? new Error("宿主能力检测失败");

    applyHostCapabilities(result);
    logTagged(
        "系统",
        `宿主能力检测: hostName=${String(result?.hostName ?? "")}, hostApiAttached=${String(result?.hostApiAttached ?? false)}`,
        "info",
    );
  } catch (error) {
    applyHostCapabilities(null);
    logErrorWithSolution(
        `宿主能力初始化失败: ${getErrorMessage(error)}`,
        "请重载插件后重试；若打包后出现该问题，通常是 Webview 消息桥接未建立",
    );
  }
};

const getPromptStorageErrorMessage = (action: string, error: unknown) => {
  const raw = getErrorMessage(error).trim();
  const text = raw.toLowerCase();

  if (
    raw.includes("超时") ||
    text.includes("timeout")
  ) {
    return `${action}失败：本地存储接口响应超时（非网络问题），请重载插件后重试`;
  }
  if (
    raw.includes("网络") ||
    text.includes("network") ||
    text.includes("fetch")
  ) {
    return `${action}失败：本地存储接口异常（与网络无关），请重载插件后重试`;
  }
  if (
    raw.includes("未挂载") ||
    raw.includes("不支持") ||
    text.includes("not mounted") ||
    text.includes("not a function") ||
    text.includes("undefined")
  ) {
    return `${action}失败：本地存储接口未挂载，请重载插件`;
  }
  if (
    raw.includes("权限") ||
    raw.includes("存储") ||
    raw.includes("文件") ||
    text.includes("permission") ||
    text.includes("denied") ||
    text.includes("storage") ||
    text.includes("filesystem")
  ) {
    return `${action}失败：本地存储不可用或无权限，请检查存储权限`;
  }
  return `${action}失败：${raw || "未知错误"}`;
};

const withTimeout = async <T>(task: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timer: number | null = null;
  try {
    return (await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        timer = window.setTimeout(() => {
          reject(new Error(`${label}超时，请重试`));
        }, timeoutMs);
      }),
    ])) as T;
  } finally {
    if (timer !== null) {
      window.clearTimeout(timer);
    }
  }
};

const debugApiBaseUrl = (stage: string, value: unknown) => {
  if (!IS_DEV) return;
  const rendered =
      value === null ? "null" : value === undefined ? "undefined" : String(value);
  console.log(`[apiBaseUrl-debug] ${stage}`, {
    value,
    rendered,
    typeofValue: typeof value,
    tag: Object.prototype.toString.call(value),
  });
  logTagged("调试", `${stage} | type=${typeof value} | value=${rendered}`, "info");
};

const normalizeApiBaseUrl = (value: unknown, fallback = "") => {
  if (typeof value === "string") {
    const normalized = value.trim().replace(/\/+$/, "");
    return normalized || fallback;
  }
  if (value === null || value === undefined) return fallback;

  try {
    console.warn("normalizeApiBaseUrl received non-string value", value, typeof value);
    const normalized = String(value).trim().replace(/\/+$/, "");
    return normalized || fallback;
  } catch {
    return fallback;
  }
};

const normalizeAiChatBaseUrl = (value: unknown): AiChatBaseUrl => {
  const normalized = normalizeApiBaseUrl(value, DEFAULT_AI_CHAT_BASE_URL) as AiChatBaseUrl;
  if (AI_CHAT_BASE_URL_OPTIONS.includes(normalized)) return normalized;
  return DEFAULT_AI_CHAT_BASE_URL;
};

const getAiChatApiConfig = (baseUrl: AiChatBaseUrl) =>
    AI_CHAT_PATHS[baseUrl] || AI_CHAT_PATHS[DEFAULT_AI_CHAT_BASE_URL];

const normalizeGeminiModelId = (value: string) => String(value ?? "").replace(/^models\//i, "").trim();

const clampRuntimeValues = () => {
  const rawBatchSize = form.batchSize;
  if (rawBatchSize !== "" && rawBatchSize !== null && rawBatchSize !== undefined) {
    const parsedBatchSize = Number(rawBatchSize);
    if (Number.isFinite(parsedBatchSize)) {
      form.batchSize = Math.min(5, Math.max(1, Math.floor(parsedBatchSize)));
    }
  }

  const rawTimeoutSeconds = form.timeoutSeconds;
  if (rawTimeoutSeconds !== "" && rawTimeoutSeconds !== null && rawTimeoutSeconds !== undefined) {
    const parsedTimeoutSeconds = Number(rawTimeoutSeconds);
    if (Number.isFinite(parsedTimeoutSeconds)) {
      form.timeoutSeconds = Math.max(5, Math.floor(parsedTimeoutSeconds));
    }
  }

  form.maxResolution = Math.min(
      4096,
      Math.max(512, Math.floor(Number(form.maxResolution) || 1536)),
  );
};

const clampGlobalRuntimeValues = () => {
  globalForm.batchSize = Math.min(5, Math.max(1, Math.floor(Number(globalForm.batchSize) || 1)));
  globalForm.timeoutSeconds = Math.max(5, Math.floor(Number(globalForm.timeoutSeconds) || 120));
};

let storageUnsupported = false;

const getLocalStorageSafe = (): Storage | null => {
  if (storageUnsupported) return null;
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    storageUnsupported = true;
    return null;
  }
};

const readLocalStorage = (key: string): string | null => {
  const storage = getLocalStorageSafe();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    storageUnsupported = true;
    return null;
  }
};

const writeLocalStorage = (key: string, value: string) => {
  const storage = getLocalStorageSafe();
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    storageUnsupported = true;
    return false;
  }
};

const removeLocalStorage = (key: string) => {
  const storage = getLocalStorageSafe();
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    storageUnsupported = true;
    return false;
  }
};

const migrateSingleDefaultsIfNeeded = () => {
  if (readLocalStorage(STORAGE_KEYS.singleDefaultsMigration) === "1") return;
  removeLocalStorage(STORAGE_KEYS.size);
  removeLocalStorage(STORAGE_KEYS.batchSize);
  removeLocalStorage(STORAGE_KEYS.timeoutSeconds);
  writeLocalStorage(STORAGE_KEYS.singleDefaultsMigration, "1");
};

const saveLocalState = () => {
  clampRuntimeValues();
  clampGlobalRuntimeValues();
  clampAiChatParams();
  debugApiBaseUrl("saveLocalState.beforeNormalize", form.apiBaseUrl);
  form.apiBaseUrl = normalizeApiBaseUrl(form.apiBaseUrl, DEFAULT_API_BASE_URL);
  debugApiBaseUrl("saveLocalState.afterNormalize", form.apiBaseUrl);

  writeLocalStorage(STORAGE_KEYS.selectedApiKeyName, singleApiKeyName.value);
  writeLocalStorage(STORAGE_KEYS.promptQueryFavoritesOnly, promptQueryFavoritesOnly.value ? "1" : "0");
  writeLocalStorage(STORAGE_KEYS.promptQuerySourceType, promptQuerySourceType.value);
  writeLocalStorage(STORAGE_KEYS.customFeatureEnabled, customFeatureEnabled.value ? "1" : "0");
  writeLocalStorage(STORAGE_KEYS.themePreset, themePreset.value);
  writeLocalStorage(STORAGE_KEYS.singleRunShortcut, singleRunShortcut.value);
  writeLocalStorage(STORAGE_KEYS.apiBaseUrl, form.apiBaseUrl);
  writeLocalStorage(STORAGE_KEYS.prompt, form.prompt);
  writeLocalStorage(STORAGE_KEYS.size, form.size);
  writeLocalStorage(STORAGE_KEYS.batchSize, String(form.batchSize));
  writeLocalStorage(STORAGE_KEYS.timeoutSeconds, String(form.timeoutSeconds));
  writeLocalStorage(STORAGE_KEYS.antiMode, String(form.antiMode));
  writeLocalStorage(STORAGE_KEYS.layerType, form.layerType);
  writeLocalStorage(STORAGE_KEYS.maxResolution, String(form.maxResolution));
  writeLocalStorage(STORAGE_KEYS.globalPrompt, globalForm.prompt);
  writeLocalStorage(STORAGE_KEYS.globalSize, globalForm.size);
  writeLocalStorage(STORAGE_KEYS.globalBatchSize, String(globalForm.batchSize));
  writeLocalStorage(STORAGE_KEYS.globalTimeoutSeconds, String(globalForm.timeoutSeconds));
  writeLocalStorage(STORAGE_KEYS.promptLibraryForceSync, promptLibraryForceSync.value ? "1" : "0");
  writeLocalStorage(STORAGE_KEYS.aiChatBaseUrl, aiChatBaseUrl.value);
  writeLocalStorage(STORAGE_KEYS.aiChatApiKeyName, aiChatApiKeyName.value);
  writeLocalStorage(STORAGE_KEYS.aiChatApiKey, aiChatApiKey.value);
  writeLocalStorage(STORAGE_KEYS.aiChatUserAvatar, aiChatUserAvatarDataUrl.value);
  writeLocalStorage(STORAGE_KEYS.aiChatContextCount, String(aiChatContextCount.value));
  writeLocalStorage(STORAGE_KEYS.aiChatMaxTokens, String(aiChatMaxTokens.value));
  writeLocalStorage(STORAGE_KEYS.aiChatSystemPrompt, aiChatSystemPrompt.value);
  writeLocalStorage(STORAGE_KEYS.aiChatTemperature, String(aiChatTemperature.value));
  writeLocalStorage(STORAGE_KEYS.aiChatTopP, String(aiChatTopP.value));
  writeLocalStorage(STORAGE_KEYS.aiChatPresencePenalty, String(aiChatPresencePenalty.value));
  writeLocalStorage(STORAGE_KEYS.aiChatFrequencyPenalty, String(aiChatFrequencyPenalty.value));
  writeLocalStorage(STORAGE_KEYS.aiChatJsonModeEnabled, aiChatJsonModeEnabled.value ? "1" : "0");
};

const scheduleSaveLocalState = () => {
  if (persistTimer) window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    safeSaveLocalState();
    persistTimer = null;
  }, 350);
};

const safeSaveLocalState = () => {
  try {
    saveLocalState();
    return true;
  } catch {
    return false;
  }
};

const loadLocalState = () => {
  migrateSingleDefaultsIfNeeded();

  const storedApiKeyName = readLocalStorage(STORAGE_KEYS.selectedApiKeyName);
  const storedPromptQueryFavoritesOnly = readLocalStorage(STORAGE_KEYS.promptQueryFavoritesOnly);
  const storedPromptQuerySourceType = readLocalStorage(STORAGE_KEYS.promptQuerySourceType);
  const storedCustomFeatureEnabled = readLocalStorage(STORAGE_KEYS.customFeatureEnabled);
  const storedLegacyImagePreviewFeatureUnlocked = readLocalStorage(LEGACY_STORAGE_KEYS.imagePreviewFeatureUnlocked);
  const storedThemePreset = readLocalStorage(STORAGE_KEYS.themePreset);
  const storedSingleRunShortcut = readLocalStorage(STORAGE_KEYS.singleRunShortcut);
  const storedApiBaseUrl = readLocalStorage(STORAGE_KEYS.apiBaseUrl);
  const storedPrompt = readLocalStorage(STORAGE_KEYS.prompt);
  const storedSize = readLocalStorage(STORAGE_KEYS.size) as SizeOption | null;
  const storedBatchSize = Number(readLocalStorage(STORAGE_KEYS.batchSize));
  const storedTimeout = Number(readLocalStorage(STORAGE_KEYS.timeoutSeconds));
  const storedAntiMode = Number(readLocalStorage(STORAGE_KEYS.antiMode));
  const storedLayerType = readLocalStorage(STORAGE_KEYS.layerType) as LayerType | null;
  const storedMaxResolution = Number(readLocalStorage(STORAGE_KEYS.maxResolution));
  const storedGlobalPrompt = readLocalStorage(STORAGE_KEYS.globalPrompt);
  const storedGlobalSize = readLocalStorage(STORAGE_KEYS.globalSize) as SizeOption | null;
  const storedGlobalBatchSize = Number(readLocalStorage(STORAGE_KEYS.globalBatchSize));
  const storedGlobalTimeout = Number(readLocalStorage(STORAGE_KEYS.globalTimeoutSeconds));
  const storedPromptLibraryForceSync = readLocalStorage(STORAGE_KEYS.promptLibraryForceSync);
  const storedAiChatBaseUrl = readLocalStorage(STORAGE_KEYS.aiChatBaseUrl);
  const storedAiChatApiKeyName = readLocalStorage(STORAGE_KEYS.aiChatApiKeyName);
  const storedAiChatApiKey = readLocalStorage(STORAGE_KEYS.aiChatApiKey);
  const storedAiChatUserAvatar = readLocalStorage(STORAGE_KEYS.aiChatUserAvatar);
  const storedAiChatContextCount = Number(readLocalStorage(STORAGE_KEYS.aiChatContextCount));
  const storedAiChatMaxTokens = Number(readLocalStorage(STORAGE_KEYS.aiChatMaxTokens));
  const storedAiChatSystemPrompt = readLocalStorage(STORAGE_KEYS.aiChatSystemPrompt);
  const storedAiChatTemperature = Number(readLocalStorage(STORAGE_KEYS.aiChatTemperature));
  const storedAiChatTopP = Number(readLocalStorage(STORAGE_KEYS.aiChatTopP));
  const storedAiChatPresencePenalty = Number(readLocalStorage(STORAGE_KEYS.aiChatPresencePenalty));
  const storedAiChatFrequencyPenalty = Number(readLocalStorage(STORAGE_KEYS.aiChatFrequencyPenalty));
  const storedAiChatJsonModeEnabled = readLocalStorage(STORAGE_KEYS.aiChatJsonModeEnabled);

  if (storedApiKeyName) singleApiKeyName.value = storedApiKeyName;
  promptQueryFavoritesOnly.value = storedPromptQueryFavoritesOnly === "1";
  promptQuerySourceType.value =
    storedPromptQuerySourceType === "local" || storedPromptQuerySourceType === "online"
      ? storedPromptQuerySourceType
      : "";
  customFeatureEnabled.value =
    storedCustomFeatureEnabled === "1" || storedLegacyImagePreviewFeatureUnlocked === "1";
  themePreset.value = resolveThemePresetKey(storedThemePreset);
  if (storedSingleRunShortcut) {
    const parsedShortcut = parseShortcutDefinition(storedSingleRunShortcut);
    if (parsedShortcut) {
      singleRunShortcut.value = formatShortcutDefinition(parsedShortcut);
    }
  }
  if (storedApiBaseUrl) form.apiBaseUrl = storedApiBaseUrl;
  if (storedPrompt) form.prompt = storedPrompt;
  if (storedSize && ["Auto", "1K", "2K", "4K"].includes(storedSize)) form.size = storedSize;
  if (Number.isFinite(storedBatchSize) && storedBatchSize >= 1) {
    form.batchSize = Math.min(5, Math.floor(storedBatchSize));
  }
  if (Number.isFinite(storedTimeout) && storedTimeout >= 5) {
    form.timeoutSeconds = Math.floor(storedTimeout);
  }
  if ([0, 1, 2].includes(storedAntiMode)) form.antiMode = storedAntiMode as AntiMode;
  if (storedLayerType && ["rasterized", "smartObject"].includes(storedLayerType)) {
    form.layerType = storedLayerType;
  }
  if (Number.isFinite(storedMaxResolution) && storedMaxResolution >= 512) {
    form.maxResolution = Math.min(4096, Math.floor(storedMaxResolution));
  }
  if (storedGlobalPrompt) globalForm.prompt = storedGlobalPrompt;
  if (storedGlobalSize && ["Auto", "1K", "2K", "4K"].includes(storedGlobalSize)) {
    globalForm.size = storedGlobalSize;
  }
  if (Number.isFinite(storedGlobalBatchSize) && storedGlobalBatchSize >= 1) {
    globalForm.batchSize = Math.min(5, Math.floor(storedGlobalBatchSize));
  }
  if (Number.isFinite(storedGlobalTimeout) && storedGlobalTimeout >= 5) {
    globalForm.timeoutSeconds = Math.floor(storedGlobalTimeout);
  }
  promptLibraryForceSync.value = storedPromptLibraryForceSync === "1";
  aiChatBaseUrl.value = normalizeAiChatBaseUrl(storedAiChatBaseUrl);
  if (storedAiChatApiKeyName) aiChatApiKeyName.value = storedAiChatApiKeyName;
  if (storedAiChatApiKey) aiChatApiKey.value = storedAiChatApiKey;
  if (storedAiChatUserAvatar && storedAiChatUserAvatar.startsWith("data:image/")) {
    aiChatUserAvatarDataUrl.value = storedAiChatUserAvatar;
  }
  if (Number.isFinite(storedAiChatContextCount)) aiChatContextCount.value = storedAiChatContextCount;
  if (Number.isFinite(storedAiChatMaxTokens)) aiChatMaxTokens.value = storedAiChatMaxTokens;
  if (storedAiChatSystemPrompt) aiChatSystemPrompt.value = storedAiChatSystemPrompt;
  if (Number.isFinite(storedAiChatTemperature)) aiChatTemperature.value = storedAiChatTemperature;
  if (Number.isFinite(storedAiChatTopP)) aiChatTopP.value = storedAiChatTopP;
  if (Number.isFinite(storedAiChatPresencePenalty)) aiChatPresencePenalty.value = storedAiChatPresencePenalty;
  if (Number.isFinite(storedAiChatFrequencyPenalty)) aiChatFrequencyPenalty.value = storedAiChatFrequencyPenalty;
  aiChatJsonModeEnabled.value = storedAiChatJsonModeEnabled === "1";

  clampRuntimeValues();
  clampGlobalRuntimeValues();
  clampAiChatParams();
  debugApiBaseUrl("loadLocalState.beforeNormalize", form.apiBaseUrl);
  form.apiBaseUrl = normalizeApiBaseUrl(form.apiBaseUrl, DEFAULT_API_BASE_URL);
  debugApiBaseUrl("loadLocalState.afterNormalize", form.apiBaseUrl);
};

const readStartupNoticeConfirmedFromHost = async (): Promise<boolean | null> => {
  const readFn = (api as any).readStartupNoticeConfirmed;
  if (typeof readFn !== "function") return null;
  try {
    const result = (await readFn()) as { value?: 0 | 1 | boolean | string };
    return Number(result?.value) === 1 || String(result?.value ?? "").trim() === "true";
  } catch {
    return null;
  }
};

const saveStartupNoticeConfirmedToHost = async (confirmed: boolean) => {
  const saveFn = (api as any).saveStartupNoticeConfirmed;
  if (typeof saveFn !== "function") return;
  try {
    await saveFn({ value: confirmed ? 1 : 0 });
  } catch {
    // no-op
  }
};

const readCustomFeatureEnabledFromHost = async (): Promise<boolean | null> => {
  const readFn = (api as any).readCustomFeatureEnabled;
  if (typeof readFn !== "function") return null;
  try {
    const result = (await readFn()) as { value?: 0 | 1 | boolean | string };
    return Number(result?.value) === 1 || String(result?.value ?? "").trim() === "true";
  } catch {
    return null;
  }
};

const saveCustomFeatureEnabledToHost = async (enabled: boolean) => {
  const saveFn = (api as any).saveCustomFeatureEnabled;
  if (typeof saveFn !== "function") return;
  try {
    await saveFn({ value: enabled ? 1 : 0 });
  } catch {
    // no-op
  }
};

const syncCustomFeatureEnabledFromHost = async () => {
  const hostEnabled = await readCustomFeatureEnabledFromHost();
  if (hostEnabled === null) return;

  if (hostEnabled) {
    customFeatureEnabled.value = true;
    writeLocalStorage(STORAGE_KEYS.customFeatureEnabled, "1");
    return;
  }
  if (customFeatureEnabled.value) {
    // Migrate old local flag to host JSON.
    await saveCustomFeatureEnabledToHost(true);
  }
};

const openStartupNoticeIfNeeded = async () => {
  const hostConfirmed = await readStartupNoticeConfirmedFromHost();
  if (hostConfirmed !== null) {
    startupNoticeVisible.value = !hostConfirmed;
    return;
  }
  const confirmed = readLocalStorage(STORAGE_KEYS.startupNoticeConfirmed);
  startupNoticeVisible.value = confirmed !== "1";
};

const confirmStartupNotice = async () => {
  writeLocalStorage(STORAGE_KEYS.startupNoticeConfirmed, "1");
  await saveStartupNoticeConfirmedToHost(true);
  startupNoticeVisible.value = false;
};

const normalizeApiKeyValue = (value: unknown) => String(value ?? "").trim();

const applyManagedApiKeys = (items: ManagedApiKeyItem[]) => {
  managedApiKeys.value = Array.isArray(items) ? items : [];
  const existsSelected = managedApiKeys.value.some((item) => item.name === singleApiKeyName.value);
  if (!existsSelected) {
    singleApiKeyName.value = "";
  }
  const existsManageSelected = managedApiKeys.value.some((item) => item.name === apiKeyManageSelected.value);
  if (!existsManageSelected) {
    apiKeyManageSelected.value = "";
  }
  const existsAiChatSelected = managedApiKeys.value.some((item) => item.name === aiChatApiKeyName.value);
  if (!existsAiChatSelected) {
    aiChatApiKeyName.value = "";
  }
};

const readLegacyApiKeyValues = () => {
  const values: string[] = [];
  const rawList = readLocalStorage(LEGACY_STORAGE_KEYS.savedApiKeys);
  if (rawList) {
    try {
      const parsed = JSON.parse(rawList);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const val = normalizeApiKeyValue(item);
          if (val) values.push(val);
        }
      }
    } catch {
      // no-op
    }
  }
  const rawSingle = normalizeApiKeyValue(readLocalStorage(LEGACY_STORAGE_KEYS.savedApiKey));
  if (rawSingle) values.push(rawSingle);
  return Array.from(new Set(values));
};

const migrateLegacyApiKeysToStore = async () => {
  if (!state.hostApiKeyManage || typeof (api as any).saveManagedApiKey !== "function") return false;
  const legacyValues = readLegacyApiKeyValues();
  if (legacyValues.length === 0) return false;
  for (const value of legacyValues) {
    try {
      await (api as any).saveManagedApiKey({ value });
    } catch {
      // continue migration for remaining keys
    }
  }
  removeLocalStorage(LEGACY_STORAGE_KEYS.savedApiKey);
  removeLocalStorage(LEGACY_STORAGE_KEYS.savedApiKeys);
  return true;
};

const loadManagedApiKeys = async () => {
  if (!state.hostApiKeyManage || typeof (api as any).listManagedApiKeys !== "function") {
    applyManagedApiKeys([]);
    form.apiKey = "";
    return;
  }
  const result = (await (api as any).listManagedApiKeys()) as ManagedApiKeyListResult;
  applyManagedApiKeys(Array.isArray(result?.items) ? result.items : []);
  if (managedApiKeys.value.length === 0) {
    const migrated = await migrateLegacyApiKeysToStore();
    if (migrated) {
      const migratedResult = (await (api as any).listManagedApiKeys()) as ManagedApiKeyListResult;
      applyManagedApiKeys(Array.isArray(migratedResult?.items) ? migratedResult.items : []);
    }
  }

  const preferredName =
      normalizeApiKeyValue(singleApiKeyName.value) ||
      normalizeApiKeyValue(readLocalStorage(STORAGE_KEYS.selectedApiKeyName));
  if (preferredName && managedApiKeyValueMap.value.has(preferredName)) {
    singleApiKeyName.value = preferredName;
  } else if (!singleApiKeyName.value && managedApiKeys.value.length > 0) {
    singleApiKeyName.value = managedApiKeys.value[0].name;
  }

  const preferredAiChatName = normalizeApiKeyValue(aiChatApiKeyName.value);
  if (preferredAiChatName && managedApiKeyValueMap.value.has(preferredAiChatName)) {
    aiChatApiKeyName.value = preferredAiChatName;
  } else if (singleApiKeyName.value && managedApiKeyValueMap.value.has(singleApiKeyName.value)) {
    aiChatApiKeyName.value = singleApiKeyName.value;
  } else if (managedApiKeys.value.length > 0) {
    aiChatApiKeyName.value = managedApiKeys.value[0].name;
  }

  const selectedValue = managedApiKeyValueMap.value.get(singleApiKeyName.value) || "";
  form.apiKey = selectedValue;
};

const clearSavedApiKeys = async () => {
  if (!state.hostApiKeyManage || typeof (api as any).clearManagedApiKeys !== "function") {
    message.error("大香蕉Key管理接口未挂载");
    return;
  }
  await (api as any).clearManagedApiKeys();
  await loadManagedApiKeys();
  apiKeyManageDraft.value = "";
  apiKeyManageSelected.value = "";
  singleApiKeyName.value = "";
  aiChatApiKeyName.value = "";
  form.apiKey = "";
  clearAiChatModels();
  scheduleSaveLocalState();
  logTagged("设置", "已清空大香蕉Key列表", "info");
  message.success("已清空已保存大香蕉Key");
};

const createManagedApiKey = async () => {
  const key = normalizeApiKeyValue(apiKeyManageDraft.value);
  if (!key) {
    message.warning("请先输入要新增的大香蕉Key");
    return;
  }
  if (!state.hostApiKeyManage || typeof (api as any).saveManagedApiKey !== "function") {
    message.error("大香蕉Key管理接口未挂载");
    return;
  }

  const result = (await (api as any).saveManagedApiKey({ value: key })) as ManagedApiKeySaveResult;
  await loadManagedApiKeys();
  apiKeyManageSelected.value = result?.item?.name || "";
  singleApiKeyName.value = result?.item?.name || singleApiKeyName.value;
  aiChatApiKeyName.value = result?.item?.name || aiChatApiKeyName.value;
  form.apiKey = result?.item?.value || form.apiKey;
  apiKeyManageDraft.value = result?.item?.value || key;
  scheduleSaveLocalState();
  logTagged("设置", `已新增大香蕉Key名称：${result?.item?.name ?? ""}`, "success");
  message.success("大香蕉Key新增成功");
};

const updateManagedApiKey = async () => {
  const selectedName = normalizeApiKeyValue(apiKeyManageSelected.value);
  const draftValue = normalizeApiKeyValue(apiKeyManageDraft.value);
  if (!selectedName) {
    message.warning("请先选择要更新的大香蕉Key名称");
    return;
  }
  if (!draftValue) {
    message.warning("请先输入更新后的大香蕉Key");
    return;
  }
  if (!state.hostApiKeyManage || typeof (api as any).updateManagedApiKey !== "function") {
    message.error("大香蕉Key管理接口未挂载");
    return;
  }

  const result = (await (api as any).updateManagedApiKey({
    name: selectedName,
    value: draftValue,
  })) as ManagedApiKeySaveResult;
  await loadManagedApiKeys();
  apiKeyManageSelected.value = result?.item?.name || "";
  singleApiKeyName.value = result?.item?.name || singleApiKeyName.value;
  aiChatApiKeyName.value = result?.item?.name || aiChatApiKeyName.value;
  form.apiKey = result?.item?.value || form.apiKey;
  apiKeyManageDraft.value = result?.item?.value || draftValue;
  scheduleSaveLocalState();
  logTagged("设置", `已更新大香蕉Key名称：${result?.item?.name ?? ""}`, "success");
  message.success("大香蕉Key更新成功");
};

const deleteManagedApiKey = async () => {
  const selectedName = normalizeApiKeyValue(apiKeyManageSelected.value);
  if (!selectedName) {
    message.warning("请先选择要删除的大香蕉Key名称");
    return;
  }
  if (!state.hostApiKeyManage || typeof (api as any).deleteManagedApiKey !== "function") {
    message.error("大香蕉Key管理接口未挂载");
    return;
  }

  const result = (await (api as any).deleteManagedApiKey(selectedName)) as ManagedApiKeyDeleteResult;
  if (!result?.deleted) {
    message.warning("该大香蕉Key不存在或已删除");
    return;
  }
  const deletedName = selectedName;
  await loadManagedApiKeys();
  if (singleApiKeyName.value === deletedName) {
    singleApiKeyName.value = managedApiKeys.value[0]?.name ?? "";
  }
  if (aiChatApiKeyName.value === deletedName) {
    aiChatApiKeyName.value = managedApiKeys.value[0]?.name ?? "";
    clearAiChatModels();
  }
  apiKeyManageSelected.value = "";
  apiKeyManageDraft.value = "";
  form.apiKey = managedApiKeyValueMap.value.get(singleApiKeyName.value) || "";
  scheduleSaveLocalState();
  logTagged("设置", `已删除大香蕉Key名称：${deletedName}`, "info");
  message.success("已删除选中大香蕉Key");
};

const setMaxResolutionPreset = (value: number) => {
  form.maxResolution = value;
  scheduleSaveLocalState();
  logTagged("设置", `压缩长边已切换到 ${value}px`, "info");
};

const confirmFeatureCode = (code: string) => {
  const normalizedCode = String(code ?? "").trim();
  if (!normalizedCode) {
    message.warning("请先输入功能码");
    return false;
  }
  if (normalizedCode !== CUSTOM_FEATURE_CODE) {
    message.error("功能码错误");
    return false;
  }
  if (customFeatureEnabled.value) {
    void saveCustomFeatureEnabledToHost(true);
    message.info("定制化功能已开启");
    return true;
  }

  customFeatureEnabled.value = true;
  writeLocalStorage(STORAGE_KEYS.customFeatureEnabled, "1");
  void saveCustomFeatureEnabledToHost(true);
  logTagged("设置", "已解锁定制化功能", "success");
  message.success("定制化功能已开启");
  return true;
};

const runGlobalPartition = async () => {
  if (state.runningGlobalPartition) return;

  debugApiBaseUrl("runGlobalPartition.beforeNormalize", form.apiBaseUrl);
  form.apiBaseUrl = normalizeApiBaseUrl(form.apiBaseUrl, DEFAULT_API_BASE_URL);
  debugApiBaseUrl("runGlobalPartition.afterNormalize", form.apiBaseUrl);
  clampRuntimeValues();
  clampGlobalRuntimeValues();

  if (!globalForm.prompt.trim()) {
    message.warning("请先输入全局分区提示词");
    return;
  }
  if (!form.apiKey.trim()) {
    logErrorCode("NO_API_KEY");
    return;
  }
  if (!form.apiBaseUrl.trim()) {
    logErrorCode("NO_API_URL");
    return;
  }
  if (!state.hostGlobalPartition || typeof api.runGlobalPartition !== "function") {
    logErrorCode("HOST_NOT_SUPPORTED", "runGlobalPartition 未挂载");
    return;
  }

  const confirmed =
      typeof window.confirm === "function"
          ? window.confirm("将处理所有打开文档的自动分区任务，任务耗时较长，确认继续吗？")
          : true;
  if (!confirmed) {
    logTagged("全局分区", "用户取消执行", "warn");
    return;
  }

  state.runningGlobalPartition = true;
  safeSaveLocalState();
  pushLog("----------------------------------------", "info");
  logTagged("全局分区", "开始执行全局分区计算...", "info");

  try {
    const result = (await api.runGlobalPartition({
      prompt: globalForm.prompt,
      apiKey: form.apiKey,
      apiBaseUrl: form.apiBaseUrl,
      size: globalForm.size,
      batchSize: globalForm.batchSize,
      timeoutSeconds: globalForm.timeoutSeconds,
      antiTruncationMode: form.antiMode,
      layerType: form.layerType,
      maxResolution: form.maxResolution,
    })) as GlobalPartitionResult;

    globalPartitionResult.value = result;

    result.docResults.forEach((item, index) => {
      logTagged(
          "全局分区",
          `文档 ${index + 1}/${result.documentCount} ${item.docName}: 成功 ${item.successCount}，失败 ${item.failureCount}`,
          item.failureCount > 0 ? "warn" : "success",
      );
      item.errorMessages.forEach((message) => logTagged("错误", message, "error"));
    });

    logTagged(
        "完成",
        `全局分区完成：总任务=${result.taskCount}，成功=${result.successCount}，失败=${result.failureCount}`,
        result.failureCount > 0 ? "warn" : "success",
    );

    if (result.failureCount > 0) {
      message.warning("全局分区完成，但存在部分失败");
    } else {
      message.success("全局分区全部完成");
    }
  } catch (error) {
    logErrorWithSolution(`全局分区失败: ${getErrorMessage(error)}`);
    message.error("全局分区执行失败");
  } finally {
    state.runningGlobalPartition = false;
  }
};

const setAntiMode = (mode: AntiMode) => {
  form.antiMode = form.antiMode === mode ? 0 : mode;
  scheduleSaveLocalState();

  if (form.antiMode === 0) logTagged("抗截断", "已关闭", "info");
  if (form.antiMode === 1) logTagged("抗截断", "已开启普通模式", "info");
  if (form.antiMode === 2) logTagged("抗截断", "已开启高强模式", "warn");
};

const clearPrompt = () => {
  if (!form.prompt) return;
  form.prompt = "";
  scheduleSaveLocalState();
};

const buildQuickPromptName = (content: string) => {
  const compact = String(content ?? "").replace(/\s+/g, " ").trim();
  if (!compact) return "";
  return compact.slice(0, 18);
};

const resetSinglePromptQuickSaveForm = (content = "") => {
  singlePromptQuickSaveForm.name = buildQuickPromptName(content);
  singlePromptQuickSaveForm.content = content;
  singlePromptQuickSaveForm.description = "";
  singlePromptQuickSaveForm.category = "";
  singlePromptQuickSaveForm.tags = [];
};

const openSinglePromptQuickSaveDialog = () => {
  const content = normalizeApiKeyValue(form.prompt);
  if (!content) {
    message.warning("请先输入提示词");
    return;
  }
  resetSinglePromptQuickSaveForm(content);
  singlePromptQuickSaveVisible.value = true;
};

const resetPromptQueryEditForm = (item: PromptCreateQueryItem) => {
  promptQueryEditForm.name = String(item?.name ?? "").trim();
  promptQueryEditForm.content = String(item?.content ?? "");
  promptQueryEditForm.description = String(item?.description ?? "").trim();
  promptQueryEditForm.category = String(item?.category ?? "").trim();
  promptQueryEditForm.tags = Array.isArray(item?.tags) ? [...item.tags] : [];
};

const openPromptQueryEditDialog = (item: PromptCreateQueryItem) => {
  if (item.type !== 1) {
    message.warning("图书馆提示词暂不支持修改");
    return;
  }
  if (!state.hostPromptCreate || typeof api.savePromptCreateItem !== "function") {
    message.error("本地存储接口未挂载，暂不支持修改提示词");
    return;
  }
  promptQueryEditOriginName.value = String(item?.name ?? "").trim();
  resetPromptQueryEditForm(item);
  promptQueryEditVisible.value = true;
};

const runSingleImage = async () => {
  if (state.running) return;
  logTagged("单图", "点击开始生成", "info");

  debugApiBaseUrl("runSingleImage.beforeNormalize", form.apiBaseUrl);
  form.apiBaseUrl = normalizeApiBaseUrl(form.apiBaseUrl, DEFAULT_API_BASE_URL);
  debugApiBaseUrl("runSingleImage.afterNormalize", form.apiBaseUrl);
  clampRuntimeValues();

  if (!form.prompt.trim()) {
    logErrorCode("NO_PROMPT");
    message.warning("请先输入提示词");
    return;
  }
  if (!form.apiKey.trim()) {
    logErrorCode("NO_API_KEY");
    message.warning("请先填写 API Key");
    return;
  }
  if (!form.apiBaseUrl.trim()) {
    logErrorCode("NO_API_URL");
    message.warning("请先填写 API 地址");
    return;
  }
  logTagged(
      "单图",
      `预检: hostRunSingle=${String(state.hostRunSingle)}, api.runSingleImage=${typeof api.runSingleImage}`,
      "info",
  );
  if (!state.hostRunSingle) {
    logTagged("单图", "宿主能力未就绪，尝试重试检测", "warn");
    await initHostCapabilities();
    logTagged(
        "单图",
        `重试后: hostRunSingle=${String(state.hostRunSingle)}, api.runSingleImage=${typeof api.runSingleImage}`,
        "info",
    );
  }
  if (!state.hostRunSingle || typeof api.runSingleImage !== "function") {
    logErrorCode("HOST_NOT_SUPPORTED", "runSingleImage 未挂载");
    message.error("宿主接口未就绪，请重载插件后重试");
    return;
  }

  state.running = true;
  safeSaveLocalState();

  pushLog("----------------------------------------", "info");
  logTagged("单图", `数量=${form.batchSize}, 超时=${form.timeoutSeconds}秒`, "info");
  logTagged("请求", "正在发送请求...", "warn");
  logTagged("单图", "已进入宿主调用 runSingleImage", "info");

  try {
    const result = (await withTimeout(
        api.runSingleImage({
          prompt: form.prompt,
          apiKey: form.apiKey,
          apiBaseUrl: form.apiBaseUrl,
          size: form.size,
          batchSize: form.batchSize,
          timeoutSeconds: form.timeoutSeconds,
          antiTruncationMode: form.antiMode,
          layerType: form.layerType,
          maxResolution: form.maxResolution,
        }) as Promise<SingleRunResult>,
        Math.max(30000, (form.timeoutSeconds + 20) * 1000),
        "单图处理",
    )) as SingleRunResult;

    previewImage.value = result.previewBase64
        ? `data:image/png;base64,${result.previewBase64}`
        : "";

    if (result.errorMessages.length > 0) {
      result.errorMessages.forEach((msg) => logTagged("错误", msg, "error"));
    }

    logTagged(
        "完成",
        `总数=${result.totalCount}, 成功=${result.successCount}, 失败=${result.failureCount}`,
        result.failureCount > 0 ? "warn" : "success",
    );
    logTagged("单图", "宿主调用已返回", "success");

    if (result.failureCount > 0) {
      message.warning("任务完成，但有部分失败");
    } else {
      message.success("单图任务已完成");
    }
  } catch (error) {
    logErrorWithSolution(`主流程出错: ${getErrorMessage(error)}`);
    message.error("单图处理失败");
  } finally {
    state.running = false;
    logTagged("单图", "本次执行结束", "info");
  }
};

const checkQuota = async () => {
  if (state.checkingQuota) return;
  logTagged("查询", "点击查询额度按钮", "info");

  debugApiBaseUrl("checkQuota.beforeNormalize", form.apiBaseUrl);
  form.apiBaseUrl = normalizeApiBaseUrl(form.apiBaseUrl, DEFAULT_API_BASE_URL);
  debugApiBaseUrl("checkQuota.afterNormalize", form.apiBaseUrl);

  if (!form.apiKey.trim()) {
    logErrorCode("NO_API_KEY");
    return;
  }
  if (!form.apiBaseUrl.trim()) {
    logErrorCode("NO_API_URL");
    return;
  }
  if (!state.hostQuota || typeof api.getAiQuota !== "function") {
    logErrorCode("HOST_NOT_SUPPORTED", "getAiQuota 未挂载");
    return;
  }

  state.checkingQuota = true;
  safeSaveLocalState();
  logTagged("查询", "正在查询额度...", "info");

  try {
    const quota = (await withTimeout(api.getAiQuota({
      apiKey: form.apiKey,
      apiBaseUrl: form.apiBaseUrl,
      timeoutSeconds: 20,
    }) as Promise<QuotaResult>, 30000, "查询额度")) as QuotaResult;

    quotaInfo.value = quota;
    logTagged("成功", "查询完成", "success");
    logTagged("余额", `$${quota.availableUSD.toFixed(2)}`, "success");
    logTagged("1K", `${quota.count1K} 张`, "info");
    logTagged("2K", `${quota.count2K} 张`, "info");
    logTagged("4K", `${quota.count4K} 张`, "info");
    message.success("额度查询完成");
  } catch (error) {
    const message = getErrorMessage(error);
    if (message.includes("超时")) {
      logErrorWithSolution(message, "请检查网络连接，或稍后重试");
    } else if (message.includes("401") || message.includes("API Key 无效")) {
      logErrorWithSolution(message, "请检查 API Key 是否正确或已过期");
    } else if (message.includes("403")) {
      logErrorWithSolution(message, "请检查账户权限或余额是否充足");
    } else if (message.includes("404")) {
      logErrorWithSolution(message, "请检查 API 地址是否正确");
    } else {
      logErrorWithSolution(`查询失败: ${message}`);
    }
    message.error("额度查询失败");
  } finally {
    state.checkingQuota = false;
  }
};

const getTaskMeta = (task: BatchTaskItem) => {
  const antiText =
      task.settings.antiTruncationMode === 1
          ? "抗截断: 普通"
          : task.settings.antiTruncationMode === 2
              ? "抗截断: 高强"
              : "抗截断: 关闭";
  const layerText = task.settings.layerType === "smartObject" ? "智能对象" : "栅格化图层";
  return `${task.settings.size} · x${task.settings.count} · 超时 ${task.settings.timeoutSeconds}s · ${antiText} · ${layerText}`;
};

const addCurrentToBatch = async () => {
  if (state.addingBatchTask) return;

  clampRuntimeValues();
  if (!form.prompt.trim()) {
    logErrorCode("NO_PROMPT");
    return;
  }

  if (!state.hostBatchCapture || typeof api.captureBatchTask !== "function") {
    logErrorCode("HOST_NOT_SUPPORTED", "captureBatchTask 未挂载");
    return;
  }

  state.addingBatchTask = true;
  safeSaveLocalState();
  logTagged("批处理", "正在抓取当前选区并添加任务...", "info");

  try {
    const task = (await api.captureBatchTask({
      prompt: form.prompt,
      size: form.size,
      count: form.batchSize,
      timeoutSeconds: form.timeoutSeconds,
      antiTruncationMode: form.antiMode,
      layerType: form.layerType,
      maxResolution: form.maxResolution,
    })) as BatchTaskItem;

    batchQueue.value.push(task);
    activeTab.value = "batch";

    logTagged("批处理", `任务已添加: ${task.docName} · ${getTaskMeta(task)}`, "success");
    message.success("已添加到批处理列表");
  } catch (error) {
    logErrorWithSolution(`添加批处理任务失败: ${getErrorMessage(error)}`);
    message.error("添加批处理任务失败");
  } finally {
    state.addingBatchTask = false;
  }
};

const removeBatchTask = (taskId: number) => {
  const index = batchQueue.value.findIndex((item) => item.id === taskId);
  if (index < 0) return;

  const task = batchQueue.value[index];
  batchQueue.value.splice(index, 1);
  logTagged("批处理", `已移除任务: ${task.docName}`, "info");
};

const clearBatchQueue = () => {
  if (batchQueue.value.length === 0) return;

  const confirmed = window.confirm("确定要清空所有批处理任务吗？");
  if (!confirmed) return;

  batchQueue.value.splice(0, batchQueue.value.length);
  logTagged("批处理", "批处理任务列表已清空", "info");
};

const runBatchQueue = async () => {
  if (state.batchRunning) return;

  debugApiBaseUrl("runBatchQueue.beforeNormalize", form.apiBaseUrl);
  form.apiBaseUrl = normalizeApiBaseUrl(form.apiBaseUrl, DEFAULT_API_BASE_URL);
  debugApiBaseUrl("runBatchQueue.afterNormalize", form.apiBaseUrl);

  if (batchQueue.value.length === 0) {
    logErrorCode("BATCH_EMPTY");
    return;
  }
  if (!form.apiKey.trim()) {
    logErrorCode("NO_API_KEY");
    return;
  }
  if (!form.apiBaseUrl.trim()) {
    logErrorCode("NO_API_URL");
    return;
  }
  if (!state.hostBatchRun || typeof api.runBatchTasks !== "function") {
    logErrorCode("HOST_NOT_SUPPORTED", "runBatchTasks 未挂载");
    return;
  }

  state.batchRunning = true;
  safeSaveLocalState();

  pushLog("----------------------------------------", "info");
  logTagged("批处理", `开始执行，共 ${batchQueue.value.length} 个任务组`, "info");

  try {
    const result = (await api.runBatchTasks({
      apiKey: form.apiKey,
      apiBaseUrl: form.apiBaseUrl,
      tasks: batchQueue.value,
    })) as RunBatchResult;

    result.taskResults.forEach((group, index) => {
      logTagged(
          "批处理",
          `任务组 ${index + 1}/${result.taskGroupCount} (${group.docName})：成功 ${group.successCount}，失败 ${group.failureCount}`,
          group.failureCount > 0 ? "warn" : "success",
      );
      if (group.errorMessages.length > 0) {
        group.errorMessages.forEach((message) => logTagged("错误", message, "error"));
      }
    });

    if (result.errorMessages.length > 0) {
      logTagged("批处理", `执行完成，总体有 ${result.errorMessages.length} 条错误`, "warn");
    }

    logTagged(
        "完成",
        `批处理完成：总数=${result.totalCount}，成功=${result.successCount}，失败=${result.failureCount}`,
        result.failureCount > 0 ? "warn" : "success",
    );

    batchQueue.value.splice(0, batchQueue.value.length);

    if (result.failureCount > 0) {
      message.warning("批处理完成，但有部分失败");
    } else {
      message.success("批处理全部完成");
    }
  } catch (error) {
    logErrorWithSolution(`批处理执行失败: ${getErrorMessage(error)}`);
    message.error("批处理执行失败");
  } finally {
    state.batchRunning = false;
  }
};

const clearLogs = () => {
  state.logs.splice(0, state.logs.length);
};

const normalizePromptCreateTags = (value: string[]) =>
    Array.from(
        new Set(
            value
                .map((item) => String(item ?? "").trim())
                .filter((item) => item.length > 0),
        ),
    );

const clearPromptCreateForm = () => {
  promptCreateForm.name = "";
  promptCreateForm.content = "";
  promptCreateForm.description = "";
  promptCreateForm.category = "";
  promptCreateForm.tags = [];
};

const refreshPromptCreateStorageInfo = async (options?: {
  forceSyncLibrary?: boolean;
  skipRemoteSync?: boolean;
  updateSkipRemoteSyncOnly?: boolean;
}): Promise<PromptCreateStorageInfo | null> => {
  if (!state.hostPromptCreate) {
    promptCreateStoragePath.value = "(本地存储接口未挂载)";
    promptCreateTotal.value = 0;
    return null;
  }

  try {
    const forceSyncLibrary = Boolean(options?.forceSyncLibrary);
    const skipRemoteSync =
      typeof options?.skipRemoteSync === "boolean" ? options.skipRemoteSync : undefined;
    const updateSkipRemoteSyncOnly = Boolean(options?.updateSkipRemoteSyncOnly);
    const initStorageFn = (api as any).initPromptCreateStorage;
    const getStorageInfoFn = (api as any).getPromptCreateStorageInfo;
    if (typeof initStorageFn !== "function" && typeof getStorageInfoFn !== "function") {
      throw new Error("initPromptCreateStorage/getPromptCreateStorageInfo 未挂载");
    }

    const info = (await (
      typeof initStorageFn === "function"
        ? initStorageFn({ forceSyncLibrary, skipRemoteSync, updateSkipRemoteSyncOnly })
        : getStorageInfoFn({ forceSyncLibrary, skipRemoteSync, updateSkipRemoteSyncOnly })
    )) as PromptCreateStorageInfo;
    promptCreateStoragePath.value = String(info?.path ?? "").trim() || "(未知路径)";
    promptCreateTotal.value = Math.max(0, Number(info?.total) || 0);
    promptLibraryForceSync.value = Number(info?.skipRemoteSync) === 1;

    const syncFlag = Number(info?.librarySyncFlag) === 1 ? 1 : 0;
    const persistedSkip = Number(info?.skipRemoteSync) === 1 ? 1 : 0;
    const syncStatus = String(info?.librarySyncLastStatus ?? "").trim() || "idle";
    const syncMessage = String(info?.librarySyncLastMessage ?? "").trim() || "(empty)";
    const syncAt = String(info?.librarySyncLastAt ?? "").trim() || "-";
    const level: LogLevel = syncStatus === "error" ? "warn" : "info";
    logTagged(
      "提示词库同步",
      `flag=${syncFlag}, skip=${persistedSkip}, status=${syncStatus}, at=${syncAt}, msg=${syncMessage}`,
      level,
    );

    return info;
  } catch (error) {
    promptCreateStoragePath.value = "(读取失败)";
    promptCreateTotal.value = 0;
    logErrorWithSolution(getPromptStorageErrorMessage("读取提示词存储信息", error));
    return null;
  }
};

const loadPromptQueryItems = async (options?: {
  syncLibrary?: boolean;
  forceSyncLibrary?: boolean;
  forceReloadDisk?: boolean;
  clearCacheFirst?: boolean;
}) => {
  if (promptQueryLoading.value) return;
  if (!state.hostPromptQuery || typeof api.listPromptCreateItems !== "function") {
    promptQueryItems.value = [];
    promptQueryInitialized.value = false;
    return;
  }

  promptQueryLoading.value = true;
  try {
    if ((options?.syncLibrary ?? true) && state.hostPromptCreate) {
      await refreshPromptCreateStorageInfo({
        forceSyncLibrary: options?.forceSyncLibrary,
      });
    }
    const result = (await api.listPromptCreateItems({
      forceReloadDisk: Boolean(options?.forceReloadDisk),
      clearCacheFirst: Boolean(options?.clearCacheFirst),
    })) as PromptCreateListResult;
    promptQueryItems.value = Array.isArray(result?.items)
      ? result.items.map((item) => ({
        ...item,
        favorite: Number((item as any)?.favorite) === 1 ? 1 : 0,
      }))
      : [];
    if (promptQueryDetailItem.value) {
      const currentName = promptQueryDetailItem.value.name;
      const matched = promptQueryItems.value.find((entry) => entry.name === currentName) || null;
      promptQueryDetailItem.value = matched;
    }
    promptCreateStoragePath.value = String(result?.path ?? "").trim() || promptCreateStoragePath.value;
    promptCreateTotal.value = Math.max(0, Number(result?.total) || promptQueryItems.value.length);
    promptQueryInitialized.value = true;
    logTagged(
      "提示词查询",
      `列表加载完成：total=${promptQueryItems.value.length}, matched=${promptQueryFilteredItems.value.length}, name="${promptQueryNameKeyword.value.trim()}", tag="${promptQueryTagKeyword.value.trim()}", favOnly=${promptQueryFavoritesOnly.value ? 1 : 0}`,
      "info",
    );
  } catch (error) {
    promptQueryItems.value = [];
    promptQueryInitialized.value = false;
    logErrorWithSolution(getPromptStorageErrorMessage("读取提示词列表", error));
  } finally {
    promptQueryLoading.value = false;
  }
};

const pullPromptLibraryFromCloud = async () => {
  if (promptLibraryRefreshLoading.value) return;
  promptLibraryRefreshLoading.value = true;
  try {
    const info = await refreshPromptCreateStorageInfo({ forceSyncLibrary: true });
    promptQueryNameKeyword.value = "";
    promptQueryTagKeyword.value = "";
    await loadPromptQueryItems({ syncLibrary: false, forceReloadDisk: true });
    const syncStatus = String(info?.librarySyncLastStatus ?? "").trim();
    if (syncStatus === "error") {
      message.warning(`云端拉取失败：${String(info?.librarySyncLastMessage ?? "未知错误")}`);
    } else if (info) {
      logTagged("提示词库", "已从云端拉取提示词并更新本地", "success");
      message.success("已从云端拉取提示词");
    } else {
      message.warning("云端拉取失败，已显示本地缓存");
    }
  } finally {
    promptLibraryRefreshLoading.value = false;
  }
};

const usePromptForSingle = (item: PromptCreateQueryItem) => {
  const prompt = String(item?.content ?? "").trim();
  if (!prompt) {
    message.warning("该提示词内容为空，无法使用");
    return;
  }

  form.prompt = prompt;
  activeTab.value = "single";
  scheduleSaveLocalState();
  logTagged("提示词查询", `已应用提示词：${item.name}`, "success");
  message.success("已填充到单图处理提示词");
};

const appendPromptForSingle = (item: PromptCreateQueryItem) => {
  const prompt = String(item?.content ?? "").trim();
  if (!prompt) {
    message.warning("该提示词内容为空，无法追加");
    return;
  }

  const current = String(form.prompt ?? "").trim();
  form.prompt = current ? `${current}\n\n${prompt}` : prompt;
  activeTab.value = "single";
  scheduleSaveLocalState();
  logTagged("提示词查询", `已追加提示词：${item.name}`, "success");
  message.success("已追加到单图处理提示词");
};

const togglePromptQueryFavorite = async (item: PromptCreateQueryItem) => {
  if (!state.hostPromptFavorite || typeof (api as any).togglePromptCreateFavorite !== "function") {
    message.error("收藏接口未挂载，请重载插件");
    return;
  }

  try {
    const result = (await (api as any).togglePromptCreateFavorite(item.name)) as {
      item?: PromptCreateQueryItem;
    };
    const next = result?.item;
    if (!next) return;

    const index = promptQueryItems.value.findIndex((entry) => entry.name === next.name);
    if (index >= 0) {
      promptQueryItems.value.splice(index, 1, next);
    }
    promptQueryItems.value.sort((a, b) => {
      const fa = Number(a.favorite) === 1 ? 1 : 0;
      const fb = Number(b.favorite) === 1 ? 1 : 0;
      if (fa !== fb) return fb - fa;
      const ta = Date.parse(a.updatedAt || a.createdAt || "");
      const tb = Date.parse(b.updatedAt || b.createdAt || "");
      if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return tb - ta;
      return String(a.name).localeCompare(String(b.name));
    });

    if (promptQueryDetailItem.value?.name === next.name) {
      promptQueryDetailItem.value = next;
    }
    const status = Number(next.favorite) === 1 ? "已收藏" : "已取消收藏";
    logTagged("提示词查询", `${status}：${next.name}`, "info");
  } catch (error) {
    const message = getPromptStorageErrorMessage("切换收藏", error);
    logErrorWithSolution(message);
    message.error(message);
  }
};

const deletePromptQueryItem = async (item: PromptCreateQueryItem) => {
  if (item.type !== 1) {
    message.warning("图书馆提示词暂不支持删除");
    return;
  }
  if (!state.hostPromptDelete || typeof (api as any).deletePromptCreateItem !== "function") {
    message.error("本地存储接口未挂载，暂不支持删除提示词");
    return;
  }
  if (promptQueryDeletingName.value) return;

  const confirmed =
      typeof window.confirm === "function"
          ? window.confirm(`确定删除提示词「${item.name}」吗？`)
          : true;
  if (!confirmed) return;

  promptQueryDeletingName.value = item.name;
  try {
    const result = (await (api as any).deletePromptCreateItem(item.name)) as PromptCreateDeleteResult;
    promptCreateStoragePath.value = String(result?.path ?? "").trim() || promptCreateStoragePath.value;
    promptCreateTotal.value = Math.max(0, Number(result?.total) || 0);

    if (!result?.deleted) {
      message.warning("提示词不存在或已被删除");
      return;
    }

    const index = promptQueryItems.value.findIndex((entry) => entry.name === item.name);
    if (index >= 0) {
      promptQueryItems.value.splice(index, 1);
    }
    if (promptQueryDetailItem.value?.name === item.name) {
      promptQueryDetailItem.value = null;
    }

    logTagged("提示词查询", `已删除提示词：${item.name}`, "success");
    message.success("提示词已删除");
  } catch (error) {
    const message = getPromptStorageErrorMessage("删除提示词", error);
    logErrorWithSolution(message);
    message.error(message);
  } finally {
    promptQueryDeletingName.value = "";
  }
};

const formatPromptTime = (value: string) => {
  const timestamp = Date.parse(String(value ?? ""));
  if (!Number.isFinite(timestamp)) return "";
  return new Date(timestamp).toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const savePromptCreateItemInternal = async (
  payload: {
    name: string;
    content: string;
    description: string;
    category: string;
    tags: string[];
  },
  sourceTag: string,
) => {
  if (!state.hostPromptCreate || typeof api.savePromptCreateItem !== "function") {
    message.error("本地存储接口未挂载，暂不支持提示词新增保存");
    return false;
  }

  promptCreateSaving.value = true;
  try {
    const result = (await withTimeout(
      api.savePromptCreateItem({
        name: payload.name,
        content: payload.content,
        description: payload.description,
        category: payload.category,
        tags: payload.tags,
      }) as Promise<PromptCreateSaveResult>,
      20000,
      "保存提示词",
    )) as PromptCreateSaveResult;

    promptCreateStoragePath.value = String(result?.path ?? "").trim() || promptCreateStoragePath.value;
    promptCreateTotal.value = Math.max(0, Number(result?.total) || promptCreateTotal.value);
    const savedItem = result?.item;
    if (savedItem && promptQueryInitialized.value && state.hostPromptQuery) {
      const existingIndex = promptQueryItems.value.findIndex((item) => item.name === savedItem.name);
      if (existingIndex >= 0) {
        promptQueryItems.value.splice(existingIndex, 1);
      }
      promptQueryItems.value.unshift(savedItem);
    } else if (activeTab.value === "prompt-query" && state.hostPromptQuery) {
      await loadPromptQueryItems();
    }

    logTagged(sourceTag, `已保存：${payload.name}（共 ${promptCreateTotal.value} 条）`, "success");
    message.success("提示词保存成功");
    return true;
  } catch (error) {
    const message = getPromptStorageErrorMessage("保存提示词", error);
    logErrorWithSolution(message);
    message.error(message);
    return false;
  } finally {
    promptCreateSaving.value = false;
  }
};

const savePromptCreateForm = async () => {
  if (promptCreateSaving.value) return;
  logTagged("提示词新增", "点击保存按钮", "info");

  const name = promptCreateForm.name.trim();
  const content = promptCreateForm.content.trim();
  if (!name) {
    logTagged("提示词新增", "保存失败：提示词名称为空", "warn");
    message.warning("请先填写提示词名称");
    return;
  }
  if (!content) {
    logTagged("提示词新增", "保存失败：提示词内容为空", "warn");
    message.warning("请先填写提示词内容");
    return;
  }

  await savePromptCreateItemInternal(
    {
      name,
      content,
      description: promptCreateForm.description.trim(),
      category: promptCreateForm.category.trim(),
      tags: normalizePromptCreateTags(promptCreateForm.tags),
    },
    "提示词新增",
  );
};

const jumpToPromptQuery = () => {
  activeTab.value = "prompt-query";
};

const saveSinglePromptQuickFromDialog = async () => {
  if (promptCreateSaving.value) return;
  const name = singlePromptQuickSaveForm.name.trim();
  const content = singlePromptQuickSaveForm.content.trim();
  if (!name) {
    message.warning("请先填写提示词名称");
    return;
  }
  if (!content) {
    message.warning("请先填写提示词内容");
    return;
  }

  const saved = await savePromptCreateItemInternal(
    {
      name,
      content,
      description: singlePromptQuickSaveForm.description.trim(),
      category: singlePromptQuickSaveForm.category.trim(),
      tags: normalizePromptCreateTags(singlePromptQuickSaveForm.tags),
    },
    "单图提示词",
  );
  if (!saved) return;
  singlePromptQuickSaveVisible.value = false;
};

const savePromptQueryEditFromDialog = async () => {
  if (promptCreateSaving.value) return;

  const sourceName = String(promptQueryEditOriginName.value ?? "").trim();
  const name = promptQueryEditForm.name.trim();
  const content = promptQueryEditForm.content.trim();
  if (!sourceName) {
    message.error("缺少原始提示词名称，无法保存");
    return;
  }
  if (!name) {
    message.warning("请先填写提示词名称");
    return;
  }
  if (!content) {
    message.warning("请先填写提示词内容");
    return;
  }
  const renaming = sourceName !== name;
  if (renaming && (!state.hostPromptDelete || typeof (api as any).deletePromptCreateItem !== "function")) {
    message.warning("当前环境不支持重命名，请保持原名称后再保存");
    return;
  }

  const keepDetail = promptQueryDetailItem.value?.name === sourceName;
  const saved = await savePromptCreateItemInternal(
    {
      name,
      content,
      description: promptQueryEditForm.description.trim(),
      category: promptQueryEditForm.category.trim(),
      tags: normalizePromptCreateTags(promptQueryEditForm.tags),
    },
    "提示词修改",
  );
  if (!saved) return;

  let renameDeleteFailed = false;
  if (renaming) {
    try {
      const removeResult = (await (api as any).deletePromptCreateItem(sourceName)) as PromptCreateDeleteResult;
      promptCreateStoragePath.value = String(removeResult?.path ?? "").trim() || promptCreateStoragePath.value;
      promptCreateTotal.value = Math.max(0, Number(removeResult?.total) || promptCreateTotal.value);
    } catch (error) {
      renameDeleteFailed = true;
      logErrorWithSolution(getPromptStorageErrorMessage(`删除旧提示词「${sourceName}」`, error));
    }
  }

  if (state.hostPromptQuery) {
    await loadPromptQueryItems({ syncLibrary: false, forceReloadDisk: true });
  }
  if (keepDetail) {
    promptQueryDetailItem.value =
      promptQueryItems.value.find((entry) => entry.name === name) || null;
  }

  promptQueryEditVisible.value = false;
  if (renameDeleteFailed) {
    message.warning("新提示词已保存，但旧名称删除失败，请手动删除旧记录");
  }
};

const copyPromptCreateStoragePath = async () => {
  const path = String(promptCreateStoragePath.value ?? "").trim();
  if (!path || path.startsWith("(")) {
    message.warning("暂无可复制路径");
    return;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(path);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = path;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (!ok) throw new Error("copy command failed");
    }
    message.success("路径已复制");
  } catch {
    message.error("复制失败，请手动复制");
  }
};

const openImagePreviewPicker = () => {
  imagePreviewInputRef.value?.click();
};

const clampImagePreviewZoom = (value: number) =>
    Math.min(IMAGE_PREVIEW_MAX_ZOOM, Math.max(IMAGE_PREVIEW_MIN_ZOOM, value));
const clampImagePreviewHeight = (value: number) => Math.max(IMAGE_PREVIEW_MIN_HEIGHT, value);

const getImagePreviewItem = (id: number) =>
    imagePreviewItems.value.find((entry) => entry.id === id);

const getImagePreviewBox = (id: number) =>
    document.querySelector(`[data-preview-id="${id}"]`) as HTMLElement | null;

const clampImagePreviewOffset = (
    zoom: number,
    value: number,
    viewportSize: number,
) => {
  if (zoom <= 1) return 0;
  const maxOffset = (viewportSize * (zoom - 1)) / 2;
  return Math.min(maxOffset, Math.max(-maxOffset, value));
};

const normalizeImagePreviewPan = (id: number, width?: number, height?: number) => {
  const item = getImagePreviewItem(id);
  if (!item) return;

  const box = getImagePreviewBox(id);
  const viewportWidth = width ?? box?.clientWidth ?? 0;
  const viewportHeight = height ?? box?.clientHeight ?? 0;
  if (!viewportWidth || !viewportHeight) return;

  item.offsetX = clampImagePreviewOffset(item.zoom, item.offsetX, viewportWidth);
  item.offsetY = clampImagePreviewOffset(item.zoom, item.offsetY, viewportHeight);
};

const updateImagePreviewZoom = (id: number, value: number) => {
  const item = getImagePreviewItem(id);
  if (!item) return;
  item.zoom = clampImagePreviewZoom(value);
  if (item.zoom <= 1) {
    item.offsetX = 0;
    item.offsetY = 0;
  } else {
    normalizeImagePreviewPan(id);
  }
};

const updateImagePreviewHeight = (id: number, value: number) => {
  const item = getImagePreviewItem(id);
  if (!item) return;
  item.frameHeight = clampImagePreviewHeight(value);
  normalizeImagePreviewPan(id);
};

const scrollImagePreviewTo = (index: number) => {
  const carousel = imagePreviewCarouselRef.value;
  if (!carousel || imagePreviewItems.value.length === 0) return;

  const safeIndex = Math.max(0, Math.min(index, imagePreviewItems.value.length - 1));
  imagePreviewActiveIndex.value = safeIndex;

  carousel.scrollTo({
    left: safeIndex * carousel.clientWidth,
    behavior: "smooth",
  });
};

const onImagePreviewFilesChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []).filter((file) => file.type.startsWith("image/"));

  if (files.length === 0) {
    input.value = "";
    return;
  }

  const prevLength = imagePreviewItems.value.length;
  const appendItems = files.map((file) => ({
    id: ++imagePreviewIdSeed,
    name: file.name,
    url: URL.createObjectURL(file),
    zoom: 1,
    frameHeight: 220,
    offsetX: 0,
    offsetY: 0,
  }));

  imagePreviewItems.value = [...imagePreviewItems.value, ...appendItems];

  if (prevLength === 0) {
    imagePreviewActiveIndex.value = 0;
  }

  input.value = "";
  await nextTick();
  scrollImagePreviewTo(imagePreviewActiveIndex.value);
};

const clearImagePreviewItems = () => {
  stopImagePreviewPan();
  stopImagePreviewFrameResize();
  imagePreviewItems.value.forEach((item) => URL.revokeObjectURL(item.url));
  imagePreviewItems.value = [];
  imagePreviewActiveIndex.value = 0;
};

const removeImagePreviewItem = async (id: number) => {
  if (imagePreviewPanState.itemId === id) {
    stopImagePreviewPan();
  }
  if (imagePreviewResizeState.itemId === id) {
    stopImagePreviewFrameResize();
  }

  const idx = imagePreviewItems.value.findIndex((item) => item.id === id);
  if (idx === -1) return;

  URL.revokeObjectURL(imagePreviewItems.value[idx].url);
  imagePreviewItems.value.splice(idx, 1);

  if (imagePreviewItems.value.length === 0) {
    imagePreviewActiveIndex.value = 0;
    return;
  }

  imagePreviewActiveIndex.value = Math.min(
      imagePreviewActiveIndex.value,
      imagePreviewItems.value.length - 1,
  );

  await nextTick();
  scrollImagePreviewTo(imagePreviewActiveIndex.value);
};

const onImagePreviewScroll = () => {
  const carousel = imagePreviewCarouselRef.value;
  if (!carousel || imagePreviewItems.value.length === 0) return;

  const width = carousel.clientWidth || 1;
  imagePreviewActiveIndex.value = Math.min(
      imagePreviewItems.value.length - 1,
      Math.max(0, Math.round(carousel.scrollLeft / width)),
  );
};

const onImagePreviewWheel = (event: WheelEvent, id: number) => {
  const item = getImagePreviewItem(id);
  if (!item) return;
  const box = event.currentTarget as HTMLElement | null;
  if (!box) return;

  const oldZoom = item.zoom;
  const delta = event.deltaY < 0 ? IMAGE_PREVIEW_WHEEL_STEP : -IMAGE_PREVIEW_WHEEL_STEP;
  const newZoom = clampImagePreviewZoom(oldZoom + delta);
  if (newZoom === oldZoom) return;

  const rect = box.getBoundingClientRect();
  const cursorX = event.clientX - rect.left - rect.width / 2;
  const cursorY = event.clientY - rect.top - rect.height / 2;
  const ratio = newZoom / oldZoom;

  item.offsetX = item.offsetX + (1 - ratio) * (cursorX - item.offsetX);
  item.offsetY = item.offsetY + (1 - ratio) * (cursorY - item.offsetY);
  item.zoom = newZoom;

  normalizeImagePreviewPan(id, rect.width, rect.height);
};

const stopImagePreviewPan = () => {
  imagePreviewPanState.dragging = false;
  imagePreviewPanState.itemId = null;
  imagePreviewPanState.startX = 0;
  imagePreviewPanState.startY = 0;
  imagePreviewPanState.startOffsetX = 0;
  imagePreviewPanState.startOffsetY = 0;
  imagePreviewPanState.boxWidth = 0;
  imagePreviewPanState.boxHeight = 0;
  window.removeEventListener("mousemove", onImagePreviewPanMove);
  window.removeEventListener("mouseup", stopImagePreviewPan);
};

const onImagePreviewPanMove = (event: MouseEvent) => {
  if (!imagePreviewPanState.dragging || imagePreviewPanState.itemId === null) return;
  const item = getImagePreviewItem(imagePreviewPanState.itemId);
  if (!item) return;

  const deltaX = event.clientX - imagePreviewPanState.startX;
  const deltaY = event.clientY - imagePreviewPanState.startY;
  item.offsetX = imagePreviewPanState.startOffsetX + deltaX;
  item.offsetY = imagePreviewPanState.startOffsetY + deltaY;
  normalizeImagePreviewPan(
      imagePreviewPanState.itemId,
      imagePreviewPanState.boxWidth,
      imagePreviewPanState.boxHeight,
  );
};

const startImagePreviewPan = (event: MouseEvent, id: number) => {
  if (event.button !== 0) return;
  const item = getImagePreviewItem(id);
  if (!item || item.zoom <= 1) return;

  const box = event.currentTarget as HTMLElement | null;
  if (!box) return;

  imagePreviewPanState.dragging = true;
  imagePreviewPanState.itemId = id;
  imagePreviewPanState.startX = event.clientX;
  imagePreviewPanState.startY = event.clientY;
  imagePreviewPanState.startOffsetX = item.offsetX;
  imagePreviewPanState.startOffsetY = item.offsetY;
  imagePreviewPanState.boxWidth = box.clientWidth;
  imagePreviewPanState.boxHeight = box.clientHeight;

  window.addEventListener("mousemove", onImagePreviewPanMove);
  window.addEventListener("mouseup", stopImagePreviewPan);
};

const stopImagePreviewFrameResize = () => {
  imagePreviewResizeState.dragging = false;
  imagePreviewResizeState.itemId = null;
  imagePreviewResizeState.startY = 0;
  imagePreviewResizeState.startHeight = 220;
  window.removeEventListener("mousemove", onImagePreviewFrameResize);
  window.removeEventListener("mouseup", stopImagePreviewFrameResize);
};

const onImagePreviewFrameResize = (event: MouseEvent) => {
  if (!imagePreviewResizeState.dragging || imagePreviewResizeState.itemId === null) return;
  const deltaY = event.clientY - imagePreviewResizeState.startY;
  const nextHeight = imagePreviewResizeState.startHeight + deltaY;
  updateImagePreviewHeight(imagePreviewResizeState.itemId, nextHeight);
};

const startImagePreviewFrameResize = (event: MouseEvent, id: number) => {
  if (event.button !== 0) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest("button")) return;

  const item = imagePreviewItems.value.find((entry) => entry.id === id);
  if (!item) return;

  imagePreviewResizeState.dragging = true;
  imagePreviewResizeState.itemId = id;
  imagePreviewResizeState.startY = event.clientY;
  imagePreviewResizeState.startHeight = item.frameHeight;

  window.addEventListener("mousemove", onImagePreviewFrameResize);
  window.addEventListener("mouseup", stopImagePreviewFrameResize);
};

const goImagePreviewPrev = () => {
  scrollImagePreviewTo(imagePreviewActiveIndex.value - 1);
};

const goImagePreviewNext = () => {
  scrollImagePreviewTo(imagePreviewActiveIndex.value + 1);
};

const switchMainTabByOffset = (offset: number) => {
  const tabCount = mainTabOrder.value.length;
  if (tabCount <= 1) return;
  const current = activeTabIndex.value;
  let next = current + offset;
  if (next < 0) next = tabCount - 1;
  if (next >= tabCount) next = 0;
  activeTabIndex.value = next;
};

const INPUT_NAV_EDITABLE_SELECTOR = ".t-input, .t-textarea, .t-select, .t-tag-input, .t-input-number";

const isVisibleFocusableInput = (element: HTMLInputElement | HTMLTextAreaElement) => {
  if (element.disabled) return false;
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (element.getAttribute("aria-hidden") === "true") return false;
  return element.getClientRects().length > 0;
};

const getCurrentVisibleTabPanel = () =>
    document.querySelector(".main-tabs .t-tabs__content > .t-tab-panel:not(.t-is-hidden)") as HTMLElement | null;

const getInputNavigationTargets = () => {
  const panel = getCurrentVisibleTabPanel() || document.body;
  const allInputs = Array.from(panel.querySelectorAll("input, textarea")) as Array<
    HTMLInputElement | HTMLTextAreaElement
  >;
  return allInputs.filter((element) => {
    if (element.tagName.toLowerCase() === "input") {
      const inputType = String((element as HTMLInputElement).type || "text").toLowerCase();
      if (["hidden", "file", "checkbox", "radio", "button", "submit", "reset", "image"].includes(inputType)) {
        return false;
      }
    }
    return isVisibleFocusableInput(element);
  });
};

const focusInputByOffset = (offset: number) => {
  const targets = getInputNavigationTargets();
  if (targets.length === 0) return false;

  const active = document.activeElement as HTMLElement | null;
  const activeContainer = active?.closest?.(INPUT_NAV_EDITABLE_SELECTOR) ?? null;
  let currentIndex = targets.findIndex((target) => target === active);
  if (currentIndex < 0 && activeContainer) {
    currentIndex = targets.findIndex((target) => target.closest(INPUT_NAV_EDITABLE_SELECTOR) === activeContainer);
  }

  const nextIndex =
      currentIndex < 0
        ? offset > 0
          ? 0
          : targets.length - 1
        : (currentIndex + offset + targets.length) % targets.length;
  const target = targets[nextIndex];

  try {
    (target as any).focus?.({preventScroll: true});
  } catch {
    target.focus();
  }
  target.scrollIntoView({block: "nearest"});

  try {
    target.select();
  } catch {
    // no-op
  }
  return true;
};

const isEditableEventTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tagName = String(element.tagName || "").toLowerCase();
  if (["input", "textarea", "select"].includes(tagName)) return true;
  if (element.isContentEditable) return true;
  return Boolean(
      element.closest(INPUT_NAV_EDITABLE_SELECTOR),
  );
};

const onGlobalMainTabKeydown = (event: KeyboardEvent) => {
  if (event.defaultPrevented) return;
  if (activeTab.value === "single" && !event.repeat) {
    const singleRunShortcutConfig = getEffectiveSingleRunShortcut();
    if (matchKeyboardEventWithShortcut(event, singleRunShortcutConfig)) {
      event.preventDefault();
      event.stopPropagation();
      void runSingleImage();
      return;
    }
  }
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (isEditableEventTarget(event.target)) return;

  const key = String(event.key || "");
  if (key === "ArrowLeft") {
    event.preventDefault();
    lastLocalMainTabKeyAt = Date.now();
    switchMainTabByOffset(-1);
    return;
  }
  if (key === "ArrowRight") {
    event.preventDefault();
    lastLocalMainTabKeyAt = Date.now();
    switchMainTabByOffset(1);
    return;
  }
  if (key === "ArrowUp") {
    event.preventDefault();
    focusInputByOffset(-1);
    return;
  }
  if (key === "ArrowDown") {
    event.preventDefault();
    focusInputByOffset(1);
    return;
  }

};

const onHostMainTabNav = (event: Event) => {
  if (Date.now() - lastLocalMainTabKeyAt <= HOST_NAV_DEDUP_MS) return;
  if (isEditableEventTarget(document.activeElement)) return;

  const detail = (event as CustomEvent<{ direction?: string }>).detail;
  const direction = String(detail?.direction || "");
  if (direction === "prev") {
    switchMainTabByOffset(-1);
    return;
  }
  if (direction === "next") {
    switchMainTabByOffset(1);
  }
};

const onMainTabSliderInput = (event: Event) => {
  const input = event.target as HTMLInputElement | null;
  if (!input) return;
  activeTabIndex.value = Number(input.value);
};

const focusMainInteractionAnchor = () => {
  const anchor = mainInteractionFocusAnchorRef.value;
  if (!anchor) return;
  const active = document.activeElement as HTMLElement | null;
  if (isEditableEventTarget(active)) return;
  try {
    (anchor as any).focus?.({ preventScroll: true });
  } catch {
    try {
      anchor.focus();
    } catch {
      // no-op
    }
  }
};

const scheduleFocusMainInteractionAnchor = () => {
  [0, 40, 120].forEach((delay) => {
    window.setTimeout(() => {
      focusMainInteractionAnchor();
    }, delay);
  });
};

const onWindowFocusRecoverInteraction = () => {
  stopImagePreviewPan();
  stopImagePreviewFrameResize();
  scheduleFocusMainInteractionAnchor();
};

const onDocumentVisibilityRecoverInteraction = () => {
  if (document.visibilityState !== "visible") return;
  stopImagePreviewPan();
  stopImagePreviewFrameResize();
  scheduleFocusMainInteractionAnchor();
};

const onWindowBlurStopInteraction = () => {
  stopImagePreviewPan();
  stopImagePreviewFrameResize();
};

watch(
    () => [
      form.apiBaseUrl,
      form.prompt,
      form.size,
      form.batchSize,
      form.timeoutSeconds,
      form.antiMode,
      singleApiKeyName.value,
      form.layerType,
      form.maxResolution,
      globalForm.prompt,
      globalForm.size,
      globalForm.batchSize,
      globalForm.timeoutSeconds,
      promptQueryFavoritesOnly.value,
      promptQuerySourceType.value,
      themePreset.value,
      singleRunShortcut.value,
      promptLibraryForceSync.value,
      aiChatBaseUrl.value,
      aiChatApiKeyName.value,
      aiChatApiKey.value,
      aiChatUserAvatarDataUrl.value,
      aiChatContextCount.value,
      aiChatMaxTokens.value,
      aiChatSystemPrompt.value,
      aiChatTemperature.value,
      aiChatTopP.value,
      aiChatPresencePenalty.value,
      aiChatFrequencyPenalty.value,
      aiChatJsonModeEnabled.value,
    ],
    () => {
      scheduleSaveLocalState();
    },
);

watch(apiKeyManageSelected, (value) => {
  const selectedName = normalizeApiKeyValue(value);
  if (!selectedName) {
    apiKeyManageDraft.value = "";
    return;
  }
  apiKeyManageDraft.value = managedApiKeyValueMap.value.get(selectedName) || "";
});

watch(singleApiKeyName, (value) => {
  const selectedName = normalizeApiKeyValue(value);
  const selectedValue = managedApiKeyValueMap.value.get(selectedName) || "";
  form.apiKey = selectedValue;
  if (selectedName && managedApiKeyValueMap.value.has(selectedName)) {
    apiKeyManageSelected.value = selectedName;
  }
});

watch(aiChatBaseUrl, (value, previousValue) => {
  const normalized = normalizeAiChatBaseUrl(value);
  if (value !== normalized) {
    aiChatBaseUrl.value = normalized;
    return;
  }
  if (normalized === normalizeAiChatBaseUrl(previousValue)) return;
  clearAiChatModels();
  if (activeTab.value === "ai-chat") {
    void tryAutoLoadAiChatModels();
  }
});

watch(aiChatApiKeyName, (value, previousValue) => {
  if (normalizeAiChatBaseUrl(aiChatBaseUrl.value) !== AI_CHAT_AJIAI_BASE_URL) return;
  const selectedName = normalizeApiKeyValue(value);
  const previousName = normalizeApiKeyValue(previousValue);
  if (selectedName === previousName) return;
  if (!selectedName) {
    clearAiChatModels();
    return;
  }
  if (!managedApiKeyValueMap.value.has(selectedName)) {
    aiChatApiKeyName.value = "";
    return;
  }
  clearAiChatModels();
  if (activeTab.value === "ai-chat") {
    void tryAutoLoadAiChatModels();
  }
});

watch(aiChatApiKey, (value, previousValue) => {
  if (normalizeAiChatBaseUrl(aiChatBaseUrl.value) !== AI_CHAT_COMFLY_BASE_URL) return;
  const nextKey = normalizeApiKeyValue(value);
  const prevKey = normalizeApiKeyValue(previousValue);
  if (nextKey === prevKey) return;
  clearAiChatModels();
  if (activeTab.value === "ai-chat") {
    void tryAutoLoadAiChatModels();
  }
});

watch(promptLibraryForceSync, (value, previousValue) => {
  if (value === previousValue) return;
  if (!state.hostPromptCreate) return;
  void refreshPromptCreateStorageInfo({
    skipRemoteSync: value,
    updateSkipRemoteSyncOnly: true,
  });
});

watch(themePreset, (value, previousValue) => {
  if (value === previousValue) return;
  applyThemePreset(value);
  void saveThemePresetToJson(value);
  logTagged("设置", `已切换主题：${THEME_PRESET_LABEL_MAP[value]}`, "info");
});

watch(activeTab, (tab) => {
  if (tab === "single") {
    void loadManagedApiKeys();
  }
  if (tab === "settings") {
    void loadAiChatApiKeyFromJson({ silent: true });
  }
  if (tab === "ai-chat") {
    void tryAutoLoadAiChatModels();
  }
  if (tab === "prompt-query" && !promptQueryInitialized.value) {
    void loadPromptQueryItems();
  }
});

onMounted(() => {
  window.addEventListener("keydown", onGlobalMainTabKeydown, true);
  window.addEventListener(webviewAPI.HOST_MAIN_TAB_NAV_EVENT, onHostMainTabNav as EventListener);
  window.addEventListener("focus", onWindowFocusRecoverInteraction);
  window.addEventListener("blur", onWindowBlurStopInteraction);
  document.addEventListener("visibilitychange", onDocumentVisibilityRecoverInteraction);
  loadLocalState();
  scheduleFocusMainInteractionAnchor();

  void (async () => {
    await initHostCapabilities();
    await syncCustomFeatureEnabledFromHost();
    await openStartupNoticeIfNeeded();
    await loadThemePresetFromJson();
    message.success("用户个人设置数据加载成功");
    await loadManagedApiKeys();
    await loadAiChatApiKeyFromJson({ silent: true });
    await refreshPromptCreateStorageInfo();
    if (activeTab.value === "prompt-query") {
      await loadPromptQueryItems();
    }

    logTagged("系统", `就绪 ${APP_VERSION}`, "info");
    logTagged(
        "系统",
        `API 挂载: runSingle=${state.hostRunSingle}, quota=${state.hostQuota}, batchCapture=${state.hostBatchCapture}, batchRun=${state.hostBatchRun}, global=${state.hostGlobalPartition}, promptCreate=${state.hostPromptCreate}, promptQuery=${state.hostPromptQuery}, promptDelete=${state.hostPromptDelete}, promptFavorite=${state.hostPromptFavorite}, keyManage=${state.hostApiKeyManage}`,
        state.hostRunSingle &&
        state.hostQuota &&
        state.hostBatchCapture &&
        state.hostBatchRun &&
        state.hostGlobalPartition &&
        state.hostPromptCreate &&
        state.hostPromptQuery &&
        state.hostPromptDelete &&
        state.hostPromptFavorite &&
        state.hostApiKeyManage
            ? "success"
            : "warn",
    );
  })();
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onGlobalMainTabKeydown, true);
  window.removeEventListener(webviewAPI.HOST_MAIN_TAB_NAV_EVENT, onHostMainTabNav as EventListener);
  window.removeEventListener("focus", onWindowFocusRecoverInteraction);
  window.removeEventListener("blur", onWindowBlurStopInteraction);
  document.removeEventListener("visibilitychange", onDocumentVisibilityRecoverInteraction);
  stopImagePreviewPan();
  stopImagePreviewFrameResize();
  if (persistTimer) {
    window.clearTimeout(persistTimer);
    persistTimer = null;
  }
  clearImagePreviewItems();
  safeSaveLocalState();
});
</script>

<template>
  <main class="single-page" @mousedown.capture="scheduleFocusMainInteractionAnchor">
    <button
        ref="mainInteractionFocusAnchorRef"
        class="main-interaction-focus-anchor"
        type="button"
        tabindex="0"
        aria-hidden="true"
    />

    <t-tabs v-model="activeTab" class="main-tabs">
      <t-tab-panel value="single">
        <template #label>单图处理</template>
        <MainTabSingle
          v-model:single-api-key-name="singleApiKeyName"
          :form="form"
          :state="state"
          :size-options="sizeOptions"
          :layer-type-options="layerTypeOptions"
          :api-key-name-select-options="apiKeyNameSelectOptions"
          :run-disabled="runDisabled"
          :add-batch-disabled="addBatchDisabled"
          :quota-disabled="quotaDisabled"
          :quota-info="quotaInfo"
          :preview-image="previewImage"
          :open-single-prompt-quick-save-dialog="openSinglePromptQuickSaveDialog"
          :jump-to-prompt-query="jumpToPromptQuery"
          :clear-prompt="clearPrompt"
          :set-anti-mode="setAntiMode"
          :run-single-image="runSingleImage"
          :add-current-to-batch="addCurrentToBatch"
          :check-quota="checkQuota"
        />
      </t-tab-panel>

      <t-tab-panel value="batch">
        <template #label>
          <span class="tab-label-with-badge">
            批处理
            <span class="tab-badge">{{ batchQueue.length }}</span>
          </span>
        </template>
        <MainTabBatch
          :batch-queue="batchQueue"
          :state="state"
          :run-batch-disabled="runBatchDisabled"
          :clear-batch-queue="clearBatchQueue"
          :remove-batch-task="removeBatchTask"
          :get-task-meta="getTaskMeta"
          :run-batch-queue="runBatchQueue"
        />
      </t-tab-panel>

      <t-tab-panel value="ai-chat">
        <template #label>与AI对话</template>
        <MainTabAiChat
          v-model:ai-chat-base-url="aiChatBaseUrl"
          v-model:ai-chat-api-key-name="aiChatApiKeyName"
          v-model:ai-chat-selected-model="aiChatSelectedModel"
          v-model:ai-chat-input-text="aiChatInputText"
          v-model:ai-chat-context-count="aiChatContextCount"
          v-model:ai-chat-max-tokens="aiChatMaxTokens"
          v-model:ai-chat-system-prompt="aiChatSystemPrompt"
          v-model:ai-chat-temperature="aiChatTemperature"
          v-model:ai-chat-top-p="aiChatTopP"
          v-model:ai-chat-presence-penalty="aiChatPresencePenalty"
          v-model:ai-chat-frequency-penalty="aiChatFrequencyPenalty"
          v-model:ai-chat-json-mode-enabled="aiChatJsonModeEnabled"
          :state="state"
          :ai-chat-base-url-options="aiChatBaseUrlSelectOptions"
          :ai-chat-api-key-name-options="aiChatApiKeyNameSelectOptions"
          :ai-chat-model-loading="aiChatModelLoading"
          :ai-chat-model-select-options="aiChatModelSelectOptions"
          :ai-chat-models="aiChatModels"
          :ai-chat-last-fetch-at="aiChatLastFetchAt"
          :ai-chat-messages="aiChatMessages"
          :ai-chat-user-avatar-data-url="aiChatUserAvatarDataUrl"
          :ai-chat-pending-images="aiChatPendingImages"
          :ai-chat-sending="aiChatSending"
          :ai-chat-uploading-current-image="aiChatUploadingCurrentImage"
          :ai-chat-send-disabled="aiChatSendDisabled"
          :ai-chat-use-json-disabled="aiChatUseJsonDisabled"
          :format-ai-chat-time="formatAiChatTime"
          :handle-ai-chat-copy-code="handleAiChatCopyCode"
          :set-ai-chat-messages-ref="setAiChatMessagesRef"
          :set-ai-chat-upload-input-ref="setAiChatUploadInputRef"
          :on-ai-chat-files-change="onAiChatFilesChange"
          :remove-ai-chat-pending-image="removeAiChatPendingImage"
          :open-ai-chat-image-picker="openAiChatImagePicker"
          :upload-ai-chat-current-selection-image="uploadAiChatCurrentSelectionImage"
          :send-ai-chat-message="sendAiChatMessage"
          :clear-ai-chat-conversation="clearAiChatConversation"
          :load-ai-chat-models="loadAiChatModels"
          :clear-ai-chat-models="clearAiChatModels"
          :apply-ai-chat-last-json-to-single-prompt="applyAiChatLastJsonToSinglePrompt"
        />
      </t-tab-panel>

      <t-tab-panel value="prompt-query">
        <template #label>提示词查询</template>
        <MainTabPromptQuery
          v-model:prompt-query-name-keyword="promptQueryNameKeyword"
          v-model:prompt-query-tag-keyword="promptQueryTagKeyword"
          v-model:prompt-query-favorites-only="promptQueryFavoritesOnly"
          v-model:prompt-query-source-type="promptQuerySourceType"
          v-model:prompt-library-force-sync="promptLibraryForceSync"
          :state="state"
          :prompt-query-items="promptQueryItems"
          :prompt-query-filtered-items="promptQueryFilteredItems"
          :prompt-query-loading="promptQueryLoading"
          :prompt-library-refresh-loading="promptLibraryRefreshLoading"
          :prompt-query-detail-item="promptQueryDetailItem"
          :prompt-query-deleting-name="promptQueryDeletingName"
          :pull-prompt-library-from-cloud="pullPromptLibraryFromCloud"
          :load-prompt-query-items="loadPromptQueryItems"
          :close-prompt-query-detail="closePromptQueryDetail"
          :format-prompt-time="formatPromptTime"
          :toggle-prompt-query-favorite="togglePromptQueryFavorite"
          :delete-prompt-query-item="deletePromptQueryItem"
          :open-prompt-query-edit-dialog="openPromptQueryEditDialog"
          :append-prompt-for-single="appendPromptForSingle"
          :use-prompt-for-single="usePromptForSingle"
          :handle-prompt-query-item-click="handlePromptQueryItemClick"
        />
      </t-tab-panel>

      <t-tab-panel value="prompt-create">
        <template #label>提示词新增</template>
        <MainTabPromptCreate
          :prompt-create-form="promptCreateForm"
          :prompt-create-saving="promptCreateSaving"
          :prompt-create-save-disabled="promptCreateSaveDisabled"
          :prompt-create-storage-path="promptCreateStoragePath"
          :prompt-create-total="promptCreateTotal"
          :save-prompt-create-form="savePromptCreateForm"
          :jump-to-prompt-query="jumpToPromptQuery"
          :clear-prompt-create-form="clearPromptCreateForm"
          :copy-prompt-create-storage-path="copyPromptCreateStoragePath"
        />
      </t-tab-panel>

      <t-tab-panel v-if="showImagePreviewTab" value="image-preview">
        <template #label>图片预览</template>
        <MainTabImagePreview
          :image-preview-items="imagePreviewItems"
          :image-preview-active-index="imagePreviewActiveIndex"
          :image-preview-pan-state="imagePreviewPanState"
          :set-image-preview-input-ref="setImagePreviewInputRef"
          :set-image-preview-carousel-ref="setImagePreviewCarouselRef"
          :on-image-preview-files-change="onImagePreviewFilesChange"
          :open-image-preview-picker="openImagePreviewPicker"
          :clear-image-preview-items="clearImagePreviewItems"
          :go-image-preview-prev="goImagePreviewPrev"
          :on-image-preview-scroll="onImagePreviewScroll"
          :on-image-preview-wheel="onImagePreviewWheel"
          :start-image-preview-pan="startImagePreviewPan"
          :start-image-preview-frame-resize="startImagePreviewFrameResize"
          :remove-image-preview-item="removeImagePreviewItem"
          :go-image-preview-next="goImagePreviewNext"
        />
      </t-tab-panel>

      <t-tab-panel v-if="SHOW_GUIDE_TAB" value="guide">
        <template #label>使用说明</template>
        <MainTabGuide :usage-guide-html="usageGuideHtml" />
      </t-tab-panel>

      <t-tab-panel value="settings">
        <template #label>设置</template>
        <MainTabSettings
          v-model:theme-preset="themePreset"
          v-model:single-run-shortcut="singleRunShortcut"
          v-model:api-key-manage-selected="apiKeyManageSelected"
          v-model:api-key-manage-draft="apiKeyManageDraft"
          v-model:ai-chat-api-key="aiChatApiKey"
          :theme-preset-options="themePresetOptions"
          :managed-api-keys="managedApiKeys"
          :ai-chat-api-key-saving="aiChatApiKeySaving"
          :ai-chat-json-save-supported="aiChatJsonSaveSupported"
          :ai-chat-user-avatar-data-url="aiChatUserAvatarDataUrl"
          :form="form"
          :global-form="globalForm"
          :size-options="sizeOptions"
          :state="state"
          :run-global-partition-disabled="runGlobalPartitionDisabled"
          :global-partition-result="globalPartitionResult"
          :create-managed-api-key="createManagedApiKey"
          :update-managed-api-key="updateManagedApiKey"
          :delete-managed-api-key="deleteManagedApiKey"
          :clear-saved-api-keys="clearSavedApiKeys"
          :on-save-ai-chat-api-key-click="onSaveAiChatApiKeyClick"
          :open-ai-chat-avatar-picker="openAiChatAvatarPicker"
          :clear-ai-chat-user-avatar="clearAiChatUserAvatar"
          :set-ai-chat-avatar-input-ref="setAiChatAvatarInputRef"
          :on-ai-chat-avatar-change="onAiChatAvatarChange"
          :capture-single-run-shortcut="captureSingleRunShortcut"
          :reset-single-run-shortcut="resetSingleRunShortcut"
          :confirm-feature-code="confirmFeatureCode"
          :set-max-resolution-preset="setMaxResolutionPreset"
          :run-global-partition="runGlobalPartition"
        />
      </t-tab-panel>
    </t-tabs>

    <t-dialog
        v-model:visible="startupNoticeVisible"
        header="插件声明"
        dialog-class-name="startup-notice-dialog"
        width="760px"
        placement="center"
        :close-on-overlay-click="false"
        :close-on-esc-keydown="false"
    >
      <div class="startup-notice-body">{{ STARTUP_NOTICE_TEXT }}</div>
      <div class="startup-notice-signature">{{ STARTUP_NOTICE_SIGNATURE }}</div>
      <template #footer>
        <t-button theme="primary" @click="confirmStartupNotice">确认</t-button>
      </template>
    </t-dialog>

    <t-dialog
        v-model:visible="singlePromptQuickSaveVisible"
        header="保存当前提示词"
        dialog-class-name="quick-prompt-save-dialog"
        width="680px"
        placement="center"
        :close-on-overlay-click="!promptCreateSaving"
        :close-on-esc-keydown="!promptCreateSaving"
    >
      <div class="quick-prompt-save-body">
        <section class="field-block">
          <label>提示词名称</label>
          <t-input
              v-model.trim="singlePromptQuickSaveForm.name"
              clearable
              placeholder="请输入提示词名称"
          />
        </section>

        <section class="field-block field-prompt">
          <label>提示词内容</label>
          <t-textarea
              v-model="singlePromptQuickSaveForm.content"
              :maxlength="10000"
              :autosize="{ minRows: 4, maxRows: 16 }"
              placeholder="默认带入当前提示词，可按需微调..."
          />
        </section>

        <section class="field-block">
          <label>提示词描述</label>
          <t-input
              v-model.trim="singlePromptQuickSaveForm.description"
              clearable
              placeholder="请输入提示词描述"
          />
        </section>

        <section class="field-block">
          <label>分类</label>
          <t-input
              v-model.trim="singlePromptQuickSaveForm.category"
              clearable
              placeholder="例如：人物、风景、产品"
          />
        </section>

        <section class="field-block">
          <label>标签</label>
          <t-tag-input
              v-model="singlePromptQuickSaveForm.tags"
              clearable
              :max="30"
              placeholder="输入标签后按回车，可添加多个标签"
          />
        </section>
      </div>
      <template #footer>
        <div class="quick-prompt-save-footer">
          <t-button
              variant="outline"
              theme="default"
              :disabled="promptCreateSaving"
              @click="singlePromptQuickSaveVisible = false"
          >
            取消
          </t-button>
          <t-button
              theme="primary"
              :loading="promptCreateSaving"
              :disabled="promptCreateSaving || !singlePromptQuickSaveForm.name.trim() || !singlePromptQuickSaveForm.content.trim()"
              @click="saveSinglePromptQuickFromDialog"
          >
            {{ promptCreateSaving ? "保存中..." : "保存" }}
          </t-button>
        </div>
      </template>
    </t-dialog>

    <t-dialog
        v-model:visible="promptQueryEditVisible"
        header="修改提示词"
        dialog-class-name="quick-prompt-save-dialog"
        width="680px"
        placement="center"
        :close-on-overlay-click="!promptCreateSaving"
        :close-on-esc-keydown="!promptCreateSaving"
    >
      <div class="quick-prompt-save-body">
        <section class="field-block">
          <label>提示词名称</label>
          <t-input
              v-model.trim="promptQueryEditForm.name"
              clearable
              placeholder="请输入提示词名称"
          />
        </section>

        <section class="field-block field-prompt">
          <label>提示词内容</label>
          <t-textarea
              v-model="promptQueryEditForm.content"
              :maxlength="10000"
              :autosize="{ minRows: 4, maxRows: 16 }"
              placeholder="请输入提示词内容..."
          />
        </section>

        <section class="field-block">
          <label>提示词描述</label>
          <t-input
              v-model.trim="promptQueryEditForm.description"
              clearable
              placeholder="请输入提示词描述"
          />
        </section>

        <section class="field-block">
          <label>分类</label>
          <t-input
              v-model.trim="promptQueryEditForm.category"
              clearable
              placeholder="例如：人物、风景、产品"
          />
        </section>

        <section class="field-block">
          <label>标签</label>
          <t-tag-input
              v-model="promptQueryEditForm.tags"
              clearable
              :max="30"
              placeholder="输入标签后按回车，可添加多个标签"
          />
        </section>
      </div>
      <template #footer>
        <div class="quick-prompt-save-footer">
          <t-button
              variant="outline"
              theme="default"
              :disabled="promptCreateSaving"
              @click="promptQueryEditVisible = false"
          >
            取消
          </t-button>
          <t-button
              theme="primary"
              :loading="promptCreateSaving"
              :disabled="promptCreateSaving || !promptQueryEditForm.name.trim() || !promptQueryEditForm.content.trim()"
              @click="savePromptQueryEditFromDialog"
          >
            {{ promptCreateSaving ? "保存中..." : "保存修改" }}
          </t-button>
        </div>
      </template>
    </t-dialog>

    <div v-if="mainTabOrder.length > 1" class="tab-switch-slider">
      <span class="tab-switch-slider-label">{{ activeTabSliderLabel }}</span>
      <input
          class="tab-switch-slider-input"
          type="range"
          :min="0"
          :max="Math.max(mainTabOrder.length - 1, 0)"
          step="1"
          :value="activeTabIndex"
          @input="onMainTabSliderInput"
      />
    </div>

    <t-card class="panel-card log-card" :bordered="false">
      <div class="log-header">
        <span>运行日志</span>
        <div class="log-actions">
          <t-button size="small" variant="text" theme="primary" @click="logPanelHidden = !logPanelHidden">
            {{ logPanelHidden ? "显示日志" : "隐藏日志" }}
          </t-button>
          <t-button size="small" variant="text" theme="primary" @click="clearLogs">清空日志</t-button>
        </div>
      </div>

      <div v-if="!logPanelHidden" class="log-window">
        <div v-if="state.logs.length === 0" class="log-line log-info">[系统] 系统就绪...</div>
        <div v-for="entry in state.logs" :key="entry.id" class="log-line">
          <span class="log-time">[{{ entry.time }}]</span>
          <span :class="`log-${entry.level}`">{{ entry.message }}</span>
        </div>
      </div>
    </t-card>
  </main>
</template>



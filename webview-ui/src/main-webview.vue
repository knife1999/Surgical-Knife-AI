<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from "vue";
import {MessagePlugin} from "tdesign-vue-next";
import {addHostMessageListener, initWebview} from "./webview-setup";
import * as webviewAPI from "./webview-api";
import MainTabSingle from "./components/main-webview-tabs/main-tab-single.vue";
import MainTabProvider from "./components/main-webview-tabs/main-tab-provider.vue";
import MainTabForge from "./components/main-webview-tabs/main-tab-forge.vue";
import MainTabAiChat from "./components/main-webview-tabs/main-tab-ai-chat.vue";
import MainTabPromptQuery from "./components/main-webview-tabs/main-tab-prompt-query.vue";
import MainTabPromptCreate from "./components/main-webview-tabs/main-tab-prompt-create.vue";
import MainTabImagePreview from "./components/main-webview-tabs/main-tab-image-preview.vue";
import MainTabSettings from "./components/main-webview-tabs/main-tab-settings.vue";
import {AI_CHAT_JSON_MODE_ACTIVATION_TEXT} from "./constants/ai-chat-json-mode";

const {api} = initWebview(webviewAPI);
const IS_DEV = import.meta.env.DEV;

const APP_VERSION = "v2.0.2-hotfix-ctrl-enter";
const DEFAULT_SHOW_IMAGE_PREVIEW_TAB = false;
const DEFAULT_API_BASE_URL = "https://ai.ajiai.top";
const SINGLE_DEFAULT_MODEL = "AJbanana3";
const SINGLE_GEMINI_FLASH_IMAGE_MODEL = "gemini-2.5-flash-image";
const DEFAULT_SINGLE_RUN_SHORTCUT = "Ctrl+Alt+Enter";
const DEFAULT_AI_CHAT_SEND_SHORTCUT = "Alt+Enter";
const DEFAULT_MAIN_TAB_PREV_SHORTCUT = "ArrowLeft";
const DEFAULT_MAIN_TAB_NEXT_SHORTCUT = "ArrowRight";
const DEFAULT_INPUT_PREV_SHORTCUT = "ArrowUp";
const DEFAULT_INPUT_NEXT_SHORTCUT = "ArrowDown";
const AI_CHAT_COMFLY_BASE_URL = "https://ai.comfly.chat";
const AI_CHAT_AJIAI_BASE_URL = "https://ai.ajiai.top";
const DEFAULT_AJIAI_PROVIDER_ID = "provider-default-ajiai";
const DEFAULT_COMFLY_PROVIDER_ID = "provider-default-comfly";
const DEFAULT_AI_CHAT_MODEL = "gemini-3-pro-preview-thinking";
const FORGE_DEFAULT_API_URL = "http://127.0.0.1:7860";
const QUOTA_DIVISOR_GEMINI_1K = 20000;
const QUOTA_DIVISOR_AJ_1K = 750000;
const QUOTA_DIVISOR_AJ_2K = 80000;
const QUOTA_DIVISOR_AJ_4K = 90000;
const DEFAULT_PLUGIN_BACKGROUND_OPACITY = 72;
const DEFAULT_PLUGIN_BACKGROUND_PANEL_OPACITY = 82;
const DEFAULT_PLUGIN_BACKGROUND_BLUR = 0;
const AI_CHAT_BASE_URL_OPTIONS = [AI_CHAT_COMFLY_BASE_URL, AI_CHAT_AJIAI_BASE_URL] as const;
const DEFAULT_AI_CHAT_BASE_URL = AI_CHAT_BASE_URL_OPTIONS[0];
const DEFAULT_SINGLE_PROVIDER_NAME = "默认图像服务商";
const DEFAULT_AI_CHAT_PROVIDER_NAME = "默认AI对话服务商";
const AI_CHAT_PATHS = {
  [AI_CHAT_COMFLY_BASE_URL]: {
    models: "/v1/models",
    completions: "/v1/chat/completions",
    protocol: "openai",
  },
  [AI_CHAT_AJIAI_BASE_URL]: {
    models: "/v1/models",
    completions: "/v1/chat/completions",
    protocol: "openai",
  },
} as const;
const PROVIDER_PROTOCOL_LABEL_MAP: Record<ProviderProtocolMode, string> = {
  gemini: "Gemini",
  openai: "OpenAI",
  both: "Gemini + OpenAI",
};
const providerProtocolModeOptions = [
  { label: "Gemini", value: "gemini" as ProviderProtocolMode },
  { label: "OpenAI", value: "openai" as ProviderProtocolMode },
  { label: "Gemini + OpenAI（默认 Gemini）", value: "both" as ProviderProtocolMode },
];
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
type SingleModelOption = string;
type AntiMode = 0 | 1 | 2;
type LayerType = "rasterized" | "smartObject";
type ForgeGenerateMode = "img2img" | "txt2img";
type ThemePresetKey = "midnight" | "pink" | "kittyPink" | "emerald" | "sunset" | "ocean";
type LogLevel = "info" | "warn" | "error" | "success";
type ShortcutModifier = "ctrl" | "alt" | "shift" | "meta";
type AiChatBaseUrl = string;
type AiChatProtocol = "openai" | "gemini";
type ProviderProtocolMode = "gemini" | "openai" | "both";
type ProviderRuntimeProtocol = "gemini" | "openai";

type ActiveTab =
    | "single"
    | "provider"
    | "forge"
    | "settings"
    | "ai-chat"
    | "prompt-query"
    | "image-preview";

const TAB_LABEL_MAP: Record<ActiveTab, string> = {
  single: "图像工作台",
  provider: "服务商配置",
  forge: "Forge模式",
  settings: "设置",
  "ai-chat": "与AI对话",
  "prompt-query": "提示词查询",
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
  responseLogs?: string[];
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
  providerProtocol: ProviderRuntimeProtocol;
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

interface ForgeGenerateResult {
  mode: ForgeGenerateMode;
  successCount: number;
  failureCount: number;
  totalCount: number;
  errorMessages: string[];
}

interface ForgePresetData {
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
}

interface ForgePresetItem {
  id: string;
  name: string;
  category: string;
  favorite: 0 | 1;
  createdAt: string;
  updatedAt: string;
  data: ForgePresetData;
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

interface PromptCreateAiAutoFillResult {
  name: string;
  description: string;
  category: string;
  tags: string[];
}

interface PromptQueryAiFilterResult {
  nameKeyword: string;
  descriptionKeyword: string;
  tagKeyword: string;
  sourceType: "" | "local" | "online";
  favoritesOnly: boolean;
}

interface SinglePromptQueryCommand {
  active: boolean;
  modeLabel: string;
  keyword: string;
  nameKeywords: string[];
  tagKeywords: string[];
  contentKeywords: string[];
  hasScopedFilter: boolean;
  hasKeyword: boolean;
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

interface ProviderItem {
  id: string;
  name: string;
  baseUrl: string;
  key: string;
  protocolMode: ProviderProtocolMode;
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

type PromptHistoryEventType =
  | "single-workbench"
  | "ai-chat-prompt"
  | "ai-chat-user-record"
  | "ai-chat-assistant-record";

interface PromptHistoryRecordItem {
  id: number;
  eventType: PromptHistoryEventType;
  content: string;
  createdAt: number;
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
  forgeTestConnection?: boolean;
  forgeFetchModels?: boolean;
  forgeFetchSamplers?: boolean;
  forgeFetchControlNetModules?: boolean;
  forgeFetchControlNetModels?: boolean;
  forgeFetchLoras?: boolean;
  forgeGenerateImages?: boolean;
  forgeInterrupt?: boolean;
  youdaoTranslate?: boolean;
  cloudLogin?: boolean;
  cloudLogout?: boolean;
  cloudRestoreSession?: boolean;
  cloudGetUserPoints?: boolean;
  cloudGetForgeUrl?: boolean;
  cloudTestForgeConnection?: boolean;
  cloudForgeGenerateImages?: boolean;
  listForgePresets?: boolean;
  saveForgePreset?: boolean;
  deleteForgePreset?: boolean;
  toggleForgePresetFavorite?: boolean;
  exportForgePresets?: boolean;
  importForgePresets?: boolean;
  undoLastAction?: boolean;
  reverseAntiTruncationEffect?: boolean;
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
  saveUiBackgroundSettings?: boolean;
  readUiBackgroundSettings?: boolean;
  savePromptHistoryRecords?: boolean;
  readPromptHistoryRecords?: boolean;
  saveStartupNoticeConfirmed?: boolean;
  readStartupNoticeConfirmed?: boolean;
  saveSingleRunConfirmSkipDate?: boolean;
  readSingleRunConfirmSkipDate?: boolean;
  saveCustomFeatureEnabled?: boolean;
  readCustomFeatureEnabled?: boolean;
  stampVisibleLayer?: boolean;
  saveProviderConfigs?: boolean;
  readProviderConfigs?: boolean;
  updateManagedApiKey?: boolean;
  deleteManagedApiKey?: boolean;
  clearManagedApiKeys?: boolean;
}

const STORAGE_KEYS = {
  pageZoom: "page_zoom",
  selectedApiKeyName: "selected_api_key_name",
  selectedSingleProviderId: "selected_single_provider_id",
  selectedAiChatProviderId: "selected_ai_chat_provider_id",
  providerConfigs: "provider_configs_v1",
  singleProviders: "single_providers_v1",
  aiChatProviders: "ai_chat_providers_v1",
  tabShowProvider: "tab_show_provider_v1",
  tabShowForge: "tab_show_forge_v1",
  tabShowPromptQuery: "tab_show_prompt_query_v1",
  startupNoticeConfirmed: "startup_notice_confirmed_v1",
  customFeatureEnabled: "custom_feature_enabled_v1",
  promptQueryFavoritesOnly: "prompt_query_favorites_only",
  promptQuerySourceType: "prompt_query_source_type",
  promptLibraryForceSync: "prompt_library_force_sync",
  aiChatBaseUrl: "ai_chat_base_url",
  aiChatApiKeyName: "ai_chat_api_key_name",
  aiChatSelectedModel: "ai_chat_selected_model",
  aiChatOperationModel: "ai_chat_operation_model",
  aiChatApiKey: "ai_chat_api_key",
  aiChatUserAvatar: "ai_chat_user_avatar",
  aiChatContextCount: "ai_chat_context_count",
  aiChatTimeoutSeconds: "ai_chat_timeout_seconds",
  aiChatMaxTokens: "ai_chat_max_tokens",
  aiChatSystemPrompt: "ai_chat_system_prompt",
  aiChatTemperature: "ai_chat_temperature",
  aiChatTopP: "ai_chat_top_p",
  aiChatPresencePenalty: "ai_chat_presence_penalty",
  aiChatFrequencyPenalty: "ai_chat_frequency_penalty",
  aiChatJsonModeEnabled: "ai_chat_json_mode_enabled",
  pluginBackgroundImage: "plugin_background_image_data_url",
  pluginBackgroundOpacity: "plugin_background_opacity",
  pluginBackgroundPanelOpacity: "plugin_background_panel_opacity",
  pluginBackgroundBlur: "plugin_background_blur",
  themePreset: "ui_theme_preset",
  singleRunShortcut: "single_run_shortcut",
  aiChatSendShortcut: "ai_chat_send_shortcut",
  mainTabPrevShortcut: "main_tab_prev_shortcut",
  mainTabNextShortcut: "main_tab_next_shortcut",
  inputPrevShortcut: "input_prev_shortcut",
  inputNextShortcut: "input_next_shortcut",
  apiBaseUrl: "single_api_base_url",
  model: "single_model",
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
  promptHistoryRecords: "prompt_history_records_v1",
  forgeApiUrl: "forge_api_url",
  forgeMode: "forge_mode",
  forgePrompt: "forge_prompt",
  forgeNegativePrompt: "forge_negative_prompt",
  forgeModel: "forge_model",
  forgeSampler: "forge_sampler",
  forgeScheduler: "forge_scheduler",
  forgeSteps: "forge_steps",
  forgeCfgScale: "forge_cfg_scale",
  forgeDenoise: "forge_denoise",
  forgeWidth: "forge_width",
  forgeHeight: "forge_height",
  forgeBatchSize: "forge_batch_size",
  forgeSeed: "forge_seed",
  forgeLora: "forge_lora",
  forgeLoraWeight: "forge_lora_weight",
  forgeCnEnabled: "forge_cn_enabled",
  forgeCnModule: "forge_cn_module",
  forgeCnModel: "forge_cn_model",
  forgeCnWeight: "forge_cn_weight",
  forgeTimeoutSeconds: "forge_timeout_seconds",
  forgeMaxResolution: "forge_max_resolution",
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
const SINGLE_WORKBENCH_SIZE = "Auto" as SizeOption;

const singleModelOptions = [
  {label: SINGLE_DEFAULT_MODEL, value: SINGLE_DEFAULT_MODEL as SingleModelOption},
  {label: SINGLE_GEMINI_FLASH_IMAGE_MODEL, value: SINGLE_GEMINI_FLASH_IMAGE_MODEL as SingleModelOption},
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
  model: SINGLE_DEFAULT_MODEL as SingleModelOption,
  prompt: "",
  size: SINGLE_WORKBENCH_SIZE,
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

const forgeForm = reactive({
  apiUrl: FORGE_DEFAULT_API_URL,
  mode: "img2img" as ForgeGenerateMode,
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
  reversingAntiAction: false,
  batchRunning: false,
  runningGlobalPartition: false,
  logs: [] as LogEntry[],
  hostRunSingle: false,
  hostQuota: false,
  hostBatchCapture: false,
  hostAiChatCurrentSelectionImage: false,
  hostBatchRun: false,
  hostForge: false,
  hostForgePresets: false,
  hostForgePresetIO: false,
  hostForgeCloud: false,
  hostYoudaoTranslate: false,
  hostReverseAntiAction: false,
  hostGlobalPartition: false,
  hostPromptCreate: false,
  hostPromptQuery: false,
  hostPromptDelete: false,
  hostPromptFavorite: false,
  hostPromptHistorySave: false,
  hostPromptHistoryRead: false,
  hostSingleRunConfirmPreference: false,
  hostStampVisibleLayer: false,
  hostProviderConfig: false,
  hostApiKeyManage: false,
});

const activeTab = ref<ActiveTab>("single");
const showProviderTab = ref(true);
const showForgeTab = ref(false);
const showPromptQueryTab = ref(true);
const previewImage = ref("");
const quotaInfo = ref<QuotaResult | null>(null);
const batchQueue = ref<BatchTaskItem[]>([]);
const providerItems = ref<ProviderItem[]>([]);
const singleProviderId = ref("");
const aiChatProviderId = ref("");
const providerManageSelected = ref("");
const providerManageName = ref("");
const providerManageBaseUrl = ref("");
const providerManageKey = ref("");
const providerManageProtocolMode = ref<ProviderProtocolMode>("gemini");
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
const promptCreateAiFilling = ref(false);
const promptCreateDialogVisible = ref(false);
const singlePromptQuickSaveVisible = ref(false);
const promptQueryEditVisible = ref(false);
const promptQueryEditOriginName = ref("");
const startupNoticeVisible = ref(false);
const singleRunConfirmVisible = ref(false);
const singleRunConfirmSubmitting = ref(false);
const singleRunConfirmStampLayer = ref(false);
const singleRunConfirmSkipDate = ref("");
const promptCreateStoragePath = ref("(未获取)");
const promptCreateTotal = ref(0);
const promptQueryNameKeyword = ref("");
const promptQueryDescriptionKeyword = ref("");
const promptQueryTagKeyword = ref("");
const promptQueryAiInput = ref("");
const promptQueryAiLoading = ref(false);
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
const aiChatSelectedModel = ref(DEFAULT_AI_CHAT_MODEL);
const aiChatOperationModel = ref(DEFAULT_AI_CHAT_MODEL);
const aiChatModels = ref<AiModelItem[]>([]);
const aiChatLastFetchAt = ref("");
const aiChatLoadedApiKey = ref("");
const aiChatLoadedBaseUrl = ref<AiChatBaseUrl | "">("");
const aiChatLoadedProtocol = ref<AiChatProtocol | "">("");
const aiChatSending = ref(false);
const aiChatUploadingCurrentImage = ref(false);
const aiChatInputText = ref("");
const aiChatPendingImages = ref<AiChatImageItem[]>([]);
const aiChatMessages = ref<AiChatMessageItem[]>([]);
const aiChatContextCount = ref(12);
const aiChatTimeoutSeconds = ref(120);
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
const pluginBackgroundInputRef = ref<HTMLInputElement | null>(null);
const aiChatUserAvatarDataUrl = ref("");
const pluginBackgroundImageDataUrl = ref("");
const pluginBackgroundOpacity = ref(DEFAULT_PLUGIN_BACKGROUND_OPACITY);
const pluginBackgroundPanelOpacity = ref(DEFAULT_PLUGIN_BACKGROUND_PANEL_OPACITY);
const pluginBackgroundBlur = ref(DEFAULT_PLUGIN_BACKGROUND_BLUR);
const aiChatMessagesRef = ref<HTMLDivElement | null>(null);
const logPanelHidden = ref(false);
const themePreset = ref<ThemePresetKey>("midnight");
const singleRunShortcut = ref(DEFAULT_SINGLE_RUN_SHORTCUT);
const aiChatSendShortcut = ref(DEFAULT_AI_CHAT_SEND_SHORTCUT);
const mainTabPrevShortcut = ref(DEFAULT_MAIN_TAB_PREV_SHORTCUT);
const mainTabNextShortcut = ref(DEFAULT_MAIN_TAB_NEXT_SHORTCUT);
const inputPrevShortcut = ref(DEFAULT_INPUT_PREV_SHORTCUT);
const inputNextShortcut = ref(DEFAULT_INPUT_NEXT_SHORTCUT);
const customFeatureEnabled = ref(false);
const pageZoom = ref(1);
const promptHistoryRecords = ref<PromptHistoryRecordItem[]>([]);
const promptHistoryDialogVisible = ref(false);
const promptHistoryKeyword = ref("");
const promptHistoryEventType = ref<PromptHistoryEventType | "">("");
const promptHistoryExpandedRecordIds = ref<number[]>([]);
const forgeConnected = ref(false);
const forgeConnecting = ref(false);
const forgeLoadingMeta = ref(false);
const forgeRunning = ref(false);
const forgeStatusText = ref("等待手动连接");
const forgeCloudUser = ref<any | null>(null);
const forgeCloudPoints = ref(0);
const forgeCloudEncryptedUrl = ref("");
const forgeCloudConnected = ref(false);
const forgeCloudBusy = ref(false);
const forgeCloudAuthVisible = ref(false);
const forgeCloudAuthSubmitting = ref(false);
const forgeCloudRememberedReady = ref(false);
const forgeCloudAuthForm = reactive({
  email: "",
  password: "",
  remember: true,
});
const forgeModelItems = ref<string[]>([]);
const forgeSamplerItems = ref<string[]>([]);
const forgeCnModuleItems = ref<string[]>([]);
const forgeCnModelItems = ref<string[]>([]);
const forgeLoraItems = ref<string[]>([]);
const forgePresetItems = ref<ForgePresetItem[]>([]);
const forgePresetLoading = ref(false);
const forgePresetSaving = ref(false);
const forgePresetImporting = ref(false);
const forgePresetExporting = ref(false);
const forgePresetKeyword = ref("");
const forgePresetCategory = ref("");
const forgePresetFavoritesOnly = ref(false);
const forgePresetSaveVisible = ref(false);
const forgePresetSaveForm = reactive({
  id: "",
  name: "",
  category: "custom",
});
let aiChatMessageIdSeed = 0;
let aiChatImageIdSeed = 0;
let aiChatRequestAbortController: AbortController | null = null;
let aiChatAbortByUser = false;
let imagePreviewIdSeed = 0;
let promptHistoryIdSeed = 0;
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

const SINGLE_PROMPT_QUERY_MODE_LABEL_MAP: Record<"all" | "name" | "tag" | "content", string> = {
  all: "全字段",
  name: "名称",
  tag: "标签",
  content: "内容",
};
const setPluginBackgroundInputRef = (el: HTMLInputElement | null) => {
  pluginBackgroundInputRef.value = el;
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
const PAGE_ZOOM_MIN = 0.6;
const PAGE_ZOOM_MAX = 2;
const PAGE_ZOOM_STEP = 0.1;
const PROMPT_QUERY_DETAIL_DOUBLE_CLICK_MS = 320;
const HOST_NAV_DEDUP_MS = 120;
const HOST_AI_CHAT_SEND_DEDUP_MS = 120;
const HOST_HISTORY_SEARCH_DEDUP_MS = 180;
const AI_CHAT_IMAGE_MAX_EDGE = 1600;
const AI_CHAT_IMAGE_TARGET_BYTES = 1.5 * 1024 * 1024;
const AI_CHAT_IMAGE_JPEG_QUALITY_STEPS = [0.86, 0.78, 0.7, 0.62];
const PLUGIN_BACKGROUND_IMAGE_MAX_EDGE = 2400;
const PLUGIN_BACKGROUND_IMAGE_TARGET_BYTES = 2.2 * 1024 * 1024;
const PLUGIN_BACKGROUND_IMAGE_FORCE_COMPRESS_BYTES = 2.5 * 1024 * 1024;
const PROMPT_HISTORY_MAX_ITEMS = 600;
const PROMPT_HISTORY_MAX_CONTENT_LENGTH = 1600;
const PROMPT_HISTORY_EVENT_LABEL_MAP: Record<PromptHistoryEventType, string> = {
  "single-workbench": "图像工作台提示词",
  "ai-chat-prompt": "AI对话提示词",
  "ai-chat-user-record": "AI对话记录(你)",
  "ai-chat-assistant-record": "AI对话记录(AI)",
};

const showImagePreviewTab = computed(
  () => DEFAULT_SHOW_IMAGE_PREVIEW_TAB || customFeatureEnabled.value,
);

const mainTabOrder = computed<ActiveTab[]>(() => {
  const tabs: ActiveTab[] = ["single"];
  if (showProviderTab.value) tabs.push("provider");
  if (showForgeTab.value) tabs.push("forge");
  tabs.push("ai-chat");
  if (showPromptQueryTab.value) tabs.push("prompt-query");
  if (showImagePreviewTab.value) tabs.push("image-preview");
  tabs.push("settings");
  return tabs;
});

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

watch(mainTabOrder, (tabs) => {
  if (!tabs.includes(activeTab.value)) {
    activeTab.value = tabs[0] || "single";
  }
});

const promptHistoryEventOptions = computed(() => [
  { label: "全部事件", value: "" },
  ...(
    Object.entries(PROMPT_HISTORY_EVENT_LABEL_MAP) as Array<[PromptHistoryEventType, string]>
  ).map(([value, label]) => ({ value, label })),
]);

const promptHistoryFilteredItems = computed(() => {
  const keyword = String(promptHistoryKeyword.value ?? "").trim().toLowerCase();
  const eventType = promptHistoryEventType.value;
  return promptHistoryRecords.value.filter((item) => {
    if (eventType && item.eventType !== eventType) return false;
    if (!keyword) return true;
    const eventLabel = PROMPT_HISTORY_EVENT_LABEL_MAP[item.eventType] || item.eventType;
    const content = String(item.content ?? "");
    return `${eventLabel}\n${content}`.toLowerCase().includes(keyword);
  });
});

const forgeModelOptions = computed(() => mapForgeSelectOptions(forgeModelItems.value));
const forgeSamplerOptions = computed(() => mapForgeSelectOptions(forgeSamplerItems.value));
const forgeCnModuleOptions = computed(() => {
  const merged = ["none", ...forgeCnModuleItems.value.filter((item) => item.toLowerCase() !== "none")];
  return mapForgeSelectOptions(merged);
});
const forgeCnModelOptions = computed(() => {
  const merged = ["None", ...forgeCnModelItems.value.filter((item) => item.toLowerCase() !== "none")];
  return mapForgeSelectOptions(merged);
});
const forgeLoraOptions = computed(() => {
  const merged = ["", ...forgeLoraItems.value];
  return merged.map((item) => ({
    label: item || "无",
    value: item,
  }));
});

const forgeRuntimeConnected = computed(() =>
  forgeConnected.value || forgeCloudConnected.value,
);

const forgeDisplayStatusText = computed(() => {
  if (forgeCloudConnected.value) {
    return `云Forge已连接${forgeCloudPoints.value > 0 ? ` · 积分 ${forgeCloudPoints.value}` : ""}`;
  }
  return forgeStatusText.value;
});

const forgePresetCategoryOptions = computed(() => {
  const categories = Array.from(
    new Set(
      forgePresetItems.value
        .map((item) => String(item?.category ?? "").trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
  return [
    { label: "全部分类", value: "" },
    ...categories.map((category) => ({ label: category, value: category })),
  ];
});

const forgePresetFilteredItems = computed(() => {
  const keyword = String(forgePresetKeyword.value ?? "").trim().toLowerCase();
  const category = String(forgePresetCategory.value ?? "").trim();
  const favoritesOnly = Boolean(forgePresetFavoritesOnly.value);
  return forgePresetItems.value.filter((item) => {
    if (favoritesOnly && Number(item.favorite) !== 1) return false;
    if (category && String(item.category ?? "").trim() !== category) return false;
    if (!keyword) return true;
    const name = String(item.name ?? "").toLowerCase();
    const categoryText = String(item.category ?? "").toLowerCase();
    const prompt = String(item.data?.prompt ?? "").toLowerCase();
    return `${name}\n${categoryText}\n${prompt}`.includes(keyword);
  });
});

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

const aiChatModifierLatch = {
  ctrl: false,
  shift: false,
  alt: false,
  meta: false,
};

const resetAiChatModifierLatch = () => {
  aiChatModifierLatch.ctrl = false;
  aiChatModifierLatch.shift = false;
  aiChatModifierLatch.alt = false;
  aiChatModifierLatch.meta = false;
};

const syncAiChatModifierLatch = (event: KeyboardEvent) => {
  const key = normalizeKeyboardEventKey(event);
  const ctrlPressed = Boolean(event.ctrlKey || event.getModifierState?.("Control"));
  const shiftPressed = Boolean(event.shiftKey || event.getModifierState?.("Shift"));
  const altPressed = Boolean(event.altKey || event.getModifierState?.("Alt"));
  const metaPressed = Boolean(event.metaKey || event.getModifierState?.("Meta"));
  const isKeyup = event.type === "keyup";

  if (!isKeyup) {
    if (ctrlPressed || key === "control" || key === "ctrl") aiChatModifierLatch.ctrl = true;
    if (shiftPressed || key === "shift") aiChatModifierLatch.shift = true;
    if (altPressed || key === "alt") aiChatModifierLatch.alt = true;
    if (metaPressed || key === "meta") aiChatModifierLatch.meta = true;
    return;
  }

  if (key === "control" || key === "ctrl") {
    aiChatModifierLatch.ctrl = false;
  } else if (ctrlPressed) {
    aiChatModifierLatch.ctrl = true;
  }
  if (key === "shift") {
    aiChatModifierLatch.shift = false;
  } else if (shiftPressed) {
    aiChatModifierLatch.shift = true;
  }
  if (key === "alt") {
    aiChatModifierLatch.alt = false;
  } else if (altPressed) {
    aiChatModifierLatch.alt = true;
  }
  if (key === "meta") {
    aiChatModifierLatch.meta = false;
  } else if (metaPressed) {
    aiChatModifierLatch.meta = true;
  }
};

const getAiChatEventModifiers = (event: KeyboardEvent) => {
  const ctrlPressed = Boolean(event.ctrlKey || event.getModifierState?.("Control") || aiChatModifierLatch.ctrl);
  const shiftPressed = Boolean(event.shiftKey || event.getModifierState?.("Shift") || aiChatModifierLatch.shift);
  const altPressed = Boolean(event.altKey || event.getModifierState?.("Alt") || aiChatModifierLatch.alt);
  const metaPressed = Boolean(event.metaKey || event.getModifierState?.("Meta") || aiChatModifierLatch.meta);
  return { ctrlPressed, shiftPressed, altPressed, metaPressed };
};

function getEffectiveAiChatSendShortcut(): ShortcutDefinition {
  return (
    parseShortcutDefinition(aiChatSendShortcut.value) ||
    parseShortcutDefinition(DEFAULT_AI_CHAT_SEND_SHORTCUT) || {
      key: "enter",
      ctrl: false,
      alt: true,
      shift: false,
      meta: false,
    }
  );
}

const matchAiChatEventWithShortcut = (event: KeyboardEvent, config: ShortcutDefinition) => {
  const key = normalizeKeyboardEventKey(event);
  const code = String(event.code || "").trim().toLowerCase();
  const keyCode = Number((event as any).keyCode ?? (event as any).which ?? 0);
  const isEnterLike =
    key === "enter" ||
    key === "return" ||
    code === "enter" ||
    code === "numpadenter" ||
    keyCode === 13;
  const keyMatched = config.key === "enter" ? isEnterLike : key === config.key;
  const { ctrlPressed, altPressed, shiftPressed, metaPressed } = getAiChatEventModifiers(event);
  return (
    keyMatched &&
    ctrlPressed === config.ctrl &&
    altPressed === config.alt &&
    shiftPressed === config.shift &&
    metaPressed === config.meta
  );
};

const isAiChatSendShortcutEvent = (event: KeyboardEvent) => {
  return matchAiChatEventWithShortcut(event, getEffectiveAiChatSendShortcut());
};

const isAiChatShortcutRelatedEvent = (event: KeyboardEvent) => {
  const key = normalizeKeyboardEventKey(event);
  const config = getEffectiveAiChatSendShortcut();
  const { ctrlPressed, altPressed, shiftPressed, metaPressed } = getAiChatEventModifiers(event);
  if (key === config.key) return true;
  if (config.ctrl && ctrlPressed) return true;
  if (config.alt && altPressed) return true;
  if (config.shift && shiftPressed) return true;
  if (config.meta && metaPressed) return true;
  return false;
};

const getAiChatSendShortcutLabel = () =>
  formatShortcutDefinition(getEffectiveAiChatSendShortcut());

const shouldAcceptHostAiChatSendForward = () => {
  const config = getEffectiveAiChatSendShortcut();
  return (
    config.key === "enter" &&
    !config.ctrl &&
    config.alt &&
    !config.shift &&
    !config.meta
  );
};

const onAiChatShortcutDebug = (message: string, level: LogLevel = "info") => {
  void message;
  void level;
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

const getEffectiveShortcut = (value: string, fallback: string) =>
  parseShortcutDefinition(value) || parseShortcutDefinition(fallback)!;

const getEffectiveSingleRunShortcut = () =>
  getEffectiveShortcut(singleRunShortcut.value, DEFAULT_SINGLE_RUN_SHORTCUT);

const getEffectiveMainTabPrevShortcut = () =>
  getEffectiveShortcut(mainTabPrevShortcut.value, DEFAULT_MAIN_TAB_PREV_SHORTCUT);

const getEffectiveMainTabNextShortcut = () =>
  getEffectiveShortcut(mainTabNextShortcut.value, DEFAULT_MAIN_TAB_NEXT_SHORTCUT);

const getEffectiveInputPrevShortcut = () =>
  getEffectiveShortcut(inputPrevShortcut.value, DEFAULT_INPUT_PREV_SHORTCUT);

const getEffectiveInputNextShortcut = () =>
  getEffectiveShortcut(inputNextShortcut.value, DEFAULT_INPUT_NEXT_SHORTCUT);

const captureShortcut = (event: KeyboardEvent, options: {
  requireModifier: boolean;
  onCaptured: (value: string) => void;
  successMessage: (value: string) => string;
}) => {
  if (event.repeat) return;
  if (event.isComposing) return;
  const shortcut = buildShortcutFromKeyboardEvent(event);
  if (!shortcut) return;
  if (
    options.requireModifier &&
    !shortcut.ctrl &&
    !shortcut.alt &&
    !shortcut.shift &&
    !shortcut.meta
  ) {
    message.warning("快捷键至少包含一个修饰键（Ctrl/Alt/Shift/Meta）");
    return;
  }
  const value = formatShortcutDefinition(shortcut);
  options.onCaptured(value);
  scheduleSaveLocalState();
  message.success(options.successMessage(value));
};

const captureSingleRunShortcut = (event: KeyboardEvent) => {
  captureShortcut(event, {
    requireModifier: true,
    onCaptured: (value) => {
      singleRunShortcut.value = value;
    },
    successMessage: (value) => `已设置“单图开始生成”快捷键：${value}`,
  });
};

const captureAiChatSendShortcut = (event: KeyboardEvent) => {
  captureShortcut(event, {
    requireModifier: true,
    onCaptured: (value) => {
      aiChatSendShortcut.value = value;
    },
    successMessage: (value) => `已设置“AI对话发送消息”快捷键：${value}`,
  });
};

const captureMainTabPrevShortcut = (event: KeyboardEvent) => {
  captureShortcut(event, {
    requireModifier: false,
    onCaptured: (value) => {
      mainTabPrevShortcut.value = value;
    },
    successMessage: (value) => `已设置“切换到上一个页签”快捷键：${value}`,
  });
};

const captureMainTabNextShortcut = (event: KeyboardEvent) => {
  captureShortcut(event, {
    requireModifier: false,
    onCaptured: (value) => {
      mainTabNextShortcut.value = value;
    },
    successMessage: (value) => `已设置“切换到下一个页签”快捷键：${value}`,
  });
};

const captureInputPrevShortcut = (event: KeyboardEvent) => {
  captureShortcut(event, {
    requireModifier: false,
    onCaptured: (value) => {
      inputPrevShortcut.value = value;
    },
    successMessage: (value) => `已设置“焦点上移输入框”快捷键：${value}`,
  });
};

const captureInputNextShortcut = (event: KeyboardEvent) => {
  captureShortcut(event, {
    requireModifier: false,
    onCaptured: (value) => {
      inputNextShortcut.value = value;
    },
    successMessage: (value) => `已设置“焦点下移输入框”快捷键：${value}`,
  });
};

const resetSingleRunShortcut = () => {
  singleRunShortcut.value = DEFAULT_SINGLE_RUN_SHORTCUT;
  scheduleSaveLocalState();
  message.success(`已恢复“单图开始生成”默认快捷键：${DEFAULT_SINGLE_RUN_SHORTCUT}`);
};

const resetAiChatSendShortcut = () => {
  aiChatSendShortcut.value = DEFAULT_AI_CHAT_SEND_SHORTCUT;
  scheduleSaveLocalState();
  message.success(`已恢复“AI对话发送消息”默认快捷键：${DEFAULT_AI_CHAT_SEND_SHORTCUT}`);
};

const resetMainTabPrevShortcut = () => {
  mainTabPrevShortcut.value = DEFAULT_MAIN_TAB_PREV_SHORTCUT;
  scheduleSaveLocalState();
  message.success(`已恢复“切换到上一个页签”默认快捷键：${DEFAULT_MAIN_TAB_PREV_SHORTCUT}`);
};

const resetMainTabNextShortcut = () => {
  mainTabNextShortcut.value = DEFAULT_MAIN_TAB_NEXT_SHORTCUT;
  scheduleSaveLocalState();
  message.success(`已恢复“切换到下一个页签”默认快捷键：${DEFAULT_MAIN_TAB_NEXT_SHORTCUT}`);
};

const resetInputPrevShortcut = () => {
  inputPrevShortcut.value = DEFAULT_INPUT_PREV_SHORTCUT;
  scheduleSaveLocalState();
  message.success(`已恢复“焦点上移输入框”默认快捷键：${DEFAULT_INPUT_PREV_SHORTCUT}`);
};

const resetInputNextShortcut = () => {
  inputNextShortcut.value = DEFAULT_INPUT_NEXT_SHORTCUT;
  scheduleSaveLocalState();
  message.success(`已恢复“焦点下移输入框”默认快捷键：${DEFAULT_INPUT_NEXT_SHORTCUT}`);
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

const reverseAntiActionDisabled = computed(
    () => state.reversingAntiAction || !state.hostReverseAntiAction || form.antiMode === 0,
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

const promptCreateAiFillDisabled = computed(() => {
  if (promptCreateAiFilling.value || promptCreateSaving.value || aiChatSending.value || aiChatModelLoading.value) return true;
  if (!normalizeApiKeyValue(promptCreateForm.content)) return true;
  const baseUrl = normalizeAiChatBaseUrl(aiChatBaseUrl.value);
  const key = resolveAiChatRequestApiKey(baseUrl);
  if (!key) return true;
  if (!normalizeApiKeyValue(aiChatOperationModel.value)) return true;
  return false;
});

const promptQueryAiDisabled = computed(() => {
  if (promptQueryAiLoading.value || promptQueryLoading.value || aiChatSending.value || aiChatModelLoading.value) return true;
  if (!normalizeApiKeyValue(promptQueryAiInput.value)) return true;
  const baseUrl = normalizeAiChatBaseUrl(aiChatBaseUrl.value);
  const key = resolveAiChatRequestApiKey(baseUrl);
  if (!key) return true;
  if (!normalizeApiKeyValue(aiChatOperationModel.value)) return true;
  return false;
});

const promptQueryFilteredItems = computed(() => {
  const nameKeyword = promptQueryNameKeyword.value.trim().toLowerCase();
  const descriptionKeyword = promptQueryDescriptionKeyword.value.trim().toLowerCase();
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
    const descriptionMatch =
      !descriptionKeyword ||
      String(item.description ?? "").toLowerCase().includes(descriptionKeyword);
    const tagMatch =
        !tagKeyword ||
        (Array.isArray(item.tags) &&
            item.tags.some((tag) => String(tag ?? "").toLowerCase().includes(tagKeyword)));
    return nameMatch && descriptionMatch && tagMatch;
  });
});

const parseSinglePromptQueryCommand = (value: unknown): SinglePromptQueryCommand => {
  const lines = String(value ?? "").replace(/\r\n/g, "\n").split("\n").map((line) => line.trim());
  const firstLine = lines[0] || "";
  const nonEmptyLines = lines.filter((line) => line.length > 0);
  const lastLine = nonEmptyLines[nonEmptyLines.length - 1] || "";
  const commandLine = firstLine.startsWith("$")
      ? firstLine
      : lastLine.startsWith("$")
          ? lastLine
          : "";
  if (!commandLine.startsWith("$")) {
    return {
      active: false,
      modeLabel: SINGLE_PROMPT_QUERY_MODE_LABEL_MAP.all,
      keyword: "",
      nameKeywords: [],
      tagKeywords: [],
      contentKeywords: [],
      hasScopedFilter: false,
      hasKeyword: false,
    };
  }

  const body = commandLine.slice(1).trim();
  const nameKeywords: string[] = [];
  const tagKeywords: string[] = [];
  const contentKeywords: string[] = [];
  const optionPattern = /(?:^|\s)-(n|t|c)\s+(.+?)(?=(?:\s-[ntc]\s+)|$)/gi;
  const scopedRest = body.replace(optionPattern, (_, rawFlag: string, rawValue: string) => {
    const flag = String(rawFlag || "").toLowerCase();
    const keyword = String(rawValue || "").trim();
    if (!keyword) return " ";
    if (flag === "n") nameKeywords.push(keyword);
    if (flag === "t") tagKeywords.push(keyword);
    if (flag === "c") contentKeywords.push(keyword);
    return " ";
  });
  const bareFieldFlags = new Set<"n" | "t" | "c">();
  const bareFlagPattern = /(?:^|\s)-(n|t|c)(?=\s|$)/gi;
  const keywordRest = scopedRest.replace(bareFlagPattern, (_, rawFlag: string) => {
    const flag = String(rawFlag || "").toLowerCase();
    if (flag === "n" || flag === "t" || flag === "c") {
      bareFieldFlags.add(flag);
    }
    return " ";
  });
  const keyword = keywordRest.trim();
  if (keyword) {
    if (bareFieldFlags.has("n")) nameKeywords.push(keyword);
    if (bareFieldFlags.has("t")) tagKeywords.push(keyword);
    if (bareFieldFlags.has("c")) contentKeywords.push(keyword);
  }
  const hasScopedFilter = nameKeywords.length > 0 || tagKeywords.length > 0 || contentKeywords.length > 0;
  const hasKeyword = Boolean(keyword) || hasScopedFilter;
  const modeParts: string[] = [];
  if (nameKeywords.length > 0) modeParts.push("名称");
  if (tagKeywords.length > 0) modeParts.push("标签");
  if (contentKeywords.length > 0) modeParts.push("内容");
  const modeLabel =
      modeParts.length === 0
          ? SINGLE_PROMPT_QUERY_MODE_LABEL_MAP.all
          : modeParts.length === 1
              ? modeParts[0]
              : `组合(${modeParts.join("+")})`;

  return {
    active: true,
    modeLabel,
    keyword,
    nameKeywords,
    tagKeywords,
    contentKeywords,
    hasScopedFilter,
    hasKeyword,
  };
};

const singlePromptQueryCommand = computed(() => parseSinglePromptQueryCommand(form.prompt));

const singlePromptQueryResults = computed(() => {
  const command = singlePromptQueryCommand.value;
  if (!command.active) return [];
  if (!command.hasKeyword) return [];
  const keyword = command.keyword.trim().toLowerCase();
  const nameKeywords = command.nameKeywords.map((item) => item.toLowerCase());
  const tagKeywords = command.tagKeywords.map((item) => item.toLowerCase());
  const contentKeywords = command.contentKeywords.map((item) => item.toLowerCase());

  return promptQueryItems.value
      .filter((item) => {
        const name = String(item.name ?? "").toLowerCase();
        const content = String(item.content ?? "").toLowerCase();
        const category = String(item.category ?? "").toLowerCase();
        const description = String(item.description ?? "").toLowerCase();
        const tags = Array.isArray(item.tags)
            ? item.tags.map((tag) => String(tag ?? "").toLowerCase())
            : [];
        const matchesAnyField = (
          name.includes(keyword) ||
          content.includes(keyword) ||
          category.includes(keyword) ||
          description.includes(keyword) ||
          tags.some((tag) => tag.includes(keyword))
        );
        const nameMatch = nameKeywords.every((term) => name.includes(term));
        const tagMatch = tagKeywords.every((term) => tags.some((tag) => tag.includes(term)));
        const contentMatch = contentKeywords.every((term) => content.includes(term));
        if (!nameMatch || !tagMatch || !contentMatch) return false;
        if (!keyword) return true;
        if (command.hasScopedFilter) return matchesAnyField;
        return matchesAnyField;
      })
      .slice(0, 20);
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

const singleProviderSelectOptions = computed(() =>
    providerItems.value.map((item) => ({
      label: item.name,
      value: item.id,
    })),
);

const aiChatProviderSelectOptions = computed(() =>
    providerItems.value.map((item) => ({
      label: item.name,
      value: item.id,
    })),
);

const normalizeAiChatApiToken = (value: unknown) =>
    normalizeApiKeyValue(value)
      .replace(/^['"]+|['"]+$/g, "")
      .replace(/^bearer\s+/i, "")
      .trim();

const resolveAiChatRequestApiKey = (_baseUrl: AiChatBaseUrl) =>
    normalizeAiChatApiToken(aiChatApiKey.value);

const getAiChatMissingKeyMessage = (baseUrl: AiChatBaseUrl) =>
    "请先在服务商配置中填写该服务商的 Key";

let logId = 0;
let persistTimer: number | null = null;
let pluginBackgroundPersistTimer: number | null = null;
let promptHistoryPersistTimer: number | null = null;
let providerConfigPersistTimer: number | null = null;
let lastLocalMainTabKeyAt = 0;
let lastLocalAiChatSendKeyAt = 0;
let lastLocalHistorySearchKeyAt = 0;
let removeHostMessageListener: (() => void) | null = null;

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
      solution: "请到“设置”页选择或新增图片生成 Key",
    },
    NO_API_URL: {
      message: "API 地址未填写",
      solution: "请到“设置”页填写图片生成 Base URL",
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

const splitErrorAndRawResponse = (message: string) => {
  const marker = "\n[接口响应原文]\n";
  const raw = String(message ?? "");
  const index = raw.indexOf(marker);
  if (index < 0) {
    return {
      errorMessage: raw,
      rawResponse: "",
    };
  }
  return {
    errorMessage: raw.slice(0, index).trim(),
    rawResponse: raw.slice(index + marker.length),
  };
};

const maskSecretForLog = (value: string) => {
  const normalized = normalizeApiKeyValue(value);
  if (!normalized) return "(empty)";
  if (normalized.length <= 8) return `${normalized.slice(0, 2)}***${normalized.slice(-2)}`;
  return `${normalized.slice(0, 4)}***${normalized.slice(-4)}`;
};

const formatLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentSingleProvider = () =>
  providerItems.value.find((item) => item.id === singleProviderId.value) || null;

const getCurrentSingleProviderDisplayName = () => {
  const provider = getCurrentSingleProvider();
  if (!provider) return "未命名服务商";
  const protocol = getImageProviderRuntimeProtocolLabel(provider);
  return `${provider.name} (${protocol})`;
};

const getImageProviderRuntimeProtocolLabel = (provider: ProviderItem | null) =>
  resolveImageProviderRuntimeProtocol(provider) === "openai" ? "OpenAI" : "Gemini";

const getCurrentAiChatProvider = () =>
  providerItems.value.find((item) => item.id === aiChatProviderId.value) || null;

const resolveAiChatRuntimeProtocol = (provider: ProviderItem | null): AiChatProtocol =>
  provider?.protocolMode === "openai" ? "openai" : "gemini";

const getAntiModeLabel = (mode: AntiMode) =>
  mode === 1 ? "普通" : mode === 2 ? "高强" : "关闭";

const getLayerTypeLabel = (layerType: LayerType) =>
  layerType === "smartObject" ? "智能对象" : "栅格化图层";

const logSingleRequestDetails = () => {
  const provider = getCurrentSingleProvider();
  const detail = {
    provider: provider?.name || "",
    providerProtocolMode: provider?.protocolMode || "",
    runtimeProtocol: getImageProviderRuntimeProtocolLabel(provider),
    apiBaseUrl: form.apiBaseUrl,
    apiKeyMasked: maskSecretForLog(form.apiKey),
    model: normalizeApiKeyValue(form.model),
    requestCopies: form.batchSize,
    timeoutSeconds: form.timeoutSeconds,
    antiTruncationMode: getAntiModeLabel(form.antiMode),
    layerType: getLayerTypeLabel(form.layerType),
    maxResolution: form.maxResolution,
    sizeOption: "removed",
    modelSuffixStrategy: "disabled",
    prompt: form.prompt,
  };
  pushLog(`[请求详情]\n${JSON.stringify(detail, null, 2)}`, "info");
  if (form.batchSize > 1) {
    logTagged("请求详情", `本次将并发发送 ${form.batchSize} 个相同请求`, "info");
  }
};

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

const findMatchingAiModelId = (models: AiModelItem[], candidate: string) => {
  const normalizedCandidate = normalizeApiKeyValue(candidate);
  if (!normalizedCandidate) return "";
  const normalizedCandidateGemini = normalizeGeminiModelId(normalizedCandidate).toLowerCase();
  const canonicalize = (value: string) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  const tokenize = (value: string) =>
    String(value || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter((item) => item.length > 0);
  const candidateCanonical = canonicalize(normalizedCandidateGemini);
  const candidateTokens = tokenize(normalizedCandidateGemini);
  let fuzzyMatchedId = "";
  let tokenMatchedId = "";
  for (const item of models) {
    const itemId = normalizeApiKeyValue(item.id);
    if (!itemId) continue;
    if (itemId === normalizedCandidate) return itemId;
    const itemGeminiId = normalizeGeminiModelId(itemId).toLowerCase();
    if (itemGeminiId === normalizedCandidateGemini) return itemId;
    if (
      !fuzzyMatchedId &&
      normalizedCandidateGemini &&
      itemGeminiId.includes(normalizedCandidateGemini)
    ) {
      fuzzyMatchedId = itemId;
    }
    if (!tokenMatchedId && candidateCanonical) {
      const itemCanonical = canonicalize(itemGeminiId);
      if (itemCanonical.includes(candidateCanonical)) {
        tokenMatchedId = itemId;
        continue;
      }
      if (candidateTokens.length > 0) {
        const itemTokenSet = new Set(tokenize(itemGeminiId));
        const matchedAllTokens = candidateTokens.every((token) => itemTokenSet.has(token));
        if (matchedAllTokens) {
          tokenMatchedId = itemId;
        }
      }
    }
  }
  return fuzzyMatchedId || tokenMatchedId;
};

const clearAiChatModels = (options?: { resetSelections?: boolean }) => {
  aiChatModels.value = [];
  if (options?.resetSelections) {
    aiChatSelectedModel.value = DEFAULT_AI_CHAT_MODEL;
    aiChatOperationModel.value = DEFAULT_AI_CHAT_MODEL;
  }
  aiChatLastFetchAt.value = "";
  aiChatLoadedApiKey.value = "";
  aiChatLoadedBaseUrl.value = "";
  aiChatLoadedProtocol.value = "";
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

const uiBackgroundSettingsSaveSupported = computed(
    () => typeof (api as any).saveUiBackgroundSettings === "function",
);

const uiBackgroundSettingsReadSupported = computed(
    () => typeof (api as any).readUiBackgroundSettings === "function",
);

const promptHistoryJsonSaveSupported = computed(
    () => typeof (api as any).savePromptHistoryRecords === "function",
);

const promptHistoryJsonReadSupported = computed(
    () => typeof (api as any).readPromptHistoryRecords === "function",
);

const providerConfigsJsonSaveSupported = computed(
  () => state.hostProviderConfig && typeof (api as any).saveProviderConfigs === "function",
);

const providerConfigsJsonReadSupported = computed(
  () => state.hostProviderConfig && typeof (api as any).readProviderConfigs === "function",
);

const singleRunConfirmJsonSupported = computed(
  () =>
    state.hostSingleRunConfirmPreference &&
    typeof (api as any).saveSingleRunConfirmSkipDate === "function" &&
    typeof (api as any).readSingleRunConfirmSkipDate === "function",
);

const stampVisibleLayerSupported = computed(
  () => state.hostStampVisibleLayer && typeof (api as any).stampVisibleLayer === "function",
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

const savePluginBackgroundToJson = async () => {
  if (!uiBackgroundSettingsSaveSupported.value) return;
  try {
    await (api as any).saveUiBackgroundSettings({
      imageDataUrl: pluginBackgroundImageDataUrl.value.startsWith("data:image/")
        ? pluginBackgroundImageDataUrl.value
        : "",
      opacity: clampPluginBackgroundOpacityValue(pluginBackgroundOpacity.value),
      panelOpacity: clampPluginBackgroundPanelOpacityValue(pluginBackgroundPanelOpacity.value),
      blur: clampPluginBackgroundBlurValue(pluginBackgroundBlur.value),
    });
  } catch (error) {
    const message = getErrorMessage(error);
    logTagged("设置", `保存插件背景到 JSON 失败: ${message}`, "warn");
  }
};

const loadPluginBackgroundFromJson = async () => {
  if (!uiBackgroundSettingsReadSupported.value) return;
  try {
    const result = (await (api as any).readUiBackgroundSettings()) as {
      stored?: boolean;
      settings?: {
        imageDataUrl?: string;
        opacity?: number;
        panelOpacity?: number;
        blur?: number;
      };
    };
    if (!result?.stored) return;
    const settings = result?.settings;
    if (!settings || typeof settings !== "object") return;

    const hasOwn = (key: string) => Object.prototype.hasOwnProperty.call(settings, key);
    const nextImage = String(settings.imageDataUrl ?? "").trim();
    if (hasOwn("imageDataUrl")) {
      pluginBackgroundImageDataUrl.value = nextImage.startsWith("data:image/") ? nextImage : "";
    }
    if (hasOwn("opacity")) {
      pluginBackgroundOpacity.value = clampPluginBackgroundOpacityValue(settings.opacity);
    }
    if (hasOwn("panelOpacity")) {
      pluginBackgroundPanelOpacity.value = clampPluginBackgroundPanelOpacityValue(settings.panelOpacity);
    }
    if (hasOwn("blur")) {
      pluginBackgroundBlur.value = clampPluginBackgroundBlurValue(settings.blur);
    }
    scheduleSaveLocalState();
  } catch (error) {
    const message = getErrorMessage(error);
    logTagged("设置", `读取插件背景 JSON 失败: ${message}`, "warn");
  }
};

const loadAiChatApiKeyFromJson = async (options?: { silent?: boolean }) => {
  if (!aiChatJsonReadSupported.value) return;
  try {
    const result = (await (api as any).readAiChatApiKey()) as ReadAiChatApiKeyResult;
    const nextKey = normalizeAiChatApiToken(result?.item?.value);
    const previousKey = normalizeApiKeyValue(aiChatApiKey.value);
    if (nextKey === previousKey) return;
    aiChatApiKey.value = nextKey;
    if (
      aiChatLoadedBaseUrl.value &&
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
  const key = normalizeAiChatApiToken(aiChatApiKey.value);
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
    await loadAiChatModels({ silentIfNoKey: true });
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
    const errorMessage = getErrorMessage(error);
    logTagged("与AI对话", `保存AI对话 Key 失败: ${errorMessage}`, "error");
    message.error(`保存失败: ${errorMessage}`);
  } finally {
    aiChatApiKeySaving.value = false;
  }
};

const loadAiChatModels = async (options?: { silentIfNoKey?: boolean }) => {
  const baseUrl = normalizeAiChatBaseUrl(aiChatBaseUrl.value);
  const provider = getCurrentAiChatProvider();
  const protocol = resolveAiChatRuntimeProtocol(provider);
  const key = resolveAiChatRequestApiKey(baseUrl);
  if (!key) {
    if (!options?.silentIfNoKey) {
      message.warning(getAiChatMissingKeyMessage(baseUrl));
    }
    return;
  }

  aiChatModelLoading.value = true;
  try {
    const config = getAiChatApiConfig(protocol);
    const url =
      protocol === "openai"
        ? `${baseUrl}${config.models}`
        : `${baseUrl}${config.models}?key=${encodeURIComponent(key)}`;
    logTagged(
      "与AI对话",
      `开始请求模型列表: GET ${url} | protocol=${protocol} | key=${maskSecretForLog(key)}`,
      "info",
    );
    const response = await withTimeout(
        fetch(url, {
          method: "GET",
          headers:
            protocol === "openai"
              ? {
                  Accept: "application/json",
                  Authorization: `Bearer ${key}`,
                }
              : {
                  Accept: "application/json",
                },
        }),
        12000,
        "模型列表查询",
    );
    const requestId =
      response.headers.get("x-oneapi-request-id") ||
      response.headers.get("x-request-id") ||
      response.headers.get("request-id") ||
      "";
    const responseText = await response.text();
    logTagged(
      "与AI对话",
      `模型列表响应: HTTP ${response.status}${requestId ? ` | request-id=${requestId}` : ""}`,
      response.ok ? "info" : "warn",
    );

    if (!response.ok) {
      const detail = responseText ? ` ${responseText.slice(0, 180)}` : "";
      if (responseText) {
        logTagged("与AI对话", `模型列表错误响应片段: ${responseText.slice(0, 220)}`, "error");
      }
      throw new Error(`HTTP ${response.status}.${detail}`);
    }

    let payload: unknown = null;
    try {
      payload = responseText ? (JSON.parse(responseText) as unknown) : null;
    } catch {
      logTagged("与AI对话", `模型列表返回非JSON，片段: ${responseText.slice(0, 220)}`, "error");
      throw new Error("接口返回非 JSON 数据");
    }
    const models = normalizeAiModelItems(payload).map((item) => ({
      ...item,
      id: protocol === "gemini" ? normalizeGeminiModelId(item.id) : item.id,
    }));
    const payloadSummary =
      payload && typeof payload === "object"
        ? Object.keys(payload as Record<string, unknown>).slice(0, 8).join(",")
        : typeof payload;
    logTagged(
      "与AI对话",
      `模型解析完成: 共 ${models.length} 个 | payload=${payloadSummary || "empty"}`,
      "info",
    );
    aiChatModels.value = models;
    aiChatLoadedApiKey.value = key;
    aiChatLoadedBaseUrl.value = baseUrl;
    aiChatLoadedProtocol.value = protocol;
    const resolveModelSelection = (candidate: string, fallbackCandidate = DEFAULT_AI_CHAT_MODEL) => {
      const normalizedCandidate = normalizeApiKeyValue(candidate);
      if (models.length === 0) return normalizedCandidate;
      const matchedCandidate = findMatchingAiModelId(models, candidate);
      if (matchedCandidate) return matchedCandidate;
      const matchedDefault = findMatchingAiModelId(models, fallbackCandidate);
      if (matchedDefault) return matchedDefault;
      return normalizeApiKeyValue(models[0]?.id);
    };
    const resolvedOperationModel = resolveModelSelection(
      DEFAULT_AI_CHAT_MODEL,
      aiChatSelectedModel.value || DEFAULT_AI_CHAT_MODEL,
    );
    aiChatOperationModel.value = resolvedOperationModel;
    aiChatSelectedModel.value = resolvedOperationModel;
    if (!aiChatOperationModel.value && aiChatSelectedModel.value) {
      aiChatOperationModel.value = aiChatSelectedModel.value;
    }
    aiChatLastFetchAt.value = now();
    if (models.length === 0) {
      message.warning("接口返回成功，但未解析到模型列表");
      logTagged("与AI对话", "模型列表为空或格式不匹配", "warn");
      return;
    }

    message.success(`模型加载完成，共 ${models.length} 个`);
    logTagged("与AI对话", `模型列表加载成功，共 ${models.length} 个`, "success");
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    message.error(`模型获取失败: ${errorMessage}`);
    logTagged("与AI对话", `模型获取失败: ${errorMessage}`, "error");
  } finally {
    aiChatModelLoading.value = false;
  }
};

const tryAutoLoadAiChatModels = async () => {
  const baseUrl = normalizeAiChatBaseUrl(aiChatBaseUrl.value);
  const protocol = resolveAiChatRuntimeProtocol(getCurrentAiChatProvider());
  const key = resolveAiChatRequestApiKey(baseUrl);
  if (!key) return;
  if (aiChatModelLoading.value) return;
  if (
    aiChatLoadedApiKey.value === key &&
    aiChatLoadedBaseUrl.value === baseUrl &&
    aiChatLoadedProtocol.value === protocol &&
    aiChatModels.value.length > 0
  ) {
    return;
  }
  await loadAiChatModels({silentIfNoKey: true});
};

const fetchProviderModelIds = async (
  baseUrl: string,
  key: string,
  protocol: ProviderRuntimeProtocol,
  timeoutLabel: string,
): Promise<string[]> => {
  const url =
    protocol === "openai"
      ? `${baseUrl}/v1/models`
      : `${baseUrl}/v1beta/models?key=${encodeURIComponent(key)}`;
  const response = await withTimeout(
    fetch(url, {
      method: "GET",
      headers:
        protocol === "openai"
          ? {
              Accept: "application/json",
              Authorization: `Bearer ${key}`,
            }
          : {
              Accept: "application/json",
            },
    }),
    12000,
    timeoutLabel,
  );
  const responseText = await response.text();
  if (!response.ok) {
    const detail = responseText ? ` ${responseText.slice(0, 220)}` : "";
    throw new Error(`HTTP ${response.status}.${detail}`);
  }
  let payload: unknown = null;
  try {
    payload = responseText ? (JSON.parse(responseText) as unknown) : null;
  } catch {
    throw new Error("接口返回非 JSON 数据");
  }
  const models = normalizeAiModelItems(payload);
  return models.map((item) => normalizeGeminiModelId(item.id)).filter((item) => Boolean(normalizeApiKeyValue(item)));
};

const getProviderModelRequestInfo = (
  baseUrl: string,
  key: string,
  protocol: ProviderRuntimeProtocol,
) => ({
  url:
    protocol === "openai"
      ? `${baseUrl}/v1/models`
      : `${baseUrl}/v1beta/models?key=${encodeURIComponent(key)}`,
  protocolLabel: protocol === "openai" ? "OpenAI" : "Gemini",
});

const formatProviderModelManageError = (
  baseUrl: string,
  key: string,
  protocol: ProviderRuntimeProtocol,
  error: unknown,
) => {
  const {url, protocolLabel} = getProviderModelRequestInfo(baseUrl, key, protocol);
  const fallbackProtocolLabel = protocol === "openai" ? "Gemini" : "OpenAI";
  const errorMessage = getErrorMessage(error);
  return [
    "获取模型列表失败。",
    "请先确认该服务商接口是否支持 OpenAI 或 Gemini 格式。",
    `当前请求格式：${protocolLabel}`,
    `请求 URL：${url}`,
    `错误详情：${errorMessage}`,
    `如果该服务商实际兼容 ${fallbackProtocolLabel} 格式，请切换“协议支持”后重试。`,
  ].join("\n");
};

const loadSingleProviderModels = async (): Promise<string[]> => {
  const selectedId = normalizeApiKeyValue(singleProviderId.value);
  const selectedProvider = providerItems.value.find((item) => item.id === selectedId) || null;
  const baseUrl = normalizeApiBaseUrl(selectedProvider?.baseUrl);
  const key = normalizeAiChatApiToken(selectedProvider?.key);
  const protocol = resolveImageProviderRuntimeProtocol(selectedProvider);
  if (!baseUrl) {
    message.warning("请先选择服务商");
    return [];
  }
  if (!key) {
    message.warning("当前服务商未配置 Key");
    return [];
  }

  return fetchProviderModelIds(baseUrl, key, protocol, "图像工作台模型列表查询");
};

const loadProviderModelsForManage = async (): Promise<string[]> => {
  const selectedId = normalizeApiKeyValue(providerManageSelected.value);
  const selectedProvider = providerItems.value.find((item) => item.id === selectedId) || null;
  const draftBaseUrl = normalizeApiBaseUrl(providerManageBaseUrl.value);
  const draftKey = normalizeAiChatApiToken(providerManageKey.value);
  const baseUrl = normalizeApiBaseUrl(selectedProvider?.baseUrl || draftBaseUrl);
  const key = normalizeAiChatApiToken(selectedProvider?.key || draftKey);
  const protocol = resolveImageProviderRuntimeProtocol(
    selectedProvider || (baseUrl ? {
      id: "",
      name: "",
      baseUrl,
      key,
      protocolMode: normalizeProviderProtocolMode(providerManageProtocolMode.value, baseUrl),
    } as ProviderItem : null),
  );
  if (!baseUrl) {
    message.warning("请先选择服务商或填写 Base URL");
    return [];
  }
  if (!key) {
    message.warning("请先填写服务商 Key");
    return [];
  }

  try {
    return await fetchProviderModelIds(baseUrl, key, protocol, "服务商模型列表查询");
  } catch (error) {
    throw new Error(formatProviderModelManageError(baseUrl, key, protocol, error));
  }
};

const resolveSingleModelForProvider = (modelIds: string[], currentModel: string) => {
  const models: AiModelItem[] = modelIds.map((id) => ({
    id,
    ownedBy: "",
    created: null,
  }));
  if (models.length === 0) return "";
  const matchedCurrent = findMatchingAiModelId(models, currentModel);
  if (matchedCurrent) return matchedCurrent;
  const matchedDefault = findMatchingAiModelId(models, SINGLE_DEFAULT_MODEL);
  if (matchedDefault) return matchedDefault;
  const matchedGemini = findMatchingAiModelId(models, SINGLE_GEMINI_FLASH_IMAGE_MODEL);
  if (matchedGemini) return matchedGemini;
  return normalizeApiKeyValue(models[0]?.id);
};

let singleProviderModelSyncToken = 0;

const syncSingleModelForProvider = async (providerId: string, trigger: string) => {
  const selectedId = normalizeApiKeyValue(providerId);
  if (!selectedId) return;
  const provider = providerItems.value.find((item) => item.id === selectedId) || null;
  if (!provider) return;
  const baseUrl = normalizeApiBaseUrl(provider.baseUrl);
  const key = normalizeAiChatApiToken(provider.key);
  const protocol = resolveImageProviderRuntimeProtocol(provider);
  if (!baseUrl || !key) return;
  const syncToken = ++singleProviderModelSyncToken;
  try {
    const modelIds = await fetchProviderModelIds(baseUrl, key, protocol, "图像工作台模型自动校验");
    if (syncToken !== singleProviderModelSyncToken) return;
    if (singleProviderId.value !== selectedId) return;
    const nextModel = resolveSingleModelForProvider(modelIds, form.model);
    if (nextModel && form.model !== nextModel) {
      form.model = nextModel;
      logTagged("单图", `${trigger}后自动匹配模型: ${nextModel}`, "info");
    }
  } catch (error) {
    if (syncToken !== singleProviderModelSyncToken) return;
    logTagged("单图", `${trigger}后模型自动校验失败: ${getErrorMessage(error)}`, "warn");
  }
};

const aiChatSendDisabled = computed(() => {
  const baseUrl = normalizeAiChatBaseUrl(aiChatBaseUrl.value);
  if (aiChatSending.value) return true;
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

const aiChatRewindDisabled = computed(() => {
  if (aiChatSending.value) return true;
  return !aiChatMessages.value.some((item) => item.role === "user");
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

const handleAiChatFillPrompt = (code: string) => {
  const prompt = String(code ?? "").trim();
  if (!prompt) {
    message.warning("代码块内容为空，无法填入");
    return;
  }
  form.prompt = prompt;
  pushPromptHistoryRecord("single-workbench", prompt);
  activeTab.value = "single";
  scheduleSaveLocalState();
  logTagged("与AI对话", "已将代码块填入图像工作台提示词", "success");
  message.success("已填入主页面提示词");
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

  const fileType = String(file.type || "").toLowerCase();
  const fileName = String(file.name || "").toLowerCase();
  const imageNamePattern = /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i;
  if (fileType && !fileType.startsWith("image/") && !imageNamePattern.test(fileName)) {
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

const openPluginBackgroundPicker = () => {
  pluginBackgroundInputRef.value?.click();
};

const clearPluginBackground = () => {
  pluginBackgroundImageDataUrl.value = "";
};

const onPluginBackgroundChange = async (event: Event) => {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) return;
  if (input) input.value = "";

  const fileType = String(file.type || "").toLowerCase();
  const fileName = String(file.name || "").toLowerCase();
  const imageNamePattern = /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i;
  if (fileType && !fileType.startsWith("image/") && !imageNamePattern.test(fileName)) {
    message.warning("请选择图片文件作为插件背景");
    return;
  }

  try {
    const sourceDataUrl = await readFileAsDataUrl(file);
    if (!sourceDataUrl.startsWith("data:image/")) {
      message.error("背景图片格式不支持");
      return;
    }
    const sourceBytes = readDataUrlApproxBytes(sourceDataUrl);
    const dataUrl =
      sourceBytes > PLUGIN_BACKGROUND_IMAGE_FORCE_COMPRESS_BYTES
        ? await compressAiChatImageDataUrl(sourceDataUrl, {
          maxEdge: PLUGIN_BACKGROUND_IMAGE_MAX_EDGE,
          targetBytes: PLUGIN_BACKGROUND_IMAGE_TARGET_BYTES,
        })
        : sourceDataUrl;
    pluginBackgroundImageDataUrl.value = dataUrl;
    message.success(sourceBytes > PLUGIN_BACKGROUND_IMAGE_FORCE_COMPRESS_BYTES ? "插件背景已更新（已压缩）" : "插件背景已更新");
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

const abortAiChatSending = () => {
  if (!aiChatSending.value || !aiChatRequestAbortController) return;
  aiChatAbortByUser = true;
  aiChatRequestAbortController.abort();
};

const rewindAiChatLastUserMessage = () => {
  if (aiChatSending.value) {
    message.warning("请先切断或等待当前对话完成");
    return;
  }
  let targetIndex = -1;
  for (let index = aiChatMessages.value.length - 1; index >= 0; index -= 1) {
    if (aiChatMessages.value[index]?.role === "user") {
      targetIndex = index;
      break;
    }
  }
  if (targetIndex < 0) {
    message.warning("没有可回转的用户消息");
    return;
  }

  const target = aiChatMessages.value[targetIndex];
  aiChatInputText.value = String(target?.text ?? "").trim();
  aiChatPendingImages.value = Array.isArray(target?.images)
    ? target.images.map((image: AiChatImageItem) => {
      const nextId = ++aiChatImageIdSeed;
      return {
        id: nextId,
        name: normalizeApiKeyValue(image?.name) || `image-${nextId}`,
        dataUrl: String(image?.dataUrl ?? ""),
      };
    })
    : [];
  aiChatMessages.value = aiChatMessages.value.slice(0, targetIndex);
  aiChatLastAssistantJson.value = "";
  scheduleSaveLocalState();
  message.success("已回转最近一条消息，可修改后重新发送");
};

const clampAiChatParams = () => {
  const contextCount = Math.floor(Number(aiChatContextCount.value) || 12);
  aiChatContextCount.value = Math.min(30, Math.max(1, contextCount));

  const timeoutSeconds = Math.floor(Number(aiChatTimeoutSeconds.value) || 120);
  aiChatTimeoutSeconds.value = Math.min(600, Math.max(5, timeoutSeconds));

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
  const protocol = resolveAiChatRuntimeProtocol(getCurrentAiChatProvider());
  const key = resolveAiChatRequestApiKey(baseUrl);
  if (!key) {
    message.warning(getAiChatMissingKeyMessage(baseUrl));
    return;
  }
  if (aiChatModels.value.length === 0) {
    message.warning("请先加载模型列表");
    return;
  }
  if (
    aiChatLoadedBaseUrl.value !== baseUrl ||
    aiChatLoadedApiKey.value !== key ||
    aiChatLoadedProtocol.value !== protocol
  ) {
    message.warning("接口地址或AI对话 Key已变化，请重新加载模型列表");
    return;
  }
  let model = normalizeApiKeyValue(aiChatSelectedModel.value);
  if (!model) {
    message.warning("请先选择模型");
    return;
  }
  const matchedModel = findMatchingAiModelId(aiChatModels.value, model);
  if (!matchedModel) {
    aiChatSelectedModel.value = "";
    scheduleSaveLocalState();
    message.warning("当前已选模型不在可用列表中，请重新选择后再发送");
    return;
  }
  if (matchedModel !== model) {
    model = matchedModel;
    aiChatSelectedModel.value = matchedModel;
    scheduleSaveLocalState();
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
  pushPromptHistoryRecord("ai-chat-prompt", text);
  const userRecordText = text || (images.length > 0 ? `上传图片 ${images.length} 张` : "");
  pushPromptHistoryRecord("ai-chat-user-record", userRecordText);
  aiChatMessages.value.push(userMessage);
  aiChatInputText.value = "";
  aiChatPendingImages.value = [];
  await nextTick();
  scrollAiChatToBottom();

  aiChatSending.value = true;
  await nextTick();
  scrollAiChatToBottom();
  try {
    const config = getAiChatApiConfig(protocol);
    const systemPrompt = normalizeApiKeyValue(aiChatSystemPrompt.value);
    let url = "";
    let body: Record<string, unknown> = {};

    if (protocol === "gemini") {
      const geminiModel = normalizeGeminiModelId(model);
      if (!geminiModel) {
        throw new Error("模型格式不正确，请重新选择模型");
      }
      const encodedModel = encodeURIComponent(geminiModel);
      url = `${baseUrl}${config.completions.replace("{model}", encodedModel)}?key=${encodeURIComponent(key)}`;
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

    const aiChatTimeoutMs = Math.max(5000, Math.floor(Number(aiChatTimeoutSeconds.value) || 120) * 1000);
    const requestAbortController = new AbortController();
    aiChatRequestAbortController = requestAbortController;
    aiChatAbortByUser = false;
    const timeoutTimer = window.setTimeout(() => {
      requestAbortController.abort();
    }, aiChatTimeoutMs);

    logTagged("与AI对话", `发送请求: ${url} | model=${model}`, "info");

    const response = await fetch(url, {
      method: "POST",
      headers:
        protocol === "openai"
          ? {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${key}`,
            }
          : {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
      body: JSON.stringify(body),
      signal: requestAbortController.signal,
    }).finally(() => {
      window.clearTimeout(timeoutTimer);
      if (aiChatRequestAbortController === requestAbortController) {
        aiChatRequestAbortController = null;
      }
    });

    if (!response.ok) {
      const bodyText = await response.text();
      let detail = bodyText ? ` ${bodyText.slice(0, 220)}` : "";
      if (bodyText) {
        try {
          const parsed = JSON.parse(bodyText) as any;
          const errCode = normalizeApiKeyValue(parsed?.error?.code);
          const errMsg = normalizeApiKeyValue(parsed?.error?.message);
          if (errCode || errMsg) {
            detail = ` code=${errCode || "(none)"} msg=${errMsg || "(none)"}${detail ? ` | raw=${detail.trim()}` : ""}`;
          }
        } catch {
          // keep raw detail
        }
      }
      if (response.status >= 500) {
        throw new Error(
          `HTTP ${response.status}.${detail} 上游服务异常（可能是模型不可用、线路抖动或服务商网关故障），请切换模型后重试。`,
        );
      }
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
    pushPromptHistoryRecord("ai-chat-assistant-record", assistantText);
    await nextTick();
    scrollAiChatToBottom();
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      if (aiChatAbortByUser) {
        logTagged("与AI对话", "当前对话已被手动切断", "warn");
        message.info("已切断当前对话");
      } else {
        const timeoutSeconds = Math.max(5, Math.floor(Number(aiChatTimeoutSeconds.value) || 120));
        const timeoutMessage = `与AI对话超时（${timeoutSeconds}s），请重试`;
        logTagged("与AI对话", `发送失败: ${timeoutMessage}`, "error");
        message.error(`发送失败: ${timeoutMessage}`);
      }
    } else {
      const errorMessage = getErrorMessage(error);
      logTagged("与AI对话", `发送失败: ${errorMessage}`, "error");
      message.error(`发送失败: ${errorMessage}`);
    }
  } finally {
    aiChatRequestAbortController = null;
    aiChatAbortByUser = false;
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
  pushPromptHistoryRecord("single-workbench", jsonText);
  activeTab.value = "single";
  scheduleSaveLocalState();
  logTagged("与AI对话", "已将返回 JSON 应用到图像工作台提示词", "success");
  message.success("已写入主页面提示词");
};

const applyHostCapabilities = (result?: HostCapabilitiesResult | null) => {
  state.hostRunSingle = Boolean(result?.runSingleImage);
  state.hostQuota = Boolean(result?.getAiQuota);
  state.hostBatchCapture = Boolean(result?.captureBatchTask);
  state.hostAiChatCurrentSelectionImage = Boolean(result?.captureAiChatCurrentSelectionImage);
  state.hostBatchRun = Boolean(result?.runBatchTasks);
  state.hostForge =
    Boolean(result?.forgeTestConnection) &&
    Boolean(result?.forgeFetchModels) &&
    Boolean(result?.forgeFetchSamplers) &&
    Boolean(result?.forgeFetchControlNetModules) &&
    Boolean(result?.forgeFetchControlNetModels) &&
    Boolean(result?.forgeFetchLoras) &&
    Boolean(result?.forgeGenerateImages) &&
    Boolean(result?.forgeInterrupt);
  state.hostYoudaoTranslate = Boolean(result?.youdaoTranslate);
  state.hostForgeCloud =
    Boolean(result?.cloudLogin) &&
    Boolean(result?.cloudLogout) &&
    Boolean(result?.cloudRestoreSession) &&
    Boolean(result?.cloudGetUserPoints) &&
    Boolean(result?.cloudGetForgeUrl) &&
    Boolean(result?.cloudTestForgeConnection) &&
    Boolean(result?.cloudForgeGenerateImages);
  state.hostForgePresets =
    Boolean(result?.listForgePresets) &&
    Boolean(result?.saveForgePreset) &&
    Boolean(result?.deleteForgePreset) &&
    Boolean(result?.toggleForgePresetFavorite);
  state.hostForgePresetIO =
    state.hostForgePresets &&
    Boolean(result?.exportForgePresets) &&
    Boolean(result?.importForgePresets);
  state.hostReverseAntiAction = Boolean(result?.reverseAntiTruncationEffect);
  state.hostGlobalPartition = Boolean(result?.runGlobalPartition);
  state.hostPromptCreate =
      Boolean(result?.savePromptCreateItem) &&
      (Boolean(result?.initPromptCreateStorage) || Boolean(result?.getPromptCreateStorageInfo));
  state.hostPromptQuery = Boolean(result?.listPromptCreateItems);
  state.hostPromptDelete = Boolean(result?.deletePromptCreateItem);
  state.hostPromptFavorite = Boolean(result?.togglePromptCreateFavorite);
  state.hostPromptHistorySave = Boolean(result?.savePromptHistoryRecords);
  state.hostPromptHistoryRead = Boolean(result?.readPromptHistoryRecords);
  state.hostSingleRunConfirmPreference =
    Boolean(result?.saveSingleRunConfirmSkipDate) &&
    Boolean(result?.readSingleRunConfirmSkipDate);
  state.hostStampVisibleLayer = Boolean(result?.stampVisibleLayer);
  state.hostProviderConfig =
    Boolean(result?.saveProviderConfigs) &&
    Boolean(result?.readProviderConfigs);
  state.hostApiKeyManage =
      Boolean(result?.listManagedApiKeys) &&
      Boolean(result?.saveManagedApiKey) &&
      Boolean(result?.updateManagedApiKey) &&
      Boolean(result?.deleteManagedApiKey) &&
      Boolean(result?.clearManagedApiKeys);
};

const normalizeForgePresetItem = (value: any): ForgePresetItem | null => {
  const id = String(value?.id ?? "").trim();
  const name = String(value?.name ?? "").trim();
  if (!id || !name) return null;
  const category = String(value?.category ?? "custom").trim() || "custom";
  const favorite = Number(value?.favorite) === 1 ? 1 : 0;
  const createdAt = String(value?.createdAt ?? value?.updatedAt ?? "").trim() || new Date().toISOString();
  const updatedAt = String(value?.updatedAt ?? "").trim() || createdAt;
  const dataRaw = value?.data ?? {};
  return {
    id,
    name: name.slice(0, 80),
    category: category.slice(0, 40),
    favorite,
    createdAt,
    updatedAt,
    data: {
      mode: String(dataRaw?.mode ?? "") === "txt2img" ? "txt2img" : "img2img",
      prompt: String(dataRaw?.prompt ?? ""),
      negativePrompt: String(dataRaw?.negativePrompt ?? ""),
      model: String(dataRaw?.model ?? ""),
      sampler: String(dataRaw?.sampler ?? ""),
      scheduler: String(dataRaw?.scheduler ?? "automatic") || "automatic",
      steps: Number(dataRaw?.steps) || 20,
      cfgScale: Number(dataRaw?.cfgScale) || 7,
      denoise: Number(dataRaw?.denoise) || 0.35,
      width: Number(dataRaw?.width) || 768,
      height: Number(dataRaw?.height) || 768,
      batchSize: Number(dataRaw?.batchSize) || 1,
      seed: Number(dataRaw?.seed ?? -1),
      lora: String(dataRaw?.lora ?? ""),
      loraWeight: Number(dataRaw?.loraWeight) || 1,
      controlNetEnabled: Boolean(dataRaw?.controlNetEnabled),
      controlNetModule: String(dataRaw?.controlNetModule ?? "none"),
      controlNetModel: String(dataRaw?.controlNetModel ?? "None"),
      controlNetWeight: Number(dataRaw?.controlNetWeight) || 1,
      timeoutSeconds: Number(dataRaw?.timeoutSeconds) || 180,
      maxResolution: Number(dataRaw?.maxResolution) || 1536,
    },
  };
};

const loadForgePresetItems = async (silent = false): Promise<boolean> => {
  if (!state.hostForgePresets) return false;
  const listFn = (api as any).listForgePresets;
  if (typeof listFn !== "function") return false;
  forgePresetLoading.value = true;
  let success = false;
  try {
    const result = (await withTimeout(
      Promise.resolve(listFn()),
      8000,
      "Forge预设加载",
    )) as { items?: any[] };
    const items = Array.isArray(result?.items)
      ? result.items.map(normalizeForgePresetItem).filter(Boolean) as ForgePresetItem[]
      : [];
    forgePresetItems.value = items;
    if (
      forgePresetCategory.value &&
      !items.some((item) => String(item.category ?? "").trim() === forgePresetCategory.value)
    ) {
      forgePresetCategory.value = "";
    }
    success = true;
  } catch (error) {
    if (!silent) {
      const text = getErrorMessage(error);
      message.warning(`Forge预设加载失败：${text}`);
    }
  } finally {
    forgePresetLoading.value = false;
  }
  return success;
};

const refreshForgePresetItems = async () => {
  if (!state.hostForgePresets) {
    message.warning("当前宿主未挂载 Forge 预设接口");
    return;
  }
  const success = await loadForgePresetItems();
  if (success) message.success("Forge预设已刷新");
};

const exportForgePresetItems = async () => {
  if (!state.hostForgePresetIO) {
    message.warning("当前宿主未挂载 Forge 预设导出接口");
    return;
  }
  if (forgePresetExporting.value) return;
  const exportFn = (api as any).exportForgePresets;
  if (typeof exportFn !== "function") return;
  forgePresetExporting.value = true;
  try {
    const result = (await withTimeout(
      Promise.resolve(exportFn()),
      12000,
      "Forge预设导出",
    )) as { exported?: number };
    const exported = Math.max(0, Math.floor(Number(result?.exported ?? forgePresetItems.value.length) || 0));
    message.success(`Forge预设已导出（${exported}条）`);
  } catch (error) {
    const text = getErrorMessage(error);
    if (text.includes("取消")) {
      message.info("已取消导出");
      return;
    }
    message.error(`Forge预设导出失败：${text}`);
  } finally {
    forgePresetExporting.value = false;
  }
};

const importForgePresetItems = async (replace = false) => {
  if (!state.hostForgePresetIO) {
    message.warning("当前宿主未挂载 Forge 预设导入接口");
    return;
  }
  if (forgePresetImporting.value) return;
  const importFn = (api as any).importForgePresets;
  if (typeof importFn !== "function") return;

  if (replace) {
    const confirmed = typeof window.confirm === "function"
      ? window.confirm("导入并替换会清空当前 Forge 预设，是否继续？")
      : true;
    if (!confirmed) return;
  }

  forgePresetImporting.value = true;
  try {
    const result = (await withTimeout(
      Promise.resolve(importFn({ replace })),
      16000,
      "Forge预设导入",
    )) as { created?: number; updated?: number; skipped?: number; total?: number; replaced?: boolean };
    await loadForgePresetItems(true);
    const created = Math.max(0, Math.floor(Number(result?.created) || 0));
    const updated = Math.max(0, Math.floor(Number(result?.updated) || 0));
    const skipped = Math.max(0, Math.floor(Number(result?.skipped) || 0));
    const total = Math.max(0, Math.floor(Number(result?.total) || forgePresetItems.value.length));
    const modeLabel = result?.replaced ? "替换导入" : "合并导入";
    message.success(`${modeLabel}完成：新增 ${created}，更新 ${updated}，跳过 ${skipped}，当前共 ${total} 条`);
  } catch (error) {
    const text = getErrorMessage(error);
    if (text.includes("取消")) {
      message.info("已取消导入");
      return;
    }
    message.error(`Forge预设导入失败：${text}`);
  } finally {
    forgePresetImporting.value = false;
  }
};

const applyForgePresetItem = (item: ForgePresetItem) => {
  const preset = normalizeForgePresetItem(item);
  if (!preset) return;
  forgeForm.mode = preset.data.mode;
  forgeForm.prompt = preset.data.prompt;
  forgeForm.negativePrompt = preset.data.negativePrompt;
  forgeForm.model = preset.data.model;
  forgeForm.sampler = preset.data.sampler;
  forgeForm.scheduler = preset.data.scheduler || "automatic";
  forgeForm.steps = preset.data.steps;
  forgeForm.cfgScale = preset.data.cfgScale;
  forgeForm.denoise = preset.data.denoise;
  forgeForm.width = preset.data.width;
  forgeForm.height = preset.data.height;
  forgeForm.batchSize = preset.data.batchSize;
  forgeForm.seed = preset.data.seed;
  forgeForm.lora = preset.data.lora;
  forgeForm.loraWeight = preset.data.loraWeight;
  forgeForm.controlNetEnabled = preset.data.controlNetEnabled;
  forgeForm.controlNetModule = preset.data.controlNetModule;
  forgeForm.controlNetModel = preset.data.controlNetModel;
  forgeForm.controlNetWeight = preset.data.controlNetWeight;
  forgeForm.timeoutSeconds = preset.data.timeoutSeconds;
  forgeForm.maxResolution = preset.data.maxResolution;
  clampRuntimeValues();
  message.success(`已应用 Forge 预设：${preset.name}`);
};

const openForgePresetSaveDialog = (item?: ForgePresetItem | null) => {
  const target = item ? normalizeForgePresetItem(item) : null;
  forgePresetSaveForm.id = target?.id || "";
  forgePresetSaveForm.name = target?.name || "";
  forgePresetSaveForm.category = target?.category || forgePresetCategory.value || "custom";
  forgePresetSaveVisible.value = true;
};

const saveForgePresetFromDialog = async () => {
  if (!state.hostForgePresets) {
    message.warning("当前宿主未挂载 Forge 预设接口");
    return;
  }
  const saveFn = (api as any).saveForgePreset;
  if (typeof saveFn !== "function") return;
  const name = String(forgePresetSaveForm.name ?? "").trim();
  if (!name) {
    message.warning("请输入预设名称");
    return;
  }
  forgePresetSaving.value = true;
  try {
    await withTimeout(
      Promise.resolve(
        saveFn({
          id: forgePresetSaveForm.id || undefined,
          name,
          category: forgePresetSaveForm.category || "custom",
          data: {
            mode: forgeForm.mode,
            prompt: forgeForm.prompt,
            negativePrompt: forgeForm.negativePrompt,
            model: forgeForm.model,
            sampler: forgeForm.sampler,
            scheduler: forgeForm.scheduler,
            steps: forgeForm.steps,
            cfgScale: forgeForm.cfgScale,
            denoise: forgeForm.denoise,
            width: forgeForm.width,
            height: forgeForm.height,
            batchSize: forgeForm.batchSize,
            seed: forgeForm.seed,
            lora: forgeForm.lora,
            loraWeight: forgeForm.loraWeight,
            controlNetEnabled: forgeForm.controlNetEnabled,
            controlNetModule: forgeForm.controlNetModule,
            controlNetModel: forgeForm.controlNetModel,
            controlNetWeight: forgeForm.controlNetWeight,
            timeoutSeconds: forgeForm.timeoutSeconds,
            maxResolution: forgeForm.maxResolution,
          },
        }),
      ),
      9000,
      "Forge预设保存",
    );
    forgePresetSaveVisible.value = false;
    await loadForgePresetItems(true);
    message.success("Forge预设已保存");
  } catch (error) {
    message.error(`Forge预设保存失败：${getErrorMessage(error)}`);
  } finally {
    forgePresetSaving.value = false;
  }
};

const deleteForgePresetItem = async (item: ForgePresetItem) => {
  if (!state.hostForgePresets) return;
  const deleteFn = (api as any).deleteForgePreset;
  if (typeof deleteFn !== "function") return;
  const preset = normalizeForgePresetItem(item);
  if (!preset) return;
  const confirmed = typeof window.confirm === "function" ? window.confirm(`确定删除预设“${preset.name}”吗？`) : true;
  if (!confirmed) return;
  try {
    await withTimeout(Promise.resolve(deleteFn(preset.id)), 8000, "Forge预设删除");
    await loadForgePresetItems(true);
    message.success("Forge预设已删除");
  } catch (error) {
    message.error(`Forge预设删除失败：${getErrorMessage(error)}`);
  }
};

const toggleForgePresetFavoriteItem = async (item: ForgePresetItem) => {
  if (!state.hostForgePresets) return;
  const toggleFn = (api as any).toggleForgePresetFavorite;
  if (typeof toggleFn !== "function") return;
  const preset = normalizeForgePresetItem(item);
  if (!preset) return;
  try {
    await withTimeout(Promise.resolve(toggleFn(preset.id)), 8000, "Forge预设收藏");
    await loadForgePresetItems(true);
  } catch (error) {
    message.warning(`Forge预设收藏失败：${getErrorMessage(error)}`);
  }
};

const loadForgeMetaOptions = async (sourceUrl?: string, silent = false): Promise<boolean> => {
  if (!state.hostForge) return false;
  const apiUrl = normalizeForgeUrl(sourceUrl || forgeForm.apiUrl || FORGE_DEFAULT_API_URL);
  if (!apiUrl) return false;

  const fetchModels = (api as any).forgeFetchModels;
  const fetchSamplers = (api as any).forgeFetchSamplers;
  const fetchCnModules = (api as any).forgeFetchControlNetModules;
  const fetchCnModels = (api as any).forgeFetchControlNetModels;
  const fetchLoras = (api as any).forgeFetchLoras;
  if (
    typeof fetchModels !== "function" ||
    typeof fetchSamplers !== "function" ||
    typeof fetchCnModules !== "function" ||
    typeof fetchCnModels !== "function" ||
    typeof fetchLoras !== "function"
  ) {
    return false;
  }

  forgeLoadingMeta.value = true;
  let hasAnySuccess = false;
  try {
    const [modelsRes, samplersRes, cnModulesRes, cnModelsRes, lorasRes] = await Promise.allSettled([
      withTimeout(Promise.resolve(fetchModels({ url: apiUrl, timeoutSeconds: 12 })), 15000, "Forge模型列表"),
      withTimeout(Promise.resolve(fetchSamplers({ url: apiUrl, timeoutSeconds: 12 })), 15000, "Forge采样器列表"),
      withTimeout(Promise.resolve(fetchCnModules({ url: apiUrl, timeoutSeconds: 12 })), 15000, "Forge ControlNet预处理器"),
      withTimeout(Promise.resolve(fetchCnModels({ url: apiUrl, timeoutSeconds: 12 })), 15000, "Forge ControlNet模型"),
      withTimeout(Promise.resolve(fetchLoras({ url: apiUrl, timeoutSeconds: 12 })), 15000, "Forge LoRA列表"),
    ]);

    if (modelsRes.status === "fulfilled") {
      forgeModelItems.value = Array.isArray(modelsRes.value?.items) ? modelsRes.value.items : [];
      if (forgeForm.model && !forgeModelItems.value.includes(forgeForm.model)) {
        forgeForm.model = "";
      }
    }
    if (samplersRes.status === "fulfilled") {
      forgeSamplerItems.value = Array.isArray(samplersRes.value?.items) ? samplersRes.value.items : [];
      if (forgeForm.sampler && !forgeSamplerItems.value.includes(forgeForm.sampler)) {
        forgeForm.sampler = "";
      }
    }
    if (cnModulesRes.status === "fulfilled") {
      forgeCnModuleItems.value = Array.isArray(cnModulesRes.value?.items) ? cnModulesRes.value.items : [];
      if (forgeForm.controlNetModule && !forgeCnModuleOptions.value.some((item) => item.value === forgeForm.controlNetModule)) {
        forgeForm.controlNetModule = "none";
      }
    }
    if (cnModelsRes.status === "fulfilled") {
      forgeCnModelItems.value = Array.isArray(cnModelsRes.value?.items) ? cnModelsRes.value.items : [];
      if (forgeForm.controlNetModel && !forgeCnModelOptions.value.some((item) => item.value === forgeForm.controlNetModel)) {
        forgeForm.controlNetModel = "None";
      }
    }
    if (lorasRes.status === "fulfilled") {
      forgeLoraItems.value = Array.isArray(lorasRes.value?.items) ? lorasRes.value.items : [];
      if (forgeForm.lora && !forgeLoraItems.value.includes(forgeForm.lora)) {
        forgeForm.lora = "";
      }
    }

    hasAnySuccess =
      modelsRes.status === "fulfilled" ||
      samplersRes.status === "fulfilled" ||
      cnModulesRes.status === "fulfilled" ||
      cnModelsRes.status === "fulfilled" ||
      lorasRes.status === "fulfilled";

    if (!hasAnySuccess && !silent) {
      message.warning("Forge参数拉取失败，请确认接口地址和服务状态");
    }
  } finally {
    forgeLoadingMeta.value = false;
  }
  return hasAnySuccess;
};

const connectForge = async () => {
  if (!state.hostForge) {
    message.warning("当前宿主未挂载 Forge 接口");
    return;
  }
  const connect = (api as any).forgeTestConnection;
  if (typeof connect !== "function") {
    message.warning("当前宿主未挂载 Forge 接口");
    return;
  }

  clampRuntimeValues();
  const apiUrl = normalizeForgeUrl(forgeForm.apiUrl || FORGE_DEFAULT_API_URL);
  if (!apiUrl) {
    message.warning("请先填写 Forge 地址");
    return;
  }
  if (forgeCloudConnected.value) {
    disconnectForgeCloud(true);
  }
  forgeForm.apiUrl = apiUrl;

  forgeConnecting.value = true;
  forgeStatusText.value = "连接中...";
  try {
    const result = (await withTimeout(
      Promise.resolve(connect({ url: apiUrl, timeoutSeconds: 12 })),
      16000,
      "Forge连接检测",
    )) as { connected?: boolean; model?: string };

    if (!result?.connected) {
      throw new Error("连接失败");
    }

    forgeConnected.value = true;
    forgeStatusText.value = result.model ? `已连接（${result.model}）` : "已连接";
    logTagged("Forge", `连接成功：${apiUrl}`, "success");
    message.success("Forge连接成功");
    await loadForgeMetaOptions(apiUrl, true);
    await loadForgePresetItems(true);
  } catch (error) {
    forgeConnected.value = false;
    const text = getErrorMessage(error);
    forgeStatusText.value = `连接失败：${text}`;
    logTagged("Forge", `连接失败：${text}`, "error");
    message.error(`Forge连接失败：${text}`);
  } finally {
    forgeConnecting.value = false;
  }
};

const refreshForgeMetaOptions = async () => {
  if (!forgeRuntimeConnected.value) {
    message.warning("请先连接 Forge");
    return;
  }
  const ok = await loadForgeMetaOptions(forgeForm.apiUrl);
  if (ok) {
    message.success("Forge参数已刷新");
  } else {
    message.warning("Forge参数刷新失败，请检查服务状态");
  }
};

const prefillForgeCloudRememberedSetting = async () => {
  if (forgeCloudRememberedReady.value || !state.hostForgeCloud) return;
  const restore = (api as any).cloudRestoreSession;
  if (typeof restore !== "function") return;
  try {
    const result = (await withTimeout(
      Promise.resolve(restore()),
      12000,
      "云Forge会话恢复",
    )) as { success?: boolean; user?: any; setting?: { email?: string; password?: string; remember?: boolean } };
    forgeCloudUser.value = result?.success ? result.user ?? null : null;
    forgeCloudAuthForm.email = String(result?.setting?.email ?? "");
    forgeCloudAuthForm.password = String(result?.setting?.password ?? "");
    forgeCloudAuthForm.remember = Boolean(result?.setting?.remember);
    forgeCloudRememberedReady.value = true;
    if (result?.success) {
      await refreshForgeCloudPoints(true);
      if (!forgeCloudConnected.value && !forgeCloudBusy.value) {
        void connectForgeCloud();
      }
    }
  } catch {
    forgeCloudRememberedReady.value = true;
  }
};

const refreshForgeCloudPoints = async (silent = false) => {
  if (!state.hostForgeCloud || !forgeCloudUser.value) return false;
  const getPoints = (api as any).cloudGetUserPoints;
  if (typeof getPoints !== "function") return false;
  try {
    const result = (await withTimeout(
      Promise.resolve(getPoints()),
      12000,
      "云Forge积分",
    )) as { success?: boolean; points?: number; message?: string };
    if (!result?.success) {
      if (!silent) {
        message.warning(result?.message || "获取云Forge积分失败");
      }
      return false;
    }
    forgeCloudPoints.value = Math.max(0, Math.floor(Number(result?.points ?? 0) || 0));
    return true;
  } catch (error) {
    if (!silent) {
      message.warning(`获取云Forge积分失败：${getErrorMessage(error)}`);
    }
    return false;
  }
};

const disconnectForgeCloud = (silent = false) => {
  forgeCloudEncryptedUrl.value = "";
  forgeCloudConnected.value = false;
  if (!silent) {
    message.success("已断开云Forge");
  }
};

const setForgeCloudAuthVisible = (visible: boolean) => {
  forgeCloudAuthVisible.value = visible;
};

const connectForgeCloud = async () => {
  if (!state.hostForgeCloud) {
    message.warning("当前宿主未挂载云Forge接口");
    return false;
  }
  if (!forgeCloudUser.value) {
    await prefillForgeCloudRememberedSetting();
    forgeCloudAuthVisible.value = true;
    return false;
  }
  const getUrl = (api as any).cloudGetForgeUrl;
  const testCloud = (api as any).cloudTestForgeConnection;
  if (typeof getUrl !== "function" || typeof testCloud !== "function") {
    message.warning("当前宿主未挂载云Forge接口");
    return false;
  }
  forgeCloudBusy.value = true;
  try {
    const urlResult = (await withTimeout(
      Promise.resolve(getUrl()),
      15000,
      "云Forge地址",
    )) as { success?: boolean; encrypted?: string; url?: string; error?: string };
    if (!urlResult?.success || !urlResult?.encrypted) {
      throw new Error(urlResult?.error || "未获取到云Forge地址");
    }
    const testResult = (await withTimeout(
      Promise.resolve(testCloud({ encrypted: urlResult.encrypted })),
      15000,
      "云Forge连接检测",
    )) as { success?: boolean; modelCount?: number; error?: string };
    if (!testResult?.success) {
      throw new Error(testResult?.error || "云Forge连接失败");
    }
    forgeCloudEncryptedUrl.value = urlResult.encrypted;
    forgeCloudConnected.value = true;
    if (urlResult.url) {
      forgeForm.apiUrl = normalizeForgeUrl(urlResult.url) || forgeForm.apiUrl;
      await loadForgeMetaOptions(forgeForm.apiUrl, true);
    }
    await refreshForgeCloudPoints(true);
    message.success(`云Forge已连接${testResult?.modelCount ? `（模型 ${testResult.modelCount}）` : ""}`);
    return true;
  } catch (error) {
    disconnectForgeCloud(true);
    message.error(`云Forge连接失败：${getErrorMessage(error)}`);
    return false;
  } finally {
    forgeCloudBusy.value = false;
  }
};

const loginForgeCloud = async () => {
  if (!state.hostForgeCloud) {
    message.warning("当前宿主未挂载云Forge接口");
    return false;
  }
  const login = (api as any).cloudLogin;
  if (typeof login !== "function") return false;
  const email = String(forgeCloudAuthForm.email ?? "").trim();
  const password = String(forgeCloudAuthForm.password ?? "");
  if (!email || !password) {
    message.warning("请输入邮箱和密码");
    return false;
  }
  forgeCloudAuthSubmitting.value = true;
  try {
    const result = (await withTimeout(
      Promise.resolve(login({
        email,
        password,
        remember: forgeCloudAuthForm.remember,
      })),
      15000,
      "云Forge登录",
    )) as { success?: boolean; message?: string; user?: any };
    if (!result?.success || !result?.user) {
      throw new Error(result?.message || "登录失败");
    }
    forgeCloudUser.value = result.user;
    forgeCloudAuthVisible.value = false;
    forgeCloudRememberedReady.value = true;
    await refreshForgeCloudPoints(true);
    await connectForgeCloud();
    return true;
  } catch (error) {
    message.error(`云Forge登录失败：${getErrorMessage(error)}`);
    return false;
  } finally {
    forgeCloudAuthSubmitting.value = false;
  }
};

const logoutForgeCloud = async () => {
  if (!state.hostForgeCloud) return;
  const logout = (api as any).cloudLogout;
  if (typeof logout !== "function") return;
  try {
    const result = (await withTimeout(
      Promise.resolve(logout({ email: String(forgeCloudUser.value?.email ?? "") })),
      12000,
      "云Forge登出",
    )) as { success?: boolean; setting?: { email?: string; password?: string; remember?: boolean } };
    if (result?.setting) {
      forgeCloudAuthForm.email = String(result.setting.email ?? "");
      forgeCloudAuthForm.password = String(result.setting.password ?? "");
      forgeCloudAuthForm.remember = Boolean(result.setting.remember);
    }
  } catch (error) {
    message.warning(`云Forge登出失败：${getErrorMessage(error)}`);
  } finally {
    forgeCloudUser.value = null;
    forgeCloudPoints.value = 0;
    forgeCloudAuthVisible.value = false;
    disconnectForgeCloud(true);
    message.success("已退出云Forge账号");
  }
};

const translateForgeText = async (text: string) => {
  if (!state.hostYoudaoTranslate) {
    throw new Error("当前宿主未挂载有道翻译接口");
  }
  const translate = (api as any).youdaoTranslate;
  if (typeof translate !== "function") {
    throw new Error("当前宿主未挂载有道翻译接口");
  }
  const result = (await withTimeout(
    Promise.resolve(translate({ text, fromLang: "auto", toLang: "en" })),
    15000,
    "Forge翻译",
  )) as { success?: boolean; text?: string; error?: string };
  if (!result?.success || !String(result?.text ?? "").trim()) {
    throw new Error(result?.error || "翻译失败");
  }
  return String(result.text).trim();
};

const saveForgeDraft = () => {
  clampRuntimeValues();
  if (safeSaveLocalState()) {
    message.success("Forge地址与参数已保存");
  } else {
    message.warning("Forge参数保存失败");
  }
};

const interruptForgeGenerate = async () => {
  const interrupt = (api as any).forgeInterrupt;
  if (typeof interrupt !== "function") return;
  try {
    await withTimeout(
      Promise.resolve(interrupt({ url: normalizeForgeUrl(forgeForm.apiUrl), timeoutSeconds: 6 })),
      8000,
      "Forge中断",
    );
    logTagged("Forge", "已发送中断请求", "warn");
  } catch (error) {
    logTagged("Forge", `中断请求失败：${getErrorMessage(error)}`, "warn");
  } finally {
    forgeRunning.value = false;
  }
};

const runForgeGenerate = async () => {
  if (!state.hostForge) {
    message.warning("当前宿主未挂载 Forge 接口");
    return;
  }
  if (forgeRunning.value) {
    await interruptForgeGenerate();
    return;
  }

  const useCloudForge = forgeCloudConnected.value && forgeCloudEncryptedUrl.value && state.hostForgeCloud;
  const generate = useCloudForge
    ? (api as any).cloudForgeGenerateImages
    : (api as any).forgeGenerateImages;
  if (typeof generate !== "function") {
    message.warning(`当前宿主未挂载 ${useCloudForge ? "云Forge" : "Forge"} 生成接口`);
    return;
  }

  clampRuntimeValues();
  if (!forgeRuntimeConnected.value) {
    message.warning("请先连接 Forge");
    return;
  }
  if (!String(forgeForm.prompt || "").trim()) {
    message.warning("请输入 Forge 提示词");
    return;
  }

  forgeRunning.value = true;
  logTagged("Forge", `开始执行 ${forgeForm.mode} 生成`, "info");
  try {
    const result = (await withTimeout(
      Promise.resolve(
        generate({
          url: normalizeForgeUrl(forgeForm.apiUrl),
          encrypted: useCloudForge ? forgeCloudEncryptedUrl.value : undefined,
          mode: forgeForm.mode,
          prompt: forgeForm.prompt,
          negativePrompt: forgeForm.negativePrompt,
          model: forgeForm.model,
          sampler: forgeForm.sampler,
          scheduler: forgeForm.scheduler,
          steps: forgeForm.steps,
          cfgScale: forgeForm.cfgScale,
          denoise: forgeForm.denoise,
          width: forgeForm.width,
          height: forgeForm.height,
          batchSize: forgeForm.batchSize,
          seed: forgeForm.seed,
          lora: forgeForm.lora,
          loraWeight: forgeForm.loraWeight,
          controlNetEnabled: forgeForm.controlNetEnabled,
          controlNetModule: forgeForm.controlNetModule,
          controlNetModel: forgeForm.controlNetModel,
          controlNetWeight: forgeForm.controlNetWeight,
          timeoutSeconds: forgeForm.timeoutSeconds,
          antiTruncationMode: form.antiMode,
          layerType: form.layerType,
          maxResolution: forgeForm.maxResolution,
        }),
      ),
      Math.max(30000, forgeForm.timeoutSeconds * 1000 + 12000),
      "Forge生成",
    )) as ForgeGenerateResult & { cloudBalance?: number; cloudConsumed?: number };

    if (result.errorMessages?.length) {
      result.errorMessages.forEach((item) => logTagged("Forge", item, "warn"));
    }
    if (typeof result.cloudBalance === "number") {
      forgeCloudPoints.value = Math.max(0, Math.floor(result.cloudBalance));
    }
    const successText = `完成：成功 ${result.successCount} / ${result.totalCount}`;
    logTagged("Forge", successText, "success");
    message.success(
      typeof result.cloudConsumed === "number"
        ? `${successText}，已扣积分 ${result.cloudConsumed}`
        : successText,
    );
  } catch (error) {
    const text = getErrorMessage(error);
    logTagged("Forge", `生成失败：${text}`, "error");
    message.error(`Forge生成失败：${text}`);
  } finally {
    forgeRunning.value = false;
  }
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
    if (state.hostForgeCloud) {
      void prefillForgeCloudRememberedSetting();
    }
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
  const hasValue =
      typeof value === "string"
          ? value.trim().length > 0
          : value !== null && value !== undefined;
  console.log(`[apiBaseUrl-debug] ${stage}`, {
    hasValue,
    typeofValue: typeof value,
    tag: Object.prototype.toString.call(value),
  });
  logTagged("调试", `${stage} | type=${typeof value} | hasValue=${hasValue ? 1 : 0}`, "info");
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
  return normalizeApiBaseUrl(value, DEFAULT_AI_CHAT_BASE_URL);
};

const getAiChatApiConfig = (protocol: AiChatProtocol) =>
    protocol === "openai"
      ? {models: "/v1/models", completions: "/v1/chat/completions", protocol: "openai" as const}
      : {models: "/v1beta/models", completions: "/v1beta/models/{model}:generateContent", protocol: "gemini" as const};

const normalizeGeminiModelId = (value: string) => String(value ?? "").replace(/^models\//i, "").trim();

const inferSingleModelFixedSize = (model: string): SizeOption | "" => {
  const normalized = normalizeApiKeyValue(model).toLowerCase();
  const matched = normalized.match(/(?:^|[-_])(1k|2k|4k)$/i);
  if (!matched) return "";
  const suffix = matched[1]?.toLowerCase();
  if (suffix === "1k") return "1K";
  if (suffix === "2k") return "2K";
  if (suffix === "4k") return "4K";
  return "";
};

const syncSingleRuntimeByModel = (model: string) => {
  const normalizedModel = normalizeApiKeyValue(model);
  if (!normalizedModel) {
    form.size = SINGLE_WORKBENCH_SIZE;
    return;
  }
  form.size = SINGLE_WORKBENCH_SIZE;
};

const applyQuotaBySelectedModel = (quota: QuotaResult): QuotaResult => {
  if (form.model === SINGLE_GEMINI_FLASH_IMAGE_MODEL) {
    const count1K = Number((Number(quota.totalAvailable || 0) / QUOTA_DIVISOR_GEMINI_1K).toFixed(1));
    return {
      ...quota,
      count1K,
      count2K: 0,
      count4K: 0,
    };
  }

  const totalAvailable = Number(quota.totalAvailable || 0);
  return {
    ...quota,
    count1K: Math.floor(totalAvailable / QUOTA_DIVISOR_AJ_1K),
    count2K: Math.floor(totalAvailable / QUOTA_DIVISOR_AJ_2K),
    count4K: Math.floor(totalAvailable / QUOTA_DIVISOR_AJ_4K),
  };
};

const clampPluginBackgroundOpacityValue = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_PLUGIN_BACKGROUND_OPACITY;
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const clampPluginBackgroundPanelOpacityValue = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_PLUGIN_BACKGROUND_PANEL_OPACITY;
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const clampPluginBackgroundBlurValue = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_PLUGIN_BACKGROUND_BLUR;
  return Math.max(0, Math.min(30, Math.round(parsed)));
};

const clampPageZoomValue = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  const rounded = Math.round(parsed * 10) / 10;
  return Math.max(PAGE_ZOOM_MIN, Math.min(PAGE_ZOOM_MAX, rounded));
};

const normalizeForgeUrl = (value: unknown) =>
  String(value ?? "").trim().replace(/\/+$/, "");

const clampForgeNumber = (value: unknown, min: number, max: number, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
};

const mapForgeSelectOptions = (items: string[]) =>
  items.map((item) => ({ label: item, value: item }));

const parseColorToRgb = (value: unknown): [number, number, number] | null => {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    let raw = hex[1];
    if (raw.length === 3) {
      raw = raw.split("").map((item) => item + item).join("");
    }
    if (raw.length === 8) {
      raw = raw.slice(0, 6);
    }
    const numeric = Number.parseInt(raw, 16);
    if (Number.isFinite(numeric)) {
      return [(numeric >> 16) & 255, (numeric >> 8) & 255, numeric & 255];
    }
  }

  const rgb = text.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const parts = rgb[1]
      .split(",")
      .map((item) => Number.parseFloat(item.trim()))
      .filter((item) => Number.isFinite(item));
    if (parts.length >= 3) {
      return [
        Math.max(0, Math.min(255, Math.round(parts[0]))),
        Math.max(0, Math.min(255, Math.round(parts[1]))),
        Math.max(0, Math.min(255, Math.round(parts[2]))),
      ];
    }
  }

  return null;
};

const toRgbaColor = (color: unknown, alpha: number, fallback: [number, number, number]) => {
  const [r, g, b] = parseColorToRgb(color) || fallback;
  const normalizedAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${(Math.round(normalizedAlpha * 1000) / 1000).toFixed(3)})`;
};

const mainPageBackgroundStyle = computed(() => {
  const hasBackground = pluginBackgroundImageDataUrl.value.startsWith("data:image/");
  const imageOpacity = clampPluginBackgroundOpacityValue(pluginBackgroundOpacity.value) / 100;
  const panelOpacity = clampPluginBackgroundPanelOpacityValue(pluginBackgroundPanelOpacity.value) / 100;
  const blurValue = clampPluginBackgroundBlurValue(pluginBackgroundBlur.value);
  const pageZoomValue = clampPageZoomValue(pageZoom.value);
  const inverseScalePercent = `${(100 / pageZoomValue).toFixed(4)}%`;
  const formatAlpha = (value: number) => (Math.round(value * 1000) / 1000).toFixed(3);
  const themeTokens = THEME_PRESET_TOKENS[themePreset.value] || THEME_PRESET_TOKENS.midnight;

  const panelSoftColor = themeTokens["--panel-bg-soft"] || "#1f242b";
  const fieldBlockColor = themeTokens["--field-block-bg"] || "#1a2028";
  const inputColor = themeTokens["--input-bg"] || "#13171c";
  const tabsNavColor = themeTokens["--main-tabs-nav-bg"] || "#161b21";
  const tabsActiveColor = themeTokens["--main-tabs-active-bg"] || "#27303b";
  const panelBgColor = themeTokens["--panel-bg"] || "#171a1f";

  return {
    transform: `scale(${pageZoomValue})`,
    transformOrigin: "top left",
    width: inverseScalePercent,
    height: inverseScalePercent,
    "--plugin-bg-opacity": String(imageOpacity),
    "--plugin-bg-panel-soft": toRgbaColor(panelSoftColor, Math.min(0.95, panelOpacity * 0.90), [31, 36, 43]),
    "--plugin-bg-field": toRgbaColor(fieldBlockColor, Math.min(0.90, panelOpacity * 0.78), [26, 32, 40]),
    "--plugin-bg-input": toRgbaColor(inputColor, Math.min(0.85, panelOpacity * 0.68), [19, 23, 28]),
    "--plugin-bg-tabs-nav": toRgbaColor(tabsNavColor, Math.min(0.92, panelOpacity * 0.82), [22, 27, 33]),
    "--plugin-bg-tabs-active": toRgbaColor(tabsActiveColor, Math.min(0.98, panelOpacity * 0.96), [39, 48, 59]),
    "--plugin-bg-card": toRgbaColor(panelSoftColor, Math.min(0.95, panelOpacity * 0.86), [31, 36, 43]),
    "--plugin-bg-settings": toRgbaColor(fieldBlockColor, Math.min(0.90, panelOpacity * 0.80), [26, 32, 40]),
    "--plugin-bg-overlay-color": toRgbaColor(panelBgColor, 1, [23, 26, 31]),
    "--plugin-bg-overlay-opacity": formatAlpha(Math.min(0.18, panelOpacity * 0.18)),
    "--plugin-bg-ui-blur": `${blurValue}px`,
  } as Record<string, string>;
});

const hasPluginBackground = computed(() => pluginBackgroundImageDataUrl.value.startsWith("data:image/"));

const clampRuntimeValues = () => {
  syncSingleRuntimeByModel(form.model);

  pageZoom.value = clampPageZoomValue(pageZoom.value);
  pluginBackgroundOpacity.value = clampPluginBackgroundOpacityValue(pluginBackgroundOpacity.value);
  pluginBackgroundPanelOpacity.value = clampPluginBackgroundPanelOpacityValue(pluginBackgroundPanelOpacity.value);
  pluginBackgroundBlur.value = clampPluginBackgroundBlurValue(pluginBackgroundBlur.value);

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

  forgeForm.apiUrl = normalizeForgeUrl(forgeForm.apiUrl || FORGE_DEFAULT_API_URL) || FORGE_DEFAULT_API_URL;
  forgeForm.mode = forgeForm.mode === "txt2img" ? "txt2img" : "img2img";
  forgeForm.steps = Math.round(clampForgeNumber(forgeForm.steps, 1, 150, 20));
  forgeForm.cfgScale = clampForgeNumber(forgeForm.cfgScale, 1, 30, 7);
  forgeForm.denoise = clampForgeNumber(forgeForm.denoise, 0, 1, 0.35);
  forgeForm.width = Math.round(clampForgeNumber(forgeForm.width, 64, 4096, 768));
  forgeForm.height = Math.round(clampForgeNumber(forgeForm.height, 64, 4096, 768));
  forgeForm.batchSize = Math.round(clampForgeNumber(forgeForm.batchSize, 1, 8, 1));
  forgeForm.seed = Math.floor(clampForgeNumber(forgeForm.seed, -1, 2147483647, -1));
  forgeForm.loraWeight = clampForgeNumber(forgeForm.loraWeight, -3, 3, 1);
  forgeForm.controlNetWeight = clampForgeNumber(forgeForm.controlNetWeight, 0, 2, 1);
  forgeForm.timeoutSeconds = Math.round(clampForgeNumber(forgeForm.timeoutSeconds, 8, 600, 180));
  forgeForm.maxResolution = Math.round(clampForgeNumber(forgeForm.maxResolution, 512, 4096, 1536));
  forgeForm.scheduler = String(forgeForm.scheduler || "automatic").trim().toLowerCase() || "automatic";
  forgeForm.controlNetModule = String(forgeForm.controlNetModule || "none");
  forgeForm.controlNetModel = String(forgeForm.controlNetModel || "None");
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
    return false;
  }
};

const savePromptHistoryToJson = async () => {
  if (!promptHistoryJsonSaveSupported.value) return;
  try {
    await (api as any).savePromptHistoryRecords({
      records: promptHistoryRecords.value,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    logTagged("历史检索", `保存历史到本地 JSON 失败: ${message}`, "warn");
  }
};

const loadPromptHistoryFromJson = async () => {
  if (!promptHistoryJsonReadSupported.value) return;
  try {
    const result = (await (api as any).readPromptHistoryRecords()) as {
      records?: PromptHistoryRecordItem[];
    };
    const records = normalizePromptHistoryItems(result?.records);
    if (!Array.isArray(records)) return;
    if (records.length === 0) return;
    promptHistoryRecords.value = records;
    persistPromptHistorySeed();
    scheduleSaveLocalState();
    logTagged("历史检索", `已从本地 JSON 恢复历史 ${records.length} 条`, "info");
  } catch (error) {
    const message = getErrorMessage(error);
    logTagged("历史检索", `读取历史 JSON 失败: ${message}`, "warn");
  }
};

const saveProviderConfigsToJson = async () => {
  if (!providerConfigsJsonSaveSupported.value) return;
  try {
    await (api as any).saveProviderConfigs({
      items: providerItems.value.map((item) => ({
        id: item.id,
        name: item.name,
        baseUrl: item.baseUrl,
        key: item.key,
        protocolMode: item.protocolMode,
      })),
      selectedSingleProviderId: singleProviderId.value,
      selectedAiChatProviderId: aiChatProviderId.value,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    logTagged("服务商配置", `保存服务商到本地 JSON 失败: ${message}`, "warn");
  }
};

const loadProviderConfigsFromJson = async () => {
  if (!providerConfigsJsonReadSupported.value) return;
  try {
    const result = (await (api as any).readProviderConfigs()) as {
      items?: unknown[];
      selectedSingleProviderId?: string;
      selectedAiChatProviderId?: string;
    };
    const rawItems = Array.isArray(result?.items) ? result.items : [];
    if (rawItems.length === 0) return;

    applyProviders(
      parseProviderItems(
        rawItems,
        form.apiBaseUrl || aiChatBaseUrl.value || DEFAULT_API_BASE_URL,
        DEFAULT_SINGLE_PROVIDER_NAME,
        aiChatApiKey.value || form.apiKey || "",
      ),
    );

    const storedSingleId = normalizeApiKeyValue(result?.selectedSingleProviderId);
    if (storedSingleId && providerItems.value.some((item) => item.id === storedSingleId)) {
      singleProviderId.value = storedSingleId;
    } else if (!providerItems.value.some((item) => item.id === singleProviderId.value)) {
      singleProviderId.value = findPreferredSingleProviderId(providerItems.value);
    }

    const storedAiId = normalizeApiKeyValue(result?.selectedAiChatProviderId);
    if (storedAiId && providerItems.value.some((item) => item.id === storedAiId)) {
      aiChatProviderId.value = storedAiId;
    } else if (!providerItems.value.some((item) => item.id === aiChatProviderId.value)) {
      aiChatProviderId.value = findPreferredAiChatProviderId(providerItems.value);
    }

    const selectedSingleProvider = providerItems.value.find((item) => item.id === singleProviderId.value) || null;
    const selectedAiChatProvider = providerItems.value.find((item) => item.id === aiChatProviderId.value) || null;
    form.apiBaseUrl = selectedSingleProvider?.baseUrl || DEFAULT_API_BASE_URL;
    form.apiKey = selectedSingleProvider?.key || "";
    aiChatBaseUrl.value = selectedAiChatProvider?.baseUrl || DEFAULT_AI_CHAT_BASE_URL;
    aiChatApiKey.value = selectedAiChatProvider?.key || "";
    scheduleSaveLocalState();
    logTagged("服务商配置", `已从本地 JSON 恢复服务商 ${providerItems.value.length} 条`, "info");
  } catch (error) {
    const message = getErrorMessage(error);
    logTagged("服务商配置", `读取服务商 JSON 失败: ${message}`, "warn");
  }
};

const scheduleSaveProviderConfigsToJson = () => {
  if (providerConfigPersistTimer) {
    window.clearTimeout(providerConfigPersistTimer);
  }
  providerConfigPersistTimer = window.setTimeout(() => {
    providerConfigPersistTimer = null;
    void saveProviderConfigsToJson();
  }, 320);
};

const normalizePromptHistoryContent = (value: unknown) =>
  String(value ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, PROMPT_HISTORY_MAX_CONTENT_LENGTH);

const normalizePromptHistoryItems = (value: unknown): PromptHistoryRecordItem[] => {
  if (!Array.isArray(value)) return [];
  const list: PromptHistoryRecordItem[] = [];
  let fallbackId = 1;
  for (const raw of value) {
    const eventType = String((raw as any)?.eventType ?? "").trim() as PromptHistoryEventType;
    if (!PROMPT_HISTORY_EVENT_LABEL_MAP[eventType]) continue;
    const content = normalizePromptHistoryContent((raw as any)?.content);
    if (!content) continue;
    const createdAtRaw = Number((raw as any)?.createdAt);
    const idRaw = Number((raw as any)?.id);
    const createdAt = Number.isFinite(createdAtRaw) && createdAtRaw > 0 ? createdAtRaw : Date.now();
    const id = Number.isFinite(idRaw) && idRaw > 0 ? Math.floor(idRaw) : fallbackId++;
    list.push({ id, eventType, content, createdAt });
  }
  list.sort((a, b) => b.createdAt - a.createdAt);
  return list.slice(0, PROMPT_HISTORY_MAX_ITEMS);
};

const persistPromptHistorySeed = () => {
  promptHistoryIdSeed = promptHistoryRecords.value.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
};

const pushPromptHistoryRecord = (eventType: PromptHistoryEventType, content: unknown) => {
  const normalizedContent = normalizePromptHistoryContent(content);
  if (!normalizedContent) return;
  const now = Date.now();
  const latest = promptHistoryRecords.value[0];
  if (
    latest &&
    latest.eventType === eventType &&
    latest.content === normalizedContent &&
    now - latest.createdAt < 1800
  ) {
    return;
  }
  const next: PromptHistoryRecordItem = {
    id: ++promptHistoryIdSeed,
    eventType,
    content: normalizedContent,
    createdAt: now,
  };
  promptHistoryRecords.value = [next, ...promptHistoryRecords.value].slice(0, PROMPT_HISTORY_MAX_ITEMS);
  scheduleSaveLocalState();
  scheduleSavePromptHistoryToJson();
};

const formatPromptHistoryTime = (timestamp: number) =>
  new Date(timestamp).toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const applyPromptHistoryToSinglePrompt = (item: PromptHistoryRecordItem) => {
  const content = normalizePromptHistoryContent(item?.content);
  if (!content) {
    message.warning("该记录内容为空，无法填入");
    return;
  }
  form.prompt = content;
  activeTab.value = "single";
  promptHistoryDialogVisible.value = false;
  scheduleSaveLocalState();
  message.success("已填入图像工作台提示词");
};

const isPromptHistoryRecordExpanded = (id: number) =>
  promptHistoryExpandedRecordIds.value.includes(id);

const togglePromptHistoryRecordExpand = (id: number) => {
  if (!Number.isFinite(id) || id <= 0) return;
  const expandedSet = new Set(promptHistoryExpandedRecordIds.value);
  if (expandedSet.has(id)) {
    expandedSet.delete(id);
  } else {
    expandedSet.add(id);
  }
  promptHistoryExpandedRecordIds.value = Array.from(expandedSet);
};

const clearPromptHistory = () => {
  if (promptHistoryRecords.value.length === 0) return;
  const confirmed = typeof window.confirm === "function" ? window.confirm("确定清空所有历史记录吗？") : true;
  if (!confirmed) return;
  promptHistoryRecords.value = [];
  promptHistoryKeyword.value = "";
  promptHistoryEventType.value = "";
  promptHistoryExpandedRecordIds.value = [];
  promptHistoryIdSeed = 0;
  scheduleSaveLocalState();
  scheduleSavePromptHistoryToJson();
  message.success("历史记录已清空");
};

const openPromptHistoryDialog = (source: string) => {
  promptHistoryExpandedRecordIds.value = [];
  promptHistoryDialogVisible.value = true;
  logTagged("历史检索", `已打开（${source}）`, "info");
};

const savePluginBackgroundLocalState = () => {
  writeLocalStorage(STORAGE_KEYS.pluginBackgroundImage, pluginBackgroundImageDataUrl.value);
  writeLocalStorage(
    STORAGE_KEYS.pluginBackgroundOpacity,
    String(clampPluginBackgroundOpacityValue(pluginBackgroundOpacity.value)),
  );
  writeLocalStorage(
    STORAGE_KEYS.pluginBackgroundPanelOpacity,
    String(clampPluginBackgroundPanelOpacityValue(pluginBackgroundPanelOpacity.value)),
  );
  writeLocalStorage(
    STORAGE_KEYS.pluginBackgroundBlur,
    String(clampPluginBackgroundBlurValue(pluginBackgroundBlur.value)),
  );
};

const scheduleSavePluginBackgroundToJson = () => {
  if (pluginBackgroundPersistTimer) {
    window.clearTimeout(pluginBackgroundPersistTimer);
  }
  pluginBackgroundPersistTimer = window.setTimeout(() => {
    pluginBackgroundPersistTimer = null;
    void savePluginBackgroundToJson();
  }, 320);
};

const scheduleSavePromptHistoryToJson = () => {
  if (promptHistoryPersistTimer) {
    window.clearTimeout(promptHistoryPersistTimer);
  }
  promptHistoryPersistTimer = window.setTimeout(() => {
    promptHistoryPersistTimer = null;
    void savePromptHistoryToJson();
  }, 320);
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
  writeLocalStorage(STORAGE_KEYS.selectedSingleProviderId, singleProviderId.value);
  writeLocalStorage(STORAGE_KEYS.selectedAiChatProviderId, aiChatProviderId.value);
  writeLocalStorage(STORAGE_KEYS.tabShowProvider, showProviderTab.value ? "1" : "0");
  writeLocalStorage(STORAGE_KEYS.tabShowForge, showForgeTab.value ? "1" : "0");
  writeLocalStorage(STORAGE_KEYS.tabShowPromptQuery, showPromptQueryTab.value ? "1" : "0");
  writeLocalStorage(STORAGE_KEYS.providerConfigs, JSON.stringify(providerItems.value));
  writeLocalStorage(STORAGE_KEYS.singleProviders, JSON.stringify(providerItems.value));
  writeLocalStorage(STORAGE_KEYS.aiChatProviders, JSON.stringify(providerItems.value));
  writeLocalStorage(STORAGE_KEYS.pageZoom, String(clampPageZoomValue(pageZoom.value)));
  writeLocalStorage(STORAGE_KEYS.promptQueryFavoritesOnly, promptQueryFavoritesOnly.value ? "1" : "0");
  writeLocalStorage(STORAGE_KEYS.promptQuerySourceType, promptQuerySourceType.value);
  writeLocalStorage(STORAGE_KEYS.customFeatureEnabled, customFeatureEnabled.value ? "1" : "0");
  writeLocalStorage(STORAGE_KEYS.themePreset, themePreset.value);
  writeLocalStorage(STORAGE_KEYS.singleRunShortcut, singleRunShortcut.value);
  writeLocalStorage(STORAGE_KEYS.aiChatSendShortcut, aiChatSendShortcut.value);
  writeLocalStorage(STORAGE_KEYS.mainTabPrevShortcut, mainTabPrevShortcut.value);
  writeLocalStorage(STORAGE_KEYS.mainTabNextShortcut, mainTabNextShortcut.value);
  writeLocalStorage(STORAGE_KEYS.inputPrevShortcut, inputPrevShortcut.value);
  writeLocalStorage(STORAGE_KEYS.inputNextShortcut, inputNextShortcut.value);
  writeLocalStorage(STORAGE_KEYS.apiBaseUrl, form.apiBaseUrl);
  writeLocalStorage(STORAGE_KEYS.model, form.model);
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
  writeLocalStorage(STORAGE_KEYS.aiChatSelectedModel, aiChatSelectedModel.value);
  writeLocalStorage(STORAGE_KEYS.aiChatOperationModel, aiChatOperationModel.value);
  writeLocalStorage(STORAGE_KEYS.aiChatApiKey, aiChatApiKey.value);
  writeLocalStorage(STORAGE_KEYS.aiChatUserAvatar, aiChatUserAvatarDataUrl.value);
  writeLocalStorage(STORAGE_KEYS.aiChatContextCount, String(aiChatContextCount.value));
  writeLocalStorage(STORAGE_KEYS.aiChatTimeoutSeconds, String(aiChatTimeoutSeconds.value));
  writeLocalStorage(STORAGE_KEYS.aiChatMaxTokens, String(aiChatMaxTokens.value));
  writeLocalStorage(STORAGE_KEYS.aiChatSystemPrompt, aiChatSystemPrompt.value);
  writeLocalStorage(STORAGE_KEYS.aiChatTemperature, String(aiChatTemperature.value));
  writeLocalStorage(STORAGE_KEYS.aiChatTopP, String(aiChatTopP.value));
  writeLocalStorage(STORAGE_KEYS.aiChatPresencePenalty, String(aiChatPresencePenalty.value));
  writeLocalStorage(STORAGE_KEYS.aiChatFrequencyPenalty, String(aiChatFrequencyPenalty.value));
  writeLocalStorage(STORAGE_KEYS.aiChatJsonModeEnabled, aiChatJsonModeEnabled.value ? "1" : "0");
  writeLocalStorage(STORAGE_KEYS.pluginBackgroundImage, pluginBackgroundImageDataUrl.value);
  writeLocalStorage(STORAGE_KEYS.pluginBackgroundOpacity, String(clampPluginBackgroundOpacityValue(pluginBackgroundOpacity.value)));
  writeLocalStorage(
    STORAGE_KEYS.pluginBackgroundPanelOpacity,
    String(clampPluginBackgroundPanelOpacityValue(pluginBackgroundPanelOpacity.value)),
  );
  writeLocalStorage(STORAGE_KEYS.pluginBackgroundBlur, String(clampPluginBackgroundBlurValue(pluginBackgroundBlur.value)));
  writeLocalStorage(STORAGE_KEYS.promptHistoryRecords, JSON.stringify(promptHistoryRecords.value));
  writeLocalStorage(STORAGE_KEYS.forgeApiUrl, forgeForm.apiUrl);
  writeLocalStorage(STORAGE_KEYS.forgeMode, forgeForm.mode);
  writeLocalStorage(STORAGE_KEYS.forgePrompt, forgeForm.prompt);
  writeLocalStorage(STORAGE_KEYS.forgeNegativePrompt, forgeForm.negativePrompt);
  writeLocalStorage(STORAGE_KEYS.forgeModel, forgeForm.model);
  writeLocalStorage(STORAGE_KEYS.forgeSampler, forgeForm.sampler);
  writeLocalStorage(STORAGE_KEYS.forgeScheduler, forgeForm.scheduler);
  writeLocalStorage(STORAGE_KEYS.forgeSteps, String(forgeForm.steps));
  writeLocalStorage(STORAGE_KEYS.forgeCfgScale, String(forgeForm.cfgScale));
  writeLocalStorage(STORAGE_KEYS.forgeDenoise, String(forgeForm.denoise));
  writeLocalStorage(STORAGE_KEYS.forgeWidth, String(forgeForm.width));
  writeLocalStorage(STORAGE_KEYS.forgeHeight, String(forgeForm.height));
  writeLocalStorage(STORAGE_KEYS.forgeBatchSize, String(forgeForm.batchSize));
  writeLocalStorage(STORAGE_KEYS.forgeSeed, String(forgeForm.seed));
  writeLocalStorage(STORAGE_KEYS.forgeLora, forgeForm.lora);
  writeLocalStorage(STORAGE_KEYS.forgeLoraWeight, String(forgeForm.loraWeight));
  writeLocalStorage(STORAGE_KEYS.forgeCnEnabled, forgeForm.controlNetEnabled ? "1" : "0");
  writeLocalStorage(STORAGE_KEYS.forgeCnModule, forgeForm.controlNetModule);
  writeLocalStorage(STORAGE_KEYS.forgeCnModel, forgeForm.controlNetModel);
  writeLocalStorage(STORAGE_KEYS.forgeCnWeight, String(forgeForm.controlNetWeight));
  writeLocalStorage(STORAGE_KEYS.forgeTimeoutSeconds, String(forgeForm.timeoutSeconds));
  writeLocalStorage(STORAGE_KEYS.forgeMaxResolution, String(forgeForm.maxResolution));
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
  const storedSelectedSingleProviderId = readLocalStorage(STORAGE_KEYS.selectedSingleProviderId);
  const storedSelectedAiChatProviderId = readLocalStorage(STORAGE_KEYS.selectedAiChatProviderId);
  const storedTabShowProvider = readLocalStorage(STORAGE_KEYS.tabShowProvider);
  const storedTabShowForge = readLocalStorage(STORAGE_KEYS.tabShowForge);
  const storedTabShowPromptQuery = readLocalStorage(STORAGE_KEYS.tabShowPromptQuery);
  const storedProviderConfigsRaw = readLocalStorage(STORAGE_KEYS.providerConfigs);
  const storedSingleProvidersRaw = readLocalStorage(STORAGE_KEYS.singleProviders);
  const storedAiChatProvidersRaw = readLocalStorage(STORAGE_KEYS.aiChatProviders);
  const storedPageZoom = Number(readLocalStorage(STORAGE_KEYS.pageZoom));
  const storedPromptQueryFavoritesOnly = readLocalStorage(STORAGE_KEYS.promptQueryFavoritesOnly);
  const storedPromptQuerySourceType = readLocalStorage(STORAGE_KEYS.promptQuerySourceType);
  const storedCustomFeatureEnabled = readLocalStorage(STORAGE_KEYS.customFeatureEnabled);
  const storedLegacyImagePreviewFeatureUnlocked = readLocalStorage(LEGACY_STORAGE_KEYS.imagePreviewFeatureUnlocked);
  const storedThemePreset = readLocalStorage(STORAGE_KEYS.themePreset);
  const storedSingleRunShortcut = readLocalStorage(STORAGE_KEYS.singleRunShortcut);
  const storedAiChatSendShortcut = readLocalStorage(STORAGE_KEYS.aiChatSendShortcut);
  const storedMainTabPrevShortcut = readLocalStorage(STORAGE_KEYS.mainTabPrevShortcut);
  const storedMainTabNextShortcut = readLocalStorage(STORAGE_KEYS.mainTabNextShortcut);
  const storedInputPrevShortcut = readLocalStorage(STORAGE_KEYS.inputPrevShortcut);
  const storedInputNextShortcut = readLocalStorage(STORAGE_KEYS.inputNextShortcut);
  const storedApiBaseUrl = readLocalStorage(STORAGE_KEYS.apiBaseUrl);
  const storedModel = readLocalStorage(STORAGE_KEYS.model);
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
  const storedAiChatSelectedModel = readLocalStorage(STORAGE_KEYS.aiChatSelectedModel);
  const storedAiChatOperationModel = readLocalStorage(STORAGE_KEYS.aiChatOperationModel);
  const storedAiChatApiKey = readLocalStorage(STORAGE_KEYS.aiChatApiKey);
  const storedAiChatUserAvatar = readLocalStorage(STORAGE_KEYS.aiChatUserAvatar);
  const storedAiChatContextCount = Number(readLocalStorage(STORAGE_KEYS.aiChatContextCount));
  const storedAiChatTimeoutSeconds = Number(readLocalStorage(STORAGE_KEYS.aiChatTimeoutSeconds));
  const storedAiChatMaxTokens = Number(readLocalStorage(STORAGE_KEYS.aiChatMaxTokens));
  const storedAiChatSystemPrompt = readLocalStorage(STORAGE_KEYS.aiChatSystemPrompt);
  const storedAiChatTemperature = Number(readLocalStorage(STORAGE_KEYS.aiChatTemperature));
  const storedAiChatTopP = Number(readLocalStorage(STORAGE_KEYS.aiChatTopP));
  const storedAiChatPresencePenalty = Number(readLocalStorage(STORAGE_KEYS.aiChatPresencePenalty));
  const storedAiChatFrequencyPenalty = Number(readLocalStorage(STORAGE_KEYS.aiChatFrequencyPenalty));
  const storedAiChatJsonModeEnabled = readLocalStorage(STORAGE_KEYS.aiChatJsonModeEnabled);
  const storedPluginBackgroundImage = readLocalStorage(STORAGE_KEYS.pluginBackgroundImage);
  const storedPluginBackgroundOpacityRaw = readLocalStorage(STORAGE_KEYS.pluginBackgroundOpacity);
  const storedPluginBackgroundPanelOpacityRaw = readLocalStorage(STORAGE_KEYS.pluginBackgroundPanelOpacity);
  const storedPluginBackgroundBlurRaw = readLocalStorage(STORAGE_KEYS.pluginBackgroundBlur);
  const storedPromptHistoryRecords = readLocalStorage(STORAGE_KEYS.promptHistoryRecords);
  const storedForgeApiUrl = readLocalStorage(STORAGE_KEYS.forgeApiUrl);
  const storedForgeMode = readLocalStorage(STORAGE_KEYS.forgeMode);
  const storedForgePrompt = readLocalStorage(STORAGE_KEYS.forgePrompt);
  const storedForgeNegativePrompt = readLocalStorage(STORAGE_KEYS.forgeNegativePrompt);
  const storedForgeModel = readLocalStorage(STORAGE_KEYS.forgeModel);
  const storedForgeSampler = readLocalStorage(STORAGE_KEYS.forgeSampler);
  const storedForgeScheduler = readLocalStorage(STORAGE_KEYS.forgeScheduler);
  const storedForgeSteps = Number(readLocalStorage(STORAGE_KEYS.forgeSteps));
  const storedForgeCfgScale = Number(readLocalStorage(STORAGE_KEYS.forgeCfgScale));
  const storedForgeDenoise = Number(readLocalStorage(STORAGE_KEYS.forgeDenoise));
  const storedForgeWidth = Number(readLocalStorage(STORAGE_KEYS.forgeWidth));
  const storedForgeHeight = Number(readLocalStorage(STORAGE_KEYS.forgeHeight));
  const storedForgeBatchSize = Number(readLocalStorage(STORAGE_KEYS.forgeBatchSize));
  const storedForgeSeed = Number(readLocalStorage(STORAGE_KEYS.forgeSeed));
  const storedForgeLora = readLocalStorage(STORAGE_KEYS.forgeLora);
  const storedForgeLoraWeight = Number(readLocalStorage(STORAGE_KEYS.forgeLoraWeight));
  const storedForgeCnEnabled = readLocalStorage(STORAGE_KEYS.forgeCnEnabled);
  const storedForgeCnModule = readLocalStorage(STORAGE_KEYS.forgeCnModule);
  const storedForgeCnModel = readLocalStorage(STORAGE_KEYS.forgeCnModel);
  const storedForgeCnWeight = Number(readLocalStorage(STORAGE_KEYS.forgeCnWeight));
  const storedForgeTimeoutSeconds = Number(readLocalStorage(STORAGE_KEYS.forgeTimeoutSeconds));
  const storedForgeMaxResolution = Number(readLocalStorage(STORAGE_KEYS.forgeMaxResolution));
  const storedPluginBackgroundOpacity =
    storedPluginBackgroundOpacityRaw === null ? Number.NaN : Number(storedPluginBackgroundOpacityRaw);
  const storedPluginBackgroundPanelOpacity =
    storedPluginBackgroundPanelOpacityRaw === null ? Number.NaN : Number(storedPluginBackgroundPanelOpacityRaw);
  const storedPluginBackgroundBlur =
    storedPluginBackgroundBlurRaw === null ? Number.NaN : Number(storedPluginBackgroundBlurRaw);
  let parsedSingleProvidersRaw: unknown = null;
  try {
    parsedSingleProvidersRaw = storedProviderConfigsRaw ? JSON.parse(storedProviderConfigsRaw) : null;
  } catch {
    parsedSingleProvidersRaw = null;
  }
  if (!parsedSingleProvidersRaw && storedSingleProvidersRaw) {
    try {
      parsedSingleProvidersRaw = JSON.parse(storedSingleProvidersRaw);
    } catch {
      parsedSingleProvidersRaw = null;
    }
  }
  if (!parsedSingleProvidersRaw && storedAiChatProvidersRaw) {
    try {
      parsedSingleProvidersRaw = JSON.parse(storedAiChatProvidersRaw);
    } catch {
      parsedSingleProvidersRaw = null;
    }
  }

  applyProviders(
    parseProviderItems(
      parsedSingleProvidersRaw,
      storedApiBaseUrl || storedAiChatBaseUrl || DEFAULT_API_BASE_URL,
      DEFAULT_SINGLE_PROVIDER_NAME,
      storedAiChatApiKey || "",
    ),
  );
  if (storedSelectedSingleProviderId) {
    singleProviderId.value = storedSelectedSingleProviderId;
  }
  if (!providerItems.value.some((item) => item.id === singleProviderId.value)) {
    singleProviderId.value = findPreferredSingleProviderId(providerItems.value);
  }
  if (storedSelectedAiChatProviderId) {
    aiChatProviderId.value = storedSelectedAiChatProviderId;
  }
  if (!providerItems.value.some((item) => item.id === aiChatProviderId.value)) {
    aiChatProviderId.value = findPreferredAiChatProviderId(providerItems.value);
  }
  const selectedSingleProvider = providerItems.value.find((item) => item.id === singleProviderId.value) || null;
  const selectedAiChatProvider = providerItems.value.find((item) => item.id === aiChatProviderId.value) || null;
  form.apiBaseUrl = selectedSingleProvider?.baseUrl || DEFAULT_API_BASE_URL;
  form.apiKey = selectedSingleProvider?.key || "";
  aiChatBaseUrl.value = selectedAiChatProvider?.baseUrl || DEFAULT_AI_CHAT_BASE_URL;
  aiChatApiKey.value = selectedAiChatProvider?.key || storedAiChatApiKey || "";

  if (storedApiKeyName) singleApiKeyName.value = storedApiKeyName;
  if (storedTabShowProvider === "0" || storedTabShowProvider === "1") {
    showProviderTab.value = storedTabShowProvider === "1";
  }
  if (storedTabShowForge === "0" || storedTabShowForge === "1") {
    showForgeTab.value = storedTabShowForge === "1";
  }
  if (storedTabShowPromptQuery === "0" || storedTabShowPromptQuery === "1") {
    showPromptQueryTab.value = storedTabShowPromptQuery === "1";
  }
  if (Number.isFinite(storedPageZoom)) {
    pageZoom.value = clampPageZoomValue(storedPageZoom);
  }
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
  if (storedAiChatSendShortcut) {
    const parsedShortcut = parseShortcutDefinition(storedAiChatSendShortcut);
    if (parsedShortcut) {
      aiChatSendShortcut.value = formatShortcutDefinition(parsedShortcut);
    }
  }
  if (storedMainTabPrevShortcut) {
    const parsedShortcut = parseShortcutDefinition(storedMainTabPrevShortcut);
    if (parsedShortcut) {
      mainTabPrevShortcut.value = formatShortcutDefinition(parsedShortcut);
    }
  }
  if (storedMainTabNextShortcut) {
    const parsedShortcut = parseShortcutDefinition(storedMainTabNextShortcut);
    if (parsedShortcut) {
      mainTabNextShortcut.value = formatShortcutDefinition(parsedShortcut);
    }
  }
  if (storedInputPrevShortcut) {
    const parsedShortcut = parseShortcutDefinition(storedInputPrevShortcut);
    if (parsedShortcut) {
      inputPrevShortcut.value = formatShortcutDefinition(parsedShortcut);
    }
  }
  if (storedInputNextShortcut) {
    const parsedShortcut = parseShortcutDefinition(storedInputNextShortcut);
    if (parsedShortcut) {
      inputNextShortcut.value = formatShortcutDefinition(parsedShortcut);
    }
  }
  if (storedModel && normalizeApiKeyValue(storedModel)) {
    form.model = storedModel;
  }
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
  if (storedAiChatApiKeyName) aiChatApiKeyName.value = storedAiChatApiKeyName;
  if (storedAiChatSelectedModel) aiChatSelectedModel.value = storedAiChatSelectedModel;
  if (storedAiChatOperationModel) aiChatOperationModel.value = storedAiChatOperationModel;
  if (!normalizeApiKeyValue(aiChatOperationModel.value) && normalizeApiKeyValue(aiChatSelectedModel.value)) {
    aiChatOperationModel.value = aiChatSelectedModel.value;
  }
  if (storedAiChatApiKey) aiChatApiKey.value = storedAiChatApiKey;
  if (storedAiChatUserAvatar && storedAiChatUserAvatar.startsWith("data:image/")) {
    aiChatUserAvatarDataUrl.value = storedAiChatUserAvatar;
  }
  if (Number.isFinite(storedAiChatContextCount)) aiChatContextCount.value = storedAiChatContextCount;
  if (Number.isFinite(storedAiChatTimeoutSeconds)) aiChatTimeoutSeconds.value = storedAiChatTimeoutSeconds;
  if (Number.isFinite(storedAiChatMaxTokens)) aiChatMaxTokens.value = storedAiChatMaxTokens;
  if (storedAiChatSystemPrompt) aiChatSystemPrompt.value = storedAiChatSystemPrompt;
  if (Number.isFinite(storedAiChatTemperature)) aiChatTemperature.value = storedAiChatTemperature;
  if (Number.isFinite(storedAiChatTopP)) aiChatTopP.value = storedAiChatTopP;
  if (Number.isFinite(storedAiChatPresencePenalty)) aiChatPresencePenalty.value = storedAiChatPresencePenalty;
  if (Number.isFinite(storedAiChatFrequencyPenalty)) aiChatFrequencyPenalty.value = storedAiChatFrequencyPenalty;
  aiChatJsonModeEnabled.value = storedAiChatJsonModeEnabled === "1";
  if (storedPluginBackgroundImage && storedPluginBackgroundImage.startsWith("data:image/")) {
    pluginBackgroundImageDataUrl.value = storedPluginBackgroundImage;
  }
  if (Number.isFinite(storedPluginBackgroundOpacity)) {
    pluginBackgroundOpacity.value = clampPluginBackgroundOpacityValue(storedPluginBackgroundOpacity);
  }
  if (Number.isFinite(storedPluginBackgroundPanelOpacity)) {
    pluginBackgroundPanelOpacity.value = clampPluginBackgroundPanelOpacityValue(storedPluginBackgroundPanelOpacity);
  }
  if (Number.isFinite(storedPluginBackgroundBlur)) {
    pluginBackgroundBlur.value = clampPluginBackgroundBlurValue(storedPluginBackgroundBlur);
  }
  if (storedPromptHistoryRecords) {
    try {
      promptHistoryRecords.value = normalizePromptHistoryItems(JSON.parse(storedPromptHistoryRecords));
    } catch {
      promptHistoryRecords.value = [];
    }
  }
  if (storedForgeApiUrl) forgeForm.apiUrl = normalizeForgeUrl(storedForgeApiUrl) || FORGE_DEFAULT_API_URL;
  if (storedForgeMode === "img2img" || storedForgeMode === "txt2img") {
    forgeForm.mode = storedForgeMode;
  }
  if (storedForgePrompt) forgeForm.prompt = storedForgePrompt;
  if (storedForgeNegativePrompt) forgeForm.negativePrompt = storedForgeNegativePrompt;
  if (storedForgeModel) forgeForm.model = storedForgeModel;
  if (storedForgeSampler) forgeForm.sampler = storedForgeSampler;
  if (storedForgeScheduler) forgeForm.scheduler = storedForgeScheduler;
  if (Number.isFinite(storedForgeSteps)) forgeForm.steps = storedForgeSteps;
  if (Number.isFinite(storedForgeCfgScale)) forgeForm.cfgScale = storedForgeCfgScale;
  if (Number.isFinite(storedForgeDenoise)) forgeForm.denoise = storedForgeDenoise;
  if (Number.isFinite(storedForgeWidth)) forgeForm.width = storedForgeWidth;
  if (Number.isFinite(storedForgeHeight)) forgeForm.height = storedForgeHeight;
  if (Number.isFinite(storedForgeBatchSize)) forgeForm.batchSize = storedForgeBatchSize;
  if (Number.isFinite(storedForgeSeed)) forgeForm.seed = storedForgeSeed;
  if (storedForgeLora) forgeForm.lora = storedForgeLora;
  if (Number.isFinite(storedForgeLoraWeight)) forgeForm.loraWeight = storedForgeLoraWeight;
  forgeForm.controlNetEnabled = storedForgeCnEnabled === "1";
  if (storedForgeCnModule) forgeForm.controlNetModule = storedForgeCnModule;
  if (storedForgeCnModel) forgeForm.controlNetModel = storedForgeCnModel;
  if (Number.isFinite(storedForgeCnWeight)) forgeForm.controlNetWeight = storedForgeCnWeight;
  if (Number.isFinite(storedForgeTimeoutSeconds)) forgeForm.timeoutSeconds = storedForgeTimeoutSeconds;
  if (Number.isFinite(storedForgeMaxResolution)) forgeForm.maxResolution = storedForgeMaxResolution;
  persistPromptHistorySeed();

  clampRuntimeValues();
  clampGlobalRuntimeValues();
  clampAiChatParams();
  debugApiBaseUrl("loadLocalState.beforeNormalize", form.apiBaseUrl);
  form.apiBaseUrl = normalizeApiBaseUrl(form.apiBaseUrl, DEFAULT_API_BASE_URL);
  debugApiBaseUrl("loadLocalState.afterNormalize", form.apiBaseUrl);
  void syncSingleModelForProvider(singleProviderId.value, "恢复本地配置");
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

const readSingleRunConfirmSkipDateFromHost = async (): Promise<string> => {
  const readFn = (api as any).readSingleRunConfirmSkipDate;
  if (typeof readFn !== "function") return "";
  try {
    const result = (await readFn()) as { value?: string };
    const value = String(result?.value ?? "").trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
  } catch {
    return "";
  }
};

const saveSingleRunConfirmSkipDateToHost = async (value: string) => {
  const saveFn = (api as any).saveSingleRunConfirmSkipDate;
  if (typeof saveFn !== "function") return;
  await saveFn({ value });
};

const loadSingleRunConfirmSkipDateFromHost = async () => {
  if (!singleRunConfirmJsonSupported.value) {
    singleRunConfirmSkipDate.value = "";
    return;
  }
  singleRunConfirmSkipDate.value = await readSingleRunConfirmSkipDateFromHost();
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

const createProviderId = () =>
    `provider_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeProviderName = (value: unknown, fallback = "未命名服务商") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const normalizeProviderBaseUrl = (value: unknown, fallback = "") =>
    normalizeApiBaseUrl(value, fallback);

const inferProviderProtocolModeByBaseUrl = (baseUrl: string): ProviderProtocolMode => {
  const normalized = normalizeProviderBaseUrl(baseUrl).toLowerCase();
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

const resolveImageProviderRuntimeProtocol = (provider: ProviderItem | null): ProviderRuntimeProtocol => {
  const protocolMode = provider?.protocolMode || "gemini";
  return protocolMode === "openai" ? "openai" : "gemini";
};

const sanitizeProviderItem = (item: unknown): ProviderItem | null => {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const baseUrl = normalizeProviderBaseUrl(row.baseUrl);
  if (!baseUrl) return null;
  const id = normalizeApiKeyValue(row.id) || createProviderId();
  const name = normalizeProviderName(row.name);
  const key = normalizeApiKeyValue(row.key);
  const protocolMode = normalizeProviderProtocolMode(row.protocolMode, baseUrl);
  return {id, name, baseUrl, key, protocolMode};
};

const createDefaultProviderItems = (fallbackKey = ""): ProviderItem[] => {
  const normalizedKey = normalizeApiKeyValue(fallbackKey);
  return [
    {
      id: DEFAULT_AJIAI_PROVIDER_ID,
      name: "AJIAI",
      baseUrl: AI_CHAT_AJIAI_BASE_URL,
      key: normalizedKey,
      protocolMode: "both",
    },
    {
      id: DEFAULT_COMFLY_PROVIDER_ID,
      name: "Comfly",
      baseUrl: AI_CHAT_COMFLY_BASE_URL,
      key: normalizedKey,
      protocolMode: "openai",
    },
  ];
};

const findPreferredSingleProviderId = (items: ProviderItem[]) =>
  items.find((item) => normalizeProviderBaseUrl(item.baseUrl) === AI_CHAT_AJIAI_BASE_URL)?.id
  || items[0]?.id
  || "";

const findPreferredAiChatProviderId = (items: ProviderItem[]) =>
  items.find((item) => normalizeProviderBaseUrl(item.baseUrl) === AI_CHAT_COMFLY_BASE_URL)?.id
  || items.find((item) => normalizeProviderBaseUrl(item.baseUrl) === AI_CHAT_AJIAI_BASE_URL)?.id
  || items[0]?.id
  || "";

const parseProviderItems = (
  raw: unknown,
  fallbackBaseUrl: string,
  fallbackName: string,
  fallbackKey = "",
): ProviderItem[] => {
  const parsedItems = Array.isArray(raw)
    ? raw.map((item) => sanitizeProviderItem(item)).filter((item): item is ProviderItem => Boolean(item))
    : [];
  if (parsedItems.length > 0) {
    return parsedItems;
  }
  void fallbackBaseUrl;
  void fallbackName;
  return createDefaultProviderItems(fallbackKey);
};

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

const applyProviders = (items: ProviderItem[]) => {
  providerItems.value = Array.isArray(items) ? items : [];
  if (!providerItems.value.some((item) => item.id === singleProviderId.value)) {
    singleProviderId.value = findPreferredSingleProviderId(providerItems.value);
  }
  if (!providerItems.value.some((item) => item.id === aiChatProviderId.value)) {
    aiChatProviderId.value = findPreferredAiChatProviderId(providerItems.value);
  }
  if (!providerItems.value.some((item) => item.id === providerManageSelected.value)) {
    providerManageSelected.value = "";
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

};

const createProvider = () => {
  const name = normalizeProviderName(providerManageName.value);
  const baseUrl = normalizeProviderBaseUrl(providerManageBaseUrl.value);
  const key = normalizeApiKeyValue(providerManageKey.value);
  const protocolMode = normalizeProviderProtocolMode(providerManageProtocolMode.value, baseUrl);
  if (!baseUrl) {
    message.warning("请先填写服务商 Base URL");
    return;
  }
  if (!key) {
    message.warning("请先填写服务商 Key");
    return;
  }
  const item: ProviderItem = {id: createProviderId(), name, baseUrl, key, protocolMode};
  applyProviders([...providerItems.value, item]);
  providerManageSelected.value = item.id;
  scheduleSaveLocalState();
  message.success("服务商新增成功");
};

const updateProvider = () => {
  const selectedId = normalizeApiKeyValue(providerManageSelected.value);
  if (!selectedId) {
    message.warning("请先选择要更新的服务商");
    return;
  }
  const name = normalizeProviderName(providerManageName.value);
  const baseUrl = normalizeProviderBaseUrl(providerManageBaseUrl.value);
  const key = normalizeApiKeyValue(providerManageKey.value);
  const protocolMode = normalizeProviderProtocolMode(providerManageProtocolMode.value, baseUrl);
  if (!baseUrl) {
    message.warning("请先填写服务商 Base URL");
    return;
  }
  if (!key) {
    message.warning("请先填写服务商 Key");
    return;
  }
  const updatedItems = providerItems.value.map((item) =>
    item.id === selectedId ? { ...item, name, baseUrl, key, protocolMode } : item,
  );
  applyProviders(updatedItems);
  if (singleProviderId.value === selectedId) {
    form.apiBaseUrl = baseUrl;
    form.apiKey = key;
    void syncSingleModelForProvider(selectedId, "更新服务商");
  }
  if (aiChatProviderId.value === selectedId) {
    aiChatBaseUrl.value = baseUrl;
    aiChatApiKey.value = key;
    clearAiChatModels();
  }
  scheduleSaveLocalState();
  message.success("服务商更新成功");
};

const deleteProvider = () => {
  const selectedId = normalizeApiKeyValue(providerManageSelected.value);
  if (!selectedId) {
    message.warning("请先选择要删除的服务商");
    return;
  }
  if (providerItems.value.length <= 1) {
    message.warning("至少保留一个服务商");
    return;
  }
  const updatedItems = providerItems.value.filter((item) => item.id !== selectedId);
  applyProviders(updatedItems);
  providerManageSelected.value = "";
  providerManageName.value = "";
  providerManageBaseUrl.value = "";
  providerManageKey.value = "";
  clearAiChatModels();
  scheduleSaveLocalState();
  message.success("服务商删除成功");
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
      providerProtocol: resolveImageProviderRuntimeProtocol(getCurrentSingleProvider()),
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

const runAntiReverseAction = async () => {
  const modeLabel = form.antiMode === 1 ? "普通" : form.antiMode === 2 ? "高强" : "";
  if (!modeLabel) {
    message.warning("请先选择抗截断模式（普通或高强）");
    return;
  }

  const reverseAction = (api as any).reverseAntiTruncationEffect;
  if (!state.hostReverseAntiAction || typeof reverseAction !== "function") {
    logErrorCode("HOST_NOT_SUPPORTED", "reverseAntiTruncationEffect 未挂载");
    message.warning("当前宿主不支持反向操作");
    return;
  }

  state.reversingAntiAction = true;
  try {
    logTagged("抗截断", `开始抵消抗截断效果（${modeLabel}）`, "info");
    await reverseAction({ antiMode: form.antiMode });
    logTagged("抗截断", `抗截断效果已抵消（${modeLabel}）`, "success");
    message.success(`已抵消抗截断效果（${modeLabel}）`);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    logTagged("抗截断", `反向操作失败: ${errorMessage}`, "error");
    message.error(`反向操作失败: ${errorMessage}`);
  } finally {
    state.reversingAntiAction = false;
  }
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

const ensureSingleImageRunReady = async () => {
  if (state.running || singleRunConfirmSubmitting.value || singleRunConfirmVisible.value) return false;

  debugApiBaseUrl("runSingleImage.beforeNormalize", form.apiBaseUrl);
  form.apiBaseUrl = normalizeApiBaseUrl(form.apiBaseUrl, DEFAULT_API_BASE_URL);
  debugApiBaseUrl("runSingleImage.afterNormalize", form.apiBaseUrl);
  clampRuntimeValues();

  if (!form.prompt.trim()) {
    logErrorCode("NO_PROMPT");
    message.warning("请先输入提示词");
    return false;
  }
  if (!form.apiKey.trim()) {
    logErrorCode("NO_API_KEY");
    message.warning("请先到设置页配置图片生成 Key");
    return false;
  }
  if (!form.apiBaseUrl.trim()) {
    logErrorCode("NO_API_URL");
    message.warning("请先到设置页配置图片生成 Base URL");
    return false;
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
    return false;
  }
  return true;
};

const shouldSkipSingleRunConfirmToday = () =>
  singleRunConfirmJsonSupported.value &&
  singleRunConfirmSkipDate.value === formatLocalDateKey();

const openSingleRunConfirmDialog = () => {
  singleRunConfirmStampLayer.value = false;
  singleRunConfirmVisible.value = true;
};

const executeSingleImageRun = async () => {
  if (state.running) return;

  pushPromptHistoryRecord("single-workbench", form.prompt);
  state.running = true;
  safeSaveLocalState();

  pushLog("----------------------------------------", "info");
  logSingleRequestDetails();
  logTagged("请求", "正在发送请求...", "warn");
  logTagged("单图", "已进入宿主调用 runSingleImage", "info");

  try {
    const provider = getCurrentSingleProvider();
    const result = (await withTimeout(
      api.runSingleImage({
        prompt: form.prompt,
        apiKey: form.apiKey,
        apiBaseUrl: form.apiBaseUrl,
        model: form.model,
        providerProtocol: resolveImageProviderRuntimeProtocol(provider),
        size: SINGLE_WORKBENCH_SIZE,
        batchSize: form.batchSize,
        timeoutSeconds: form.timeoutSeconds,
        antiTruncationMode: form.antiMode,
        layerType: form.layerType,
        maxResolution: form.maxResolution,
      }) as Promise<SingleRunResult>,
      Math.max(30000, (form.timeoutSeconds + 20) * 1000),
      "图像工作台",
    )) as SingleRunResult;

    previewImage.value = result.previewBase64
      ? `data:image/png;base64,${result.previewBase64}`
      : "";

    if (result.responseLogs?.length) {
      result.responseLogs.forEach((msg) => pushLog(`[接口响应]\n${msg}`, "info"));
    }

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
    const {errorMessage, rawResponse} = splitErrorAndRawResponse(getErrorMessage(error));
    logErrorWithSolution(`主流程出错: ${errorMessage}`);
    if (rawResponse) {
      pushLog(`[接口响应]\n${rawResponse}`, "error");
    }
    message.error("图像工作台处理失败");
  } finally {
    state.running = false;
    logTagged("单图", "本次执行结束", "info");
  }
};

const confirmSingleRun = async (skipForToday = false) => {
  if (singleRunConfirmSubmitting.value) return;
  singleRunConfirmSubmitting.value = true;

  try {
    if (skipForToday) {
      if (!singleRunConfirmJsonSupported.value) {
        throw new Error("宿主接口未就绪，无法保存当天免确认状态");
      }
      const today = formatLocalDateKey();
      try {
        await saveSingleRunConfirmSkipDateToHost(today);
        singleRunConfirmSkipDate.value = today;
        logTagged("单图", `已记录今日免确认：${today}`, "info");
      } catch (error) {
        logTagged("单图", `保存今日免确认失败: ${getErrorMessage(error)}`, "warn");
      }
    }

    if (singleRunConfirmStampLayer.value) {
      if (!stampVisibleLayerSupported.value) {
        throw new Error("宿主接口未就绪，无法执行盖印一层");
      }
      logTagged("单图", "正在执行盖印一层...", "info");
      await (api as any).stampVisibleLayer();
      logTagged("单图", "盖印一层完成", "success");
    }

    singleRunConfirmVisible.value = false;
    await executeSingleImageRun();
  } catch (error) {
    logErrorWithSolution(`生成前准备失败: ${getErrorMessage(error)}`);
    message.error("生成前准备失败");
  } finally {
    singleRunConfirmSubmitting.value = false;
  }
};

const runSingleImage = async () => {
  logTagged("单图", "点击开始生成", "info");
  const ready = await ensureSingleImageRunReady();
  if (!ready) return;

  if (shouldSkipSingleRunConfirmToday()) {
    logTagged("单图", "已按今日免确认配置直接开始生成", "info");
    await executeSingleImageRun();
    return;
  }

  openSingleRunConfirmDialog();
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

    const displayQuota = applyQuotaBySelectedModel(quota);
    quotaInfo.value = displayQuota;
    logTagged("成功", "查询完成", "success");
    logTagged("余额", `$${displayQuota.availableUSD.toFixed(2)}`, "success");
    logTagged("1K", `${displayQuota.count1K} 张`, "info");
    if (form.model !== SINGLE_GEMINI_FLASH_IMAGE_MODEL) {
      logTagged("2K", `${displayQuota.count2K} 张`, "info");
      logTagged("4K", `${displayQuota.count4K} 张`, "info");
    }
    message.success("额度查询完成");
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    if (errorMessage.includes("超时")) {
      logErrorWithSolution(errorMessage, "请检查网络连接，或稍后重试");
    } else if (errorMessage.includes("401") || errorMessage.includes("API Key 无效")) {
      logErrorWithSolution(errorMessage, "请检查 API Key 是否正确或已过期");
    } else if (errorMessage.includes("403")) {
      logErrorWithSolution(errorMessage, "请检查账户权限或余额是否充足");
    } else if (errorMessage.includes("404")) {
      logErrorWithSolution(errorMessage, "请检查 API 地址是否正确");
    } else {
      logErrorWithSolution(`查询失败: ${errorMessage}`);
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
  const protocolText = task.settings.providerProtocol === "openai" ? "OpenAI" : "Gemini";
  return `${protocolText} · x${task.settings.count} · 超时 ${task.settings.timeoutSeconds}s · ${antiText} · ${layerText}`;
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
    const provider = getCurrentSingleProvider();
    const task = (await api.captureBatchTask({
      prompt: form.prompt,
      providerProtocol: resolveImageProviderRuntimeProtocol(provider),
      size: SINGLE_WORKBENCH_SIZE,
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

const parsePromptCreateAiTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? "").trim())
      .filter((item) => item.length > 0);
  }
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  return raw
    .split(/[，,、;\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const parsePromptCreateAiAutoFillResult = (text: string): PromptCreateAiAutoFillResult | null => {
  const source = String(text ?? "").trim();
  if (!source) return null;
  const jsonText = extractAiChatJsonFromText(source) || source;
  if (!jsonText) return null;

  try {
    const parsed = JSON.parse(jsonText) as unknown;
    const root = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!root || typeof root !== "object") return null;
    const row = root as Record<string, unknown>;

    const name = String(
      row.name ?? row.title ?? row.promptName ?? row.prompt_name ?? "",
    ).trim();
    const description = String(
      row.description ?? row.desc ?? row.summary ?? "",
    ).trim();
    const category = String(
      row.category ?? row.group ?? row.type ?? "",
    ).trim();
    const tags = normalizePromptCreateTags(
      parsePromptCreateAiTags(row.tags ?? row.keywords ?? row.labels ?? row.tagList ?? row.tag_list),
    ).slice(0, 30);

    if (!name && !description && !category && tags.length === 0) return null;
    return { name, description, category, tags };
  } catch {
    return null;
  }
};

const buildPromptCreateAiAutoFillRequestText = () => {
  const content = String(promptCreateForm.content ?? "").trim();
  const name = String(promptCreateForm.name ?? "").trim();
  const description = String(promptCreateForm.description ?? "").trim();
  const category = String(promptCreateForm.category ?? "").trim();
  const tags = normalizePromptCreateTags(promptCreateForm.tags || []).join(", ");
  return [
    "请根据下面的提示词内容，补全提示词库元数据。",
    "只返回严格 JSON，不要 markdown，不要解释，不要代码块。",
    "JSON schema:",
    '{"name":"", "description":"", "category":"", "tags":[""]}',
    "规则：",
    "1) name: 10~30 字，适合做提示词标题。",
    "2) description: 20~80 字，简洁说明用途。",
    "3) category: 1 个中文分类词。",
    "4) tags: 3~8 个标签，数组格式，每个标签不超过 10 字。",
    "5) 无法判断时返回空字符串或空数组。",
    "",
    "当前已填内容：",
    `name=${name || "(empty)"}`,
    `description=${description || "(empty)"}`,
    `category=${category || "(empty)"}`,
    `tags=${tags || "(empty)"}`,
    "",
    "提示词内容：",
    content,
  ].join("\n");
};

const ensureAiChatRequestReady = async (
  sceneTag: string,
  modelType: "chat" | "operation" = "operation",
) => {
  const baseUrl = normalizeAiChatBaseUrl(aiChatBaseUrl.value);
  const protocol = resolveAiChatRuntimeProtocol(getCurrentAiChatProvider());
  const key = resolveAiChatRequestApiKey(baseUrl);
  if (!key) {
    message.warning(getAiChatMissingKeyMessage(baseUrl));
    return null;
  }
  if (aiChatModelLoading.value) {
    message.info("模型列表加载中，请稍候再试");
    return null;
  }

  const shouldReloadModels =
    aiChatModels.value.length === 0 ||
    aiChatLoadedBaseUrl.value !== baseUrl ||
    aiChatLoadedApiKey.value !== key ||
    aiChatLoadedProtocol.value !== protocol;
  if (shouldReloadModels) {
    logTagged(sceneTag, "检测到模型上下文变化，正在自动刷新模型列表", "info");
    await loadAiChatModels({ silentIfNoKey: true });
  }
  if (
    aiChatLoadedBaseUrl.value !== baseUrl ||
    aiChatLoadedApiKey.value !== key ||
    aiChatLoadedProtocol.value !== protocol
  ) {
    message.warning("模型列表尚未就绪，请稍后重试");
    return null;
  }

  const modelRef = modelType === "chat" ? aiChatSelectedModel : aiChatOperationModel;
  const model = normalizeApiKeyValue(modelRef.value);
  const modelLabel = modelType === "chat" ? "对话模型" : "操作模型";
  if (!model) {
    activeTab.value = "ai-chat";
    message.warning(`请先到“与AI对话”页选择${modelLabel}`);
    return null;
  }

  const modelExists = aiChatModels.value.some(
    (item) => normalizeApiKeyValue(item.id) === model,
  );
  if (!modelExists) {
    modelRef.value = "";
    scheduleSaveLocalState();
    activeTab.value = "ai-chat";
    message.warning(`当前已选${modelLabel}不在可用列表中，请到“与AI对话”页重新选择`);
    return null;
  }

  return { baseUrl, key, model, protocol };
};

const fillPromptCreateFormByAi = async () => {
  if (promptCreateAiFilling.value || promptCreateSaving.value || aiChatSending.value) return;
  const content = normalizeApiKeyValue(promptCreateForm.content);
  if (!content) {
    message.warning("请先填写提示词内容，再使用 AI 补全");
    return;
  }

  const requestReady = await ensureAiChatRequestReady("提示词新增");
  if (!requestReady) return;
  const { baseUrl, key, model, protocol } = requestReady;

  promptCreateAiFilling.value = true;
  logTagged("提示词新增", "开始执行 AI 自动补全", "info");
  try {
    const config = getAiChatApiConfig(protocol);
    const systemPrompt = normalizeApiKeyValue(aiChatSystemPrompt.value);
    const taskSystemPrompt =
      "你是提示词库编辑助手。你的唯一输出必须是 JSON 对象，字段仅限 name、description、category、tags。";
    const mergedSystemPrompt = systemPrompt
      ? `${taskSystemPrompt}\n${systemPrompt}`
      : taskSystemPrompt;
    const requestText = buildPromptCreateAiAutoFillRequestText();

    let url = "";
    let body: Record<string, unknown> = {};
    if (protocol === "gemini") {
      const geminiModel = normalizeGeminiModelId(model);
      if (!geminiModel) {
        throw new Error("模型格式不正确，请重新选择模型");
      }
      const encodedModel = encodeURIComponent(geminiModel);
      url = `${baseUrl}${config.completions.replace("{model}", encodedModel)}?key=${encodeURIComponent(key)}`;
      body = {
        contents: [
          {
            role: "user",
            parts: [{ text: requestText }],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT"],
          maxOutputTokens: aiChatMaxTokens.value,
          temperature: Math.min(aiChatTemperature.value, 1),
          topP: aiChatTopP.value,
        },
        systemInstruction: {
          parts: [{ text: mergedSystemPrompt }],
        },
      };
    } else {
      url = `${baseUrl}${config.completions}`;
      body = {
        model,
        messages: [
          { role: "system", content: mergedSystemPrompt },
          { role: "user", content: requestText },
        ],
        stream: false,
        max_tokens: aiChatMaxTokens.value,
        temperature: Math.min(aiChatTemperature.value, 1),
        top_p: aiChatTopP.value,
        presence_penalty: aiChatPresencePenalty.value,
        frequency_penalty: aiChatFrequencyPenalty.value,
      };
    }

    const timeoutMs = Math.max(5000, Math.floor(Number(aiChatTimeoutSeconds.value) || 120) * 1000);
    const response = await withTimeout(
      fetch(url, {
        method: "POST",
        headers:
          protocol === "openai"
            ? {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${key}`,
              }
            : {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
        body: JSON.stringify(body),
      }),
      timeoutMs,
      "提示词新增 AI 补全",
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
    const parsed = parsePromptCreateAiAutoFillResult(assistantText);
    if (!parsed) {
      throw new Error("AI 返回不是可解析的 JSON");
    }

    let changedCount = 0;
    if (!normalizeApiKeyValue(promptCreateForm.name) && parsed.name) {
      promptCreateForm.name = parsed.name;
      changedCount += 1;
    }
    if (!normalizeApiKeyValue(promptCreateForm.description) && parsed.description) {
      promptCreateForm.description = parsed.description;
      changedCount += 1;
    }
    if (!normalizeApiKeyValue(promptCreateForm.category) && parsed.category) {
      promptCreateForm.category = parsed.category;
      changedCount += 1;
    }
    const mergedTags = normalizePromptCreateTags([
      ...(Array.isArray(promptCreateForm.tags) ? promptCreateForm.tags : []),
      ...parsed.tags,
    ]).slice(0, 30);
    const hasTagChange =
      mergedTags.length !== promptCreateForm.tags.length ||
      mergedTags.some((tag, index) => tag !== promptCreateForm.tags[index]);
    if (hasTagChange) {
      promptCreateForm.tags = mergedTags;
      changedCount += 1;
    }

    if (changedCount > 0) {
      scheduleSaveLocalState();
      logTagged("提示词新增", `AI 自动补全完成，更新 ${changedCount} 项`, "success");
      message.success(`AI 已补全 ${changedCount} 项`);
    } else {
      logTagged("提示词新增", "AI 已返回结果，但没有可补全的空字段", "info");
      message.info("AI 已分析完成，当前无可补全空字段");
    }
  } catch (error) {
    const errorText = getErrorMessage(error);
    logTagged("提示词新增", `AI 自动补全失败: ${errorText}`, "error");
    message.error(`AI 自动补全失败: ${errorText}`);
  } finally {
    promptCreateAiFilling.value = false;
  }
};

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
      `列表加载完成：total=${promptQueryItems.value.length}, matched=${promptQueryFilteredItems.value.length}, name="${promptQueryNameKeyword.value.trim()}", desc="${promptQueryDescriptionKeyword.value.trim()}", tag="${promptQueryTagKeyword.value.trim()}", favOnly=${promptQueryFavoritesOnly.value ? 1 : 0}`,
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

const toCompactPromptQueryText = (value: unknown, limit = 60) => {
  const raw = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!raw) return "";
  return raw.length > limit ? `${raw.slice(0, Math.max(8, limit - 1))}…` : raw;
};

const normalizePromptQueryAiSourceType = (value: unknown): "" | "local" | "online" => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "local" || raw.includes("本地")) return "local";
  if (raw === "online" || raw.includes("线上") || raw.includes("图书馆") || raw.includes("library")) {
    return "online";
  }
  return "";
};

const normalizePromptQueryAiFavoritesOnly = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric === 1;
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return false;
  return (
    raw === "true" ||
    raw === "yes" ||
    raw === "y" ||
    raw === "fav" ||
    raw === "favorite" ||
    raw.includes("收藏")
  );
};

const parsePromptQueryAiTagKeyword = (value: unknown): string => {
  if (Array.isArray(value)) {
    const first = value.find((item) => String(item ?? "").trim().length > 0);
    return String(first ?? "").trim();
  }
  return String(value ?? "").trim();
};

const parsePromptQueryAiFilterResult = (text: string): PromptQueryAiFilterResult | null => {
  const source = String(text ?? "").trim();
  if (!source) return null;
  const jsonText = extractAiChatJsonFromText(source) || source;
  if (!jsonText) return null;

  try {
    const parsed = JSON.parse(jsonText) as unknown;
    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!first || typeof first !== "object") return null;
    const root = first as Record<string, unknown>;
    const filters =
      root.filters && typeof root.filters === "object"
        ? (root.filters as Record<string, unknown>)
        : root;

    const nameKeyword = String(
      filters.nameKeyword ?? filters.name_keyword ?? filters.name ?? "",
    ).trim();
    const descriptionKeyword = String(
      filters.descriptionKeyword ??
      filters.description_keyword ??
      filters.description ??
      filters.desc ??
      "",
    ).trim();
    const tagKeyword = parsePromptQueryAiTagKeyword(
      filters.tagKeyword ?? filters.tag_keyword ?? filters.tag ?? filters.tags ?? filters.keywords ?? "",
    );
    const sourceType = normalizePromptQueryAiSourceType(
      filters.sourceType ?? filters.source_type ?? filters.source ?? "",
    );
    const favoritesOnly = normalizePromptQueryAiFavoritesOnly(
      filters.favoritesOnly ?? filters.favorites_only ?? filters.favorite ?? false,
    );

    return {
      nameKeyword,
      descriptionKeyword,
      tagKeyword,
      sourceType,
      favoritesOnly,
    };
  } catch {
    return null;
  }
};

const buildPromptQueryAiFilterRequestText = (query: string) => {
  const sampleItems = promptQueryItems.value.slice(0, 120).map((item, index) => {
    const source = Number(item.type) === 2 ? "online" : "local";
    const favorite = Number(item.favorite) === 1 ? 1 : 0;
    const tags = Array.isArray(item.tags)
      ? item.tags.map((tag) => toCompactPromptQueryText(tag, 16)).filter((tag) => tag.length > 0).join("|")
      : "";
    const row = [
      `#${index + 1}`,
      `name=${toCompactPromptQueryText(item.name, 30)}`,
      `desc=${toCompactPromptQueryText(item.description, 32)}`,
      `category=${toCompactPromptQueryText(item.category, 16)}`,
      `tags=${tags || "-"}`,
      `source=${source}`,
      `favorite=${favorite}`,
    ];
    return row.join("; ");
  });

  return [
    "你是提示词检索助手。请将用户自然语言查询转换为筛选条件。",
    "只返回严格 JSON，不要 markdown，不要解释，不要代码块。",
    'JSON schema: {"nameKeyword":"","descriptionKeyword":"","tagKeyword":"","sourceType":"","favoritesOnly":false}',
    "字段说明：",
    '1) nameKeyword: 用于名称模糊搜索；',
    '2) descriptionKeyword: 用于描述模糊搜索；',
    '3) tagKeyword: 只填一个最关键标签词；',
    '4) sourceType: 只能是 "" | "local" | "online"；',
    "5) favoritesOnly: 布尔值。",
    "若无法判断某字段，请返回空字符串或 false。",
    "",
    `用户查询：${query}`,
    "",
    `可用数据样本（最多 ${sampleItems.length} 条）：`,
    ...(sampleItems.length > 0 ? sampleItems : ["(empty)"]),
  ].join("\n");
};

const applyPromptQueryAiFilter = async () => {
  if (promptQueryAiLoading.value || promptQueryLoading.value || aiChatSending.value) return;
  const query = normalizeApiKeyValue(promptQueryAiInput.value);
  if (!query) {
    message.warning("请输入 AI 查询内容");
    return;
  }

  if (promptQueryItems.value.length === 0 && state.hostPromptQuery) {
    await loadPromptQueryItems({ syncLibrary: false });
  }

  const requestReady = await ensureAiChatRequestReady("提示词查询");
  if (!requestReady) return;
  const { baseUrl, key, model, protocol } = requestReady;

  promptQueryAiLoading.value = true;
  logTagged("提示词查询", `开始执行 AI 查询：${toCompactPromptQueryText(query, 32)}`, "info");
  try {
    const config = getAiChatApiConfig(protocol);
    const userSystemPrompt = normalizeApiKeyValue(aiChatSystemPrompt.value);
    const taskSystemPrompt =
      "你是检索筛选器生成器。你的输出必须是 JSON，且只包含 nameKeyword、descriptionKeyword、tagKeyword、sourceType、favoritesOnly。";
    const mergedSystemPrompt = userSystemPrompt
      ? `${taskSystemPrompt}\n${userSystemPrompt}`
      : taskSystemPrompt;
    const requestText = buildPromptQueryAiFilterRequestText(query);

    let url = "";
    let body: Record<string, unknown> = {};
    if (protocol === "gemini") {
      const geminiModel = normalizeGeminiModelId(model);
      if (!geminiModel) {
        throw new Error("模型格式不正确，请重新选择模型");
      }
      const encodedModel = encodeURIComponent(geminiModel);
      url = `${baseUrl}${config.completions.replace("{model}", encodedModel)}?key=${encodeURIComponent(key)}`;
      body = {
        contents: [
          {
            role: "user",
            parts: [{ text: requestText }],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT"],
          maxOutputTokens: aiChatMaxTokens.value,
          temperature: Math.min(aiChatTemperature.value, 0.8),
          topP: aiChatTopP.value,
        },
        systemInstruction: {
          parts: [{ text: mergedSystemPrompt }],
        },
      };
    } else {
      url = `${baseUrl}${config.completions}`;
      body = {
        model,
        messages: [
          { role: "system", content: mergedSystemPrompt },
          { role: "user", content: requestText },
        ],
        stream: false,
        max_tokens: aiChatMaxTokens.value,
        temperature: Math.min(aiChatTemperature.value, 0.8),
        top_p: aiChatTopP.value,
        presence_penalty: aiChatPresencePenalty.value,
        frequency_penalty: aiChatFrequencyPenalty.value,
      };
    }

    const timeoutMs = Math.max(5000, Math.floor(Number(aiChatTimeoutSeconds.value) || 120) * 1000);
    const response = await withTimeout(
      fetch(url, {
        method: "POST",
        headers:
          protocol === "openai"
            ? {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${key}`,
              }
            : {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
        body: JSON.stringify(body),
      }),
      timeoutMs,
      "提示词 AI 查询",
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

    const parsed = parsePromptQueryAiFilterResult(assistantText);
    if (!parsed) {
      throw new Error("AI 返回不是可解析的筛选 JSON");
    }

    promptQueryNameKeyword.value = parsed.nameKeyword;
    promptQueryDescriptionKeyword.value = parsed.descriptionKeyword;
    promptQueryTagKeyword.value = parsed.tagKeyword;
    promptQuerySourceType.value = parsed.sourceType;
    promptQueryFavoritesOnly.value = parsed.favoritesOnly;
    await nextTick();

    logTagged(
      "提示词查询",
      `AI 查询已应用：name="${parsed.nameKeyword}", desc="${parsed.descriptionKeyword}", tag="${parsed.tagKeyword}", source=${parsed.sourceType || "all"}, favOnly=${parsed.favoritesOnly ? 1 : 0}, matched=${promptQueryFilteredItems.value.length}`,
      "success",
    );
    message.success(`AI 查询完成，匹配 ${promptQueryFilteredItems.value.length} 条`);
  } catch (error) {
    const errorText = getErrorMessage(error);
    logTagged("提示词查询", `AI 查询失败: ${errorText}`, "error");
    message.error(`AI 查询失败: ${errorText}`);
  } finally {
    promptQueryAiLoading.value = false;
  }
};

const pullPromptLibraryFromCloud = async () => {
  if (promptLibraryRefreshLoading.value) return;
  promptLibraryRefreshLoading.value = true;
  try {
    const info = await refreshPromptCreateStorageInfo({ forceSyncLibrary: true });
    promptQueryNameKeyword.value = "";
    promptQueryDescriptionKeyword.value = "";
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
  pushPromptHistoryRecord("single-workbench", prompt);
  activeTab.value = "single";
  scheduleSaveLocalState();
  logTagged("提示词查询", `已应用提示词：${item.name}`, "success");
  message.success("已填充到图像工作台提示词");
};

const appendPromptForSingle = (item: PromptCreateQueryItem) => {
  const prompt = String(item?.content ?? "").trim();
  if (!prompt) {
    message.warning("该提示词内容为空，无法追加");
    return;
  }

  const current = String(form.prompt ?? "").trim();
  form.prompt = current ? `${current}\n\n${prompt}` : prompt;
  pushPromptHistoryRecord("single-workbench", form.prompt);
  activeTab.value = "single";
  scheduleSaveLocalState();
  logTagged("提示词查询", `已追加提示词：${item.name}`, "success");
  message.success("已追加到图像工作台提示词");
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

const openPromptCreateDialog = () => {
  promptCreateDialogVisible.value = true;
};

const jumpToPromptQuery = () => {
  promptCreateDialogVisible.value = false;
  if (!showPromptQueryTab.value) {
    showPromptQueryTab.value = true;
  }
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

const isHistorySearchShortcutEvent = (event: KeyboardEvent) => {
  const key = normalizeKeyboardEventKey(event);
  const code = String(event.code || "").toLowerCase();
  const keyCode = Number((event as any).keyCode ?? (event as any).which ?? 0);
  const isF = key === "f" || code === "keyf" || keyCode === 70;
  const ctrlPressed = Boolean(event.ctrlKey || event.getModifierState?.("Control"));
  const shiftPressed = Boolean(event.shiftKey || event.getModifierState?.("Shift"));
  const altPressed = Boolean(event.altKey || event.getModifierState?.("Alt"));
  const metaPressed = Boolean(event.metaKey || event.getModifierState?.("Meta"));
  return isF && ctrlPressed && shiftPressed && !altPressed && !metaPressed;
};

const onPromptHistoryShortcutKeydown = (event: KeyboardEvent) => {
  if (event.repeat || !isHistorySearchShortcutEvent(event)) return;
  event.preventDefault();
  event.stopPropagation();
  lastLocalHistorySearchKeyAt = Date.now();
  openPromptHistoryDialog("Ctrl+Shift+F");
};

const onGlobalMainTabKeydown = (event: KeyboardEvent) => {
  syncAiChatModifierLatch(event);
  if (!event.repeat && isHistorySearchShortcutEvent(event)) {
    event.preventDefault();
    event.stopPropagation();
    lastLocalHistorySearchKeyAt = Date.now();
    openPromptHistoryDialog("Ctrl+Shift+F");
    return;
  }
  if (activeTab.value === "ai-chat" && !event.repeat && isAiChatSendShortcutEvent(event)) {
    lastLocalAiChatSendKeyAt = Date.now();
    event.preventDefault();
    event.stopPropagation();
    void sendAiChatMessage();
    return;
  }
  if (event.defaultPrevented) {
    return;
  }
  if (activeTab.value === "single" && !event.repeat) {
    const singleRunShortcutConfig = getEffectiveSingleRunShortcut();
    if (matchKeyboardEventWithShortcut(event, singleRunShortcutConfig)) {
      event.preventDefault();
      event.stopPropagation();
      void runSingleImage();
      return;
    }
  }
  if (isEditableEventTarget(event.target)) return;

  const mainTabPrevShortcutConfig = getEffectiveMainTabPrevShortcut();
  if (matchKeyboardEventWithShortcut(event, mainTabPrevShortcutConfig)) {
    event.preventDefault();
    lastLocalMainTabKeyAt = Date.now();
    switchMainTabByOffset(-1);
    return;
  }
  const mainTabNextShortcutConfig = getEffectiveMainTabNextShortcut();
  if (matchKeyboardEventWithShortcut(event, mainTabNextShortcutConfig)) {
    event.preventDefault();
    lastLocalMainTabKeyAt = Date.now();
    switchMainTabByOffset(1);
    return;
  }
  const inputPrevShortcutConfig = getEffectiveInputPrevShortcut();
  if (matchKeyboardEventWithShortcut(event, inputPrevShortcutConfig)) {
    event.preventDefault();
    focusInputByOffset(-1);
    return;
  }
  const inputNextShortcutConfig = getEffectiveInputNextShortcut();
  if (matchKeyboardEventWithShortcut(event, inputNextShortcutConfig)) {
    event.preventDefault();
    focusInputByOffset(1);
    return;
  }
};

const onGlobalMainTabKeyup = (event: KeyboardEvent) => {
  syncAiChatModifierLatch(event);
  const aiChatRelated = activeTab.value === "ai-chat" && isAiChatShortcutRelatedEvent(event);
  if (!aiChatRelated) return;
  if (activeTab.value !== "ai-chat" || !isAiChatSendShortcutEvent(event)) return;
  const nowTs = Date.now();
  if (nowTs - lastLocalAiChatSendKeyAt <= 180) {
    return;
  }
  lastLocalAiChatSendKeyAt = nowTs;
  event.preventDefault();
  event.stopPropagation();
  void sendAiChatMessage();
};

const onGlobalPageZoomWheel = (event: WheelEvent) => {
  const ctrlPressed = Boolean(event.ctrlKey || event.getModifierState?.("Control") || aiChatModifierLatch.ctrl);
  const metaPressed = Boolean(event.metaKey || event.getModifierState?.("Meta"));
  const altPressed = Boolean(event.altKey || event.getModifierState?.("Alt"));
  if (!ctrlPressed || metaPressed || altPressed) return;

  event.preventDefault();
  event.stopPropagation();

  if (event.deltaY === 0) return;
  const delta = event.deltaY < 0 ? PAGE_ZOOM_STEP : -PAGE_ZOOM_STEP;
  const nextZoom = clampPageZoomValue(pageZoom.value + delta);
  if (nextZoom === pageZoom.value) return;

  pageZoom.value = nextZoom;
  scheduleSaveLocalState();
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

const onHostAiChatSend = () => {
  if (Date.now() - lastLocalAiChatSendKeyAt <= HOST_AI_CHAT_SEND_DEDUP_MS) return;
  if (!shouldAcceptHostAiChatSendForward()) {
    return;
  }
  if (activeTab.value !== "ai-chat") {
    return;
  }
  lastLocalAiChatSendKeyAt = Date.now();
  void sendAiChatMessage();
};

const onHostRawMessage = (payload: any) => {
  const messageType = String(payload?.type || "");
  if (messageType === "host-history-search-direct") {
    if (Date.now() - lastLocalHistorySearchKeyAt <= HOST_HISTORY_SEARCH_DEDUP_MS) return;
    lastLocalHistorySearchKeyAt = Date.now();
    openPromptHistoryDialog("Host Ctrl+Shift+F");
    return;
  }
  if (messageType === "host-page-zoom-wheel") {
    const deltaY = Number(payload?.deltaY);
    if (!Number.isFinite(deltaY) || deltaY === 0) return;
    const delta = deltaY < 0 ? PAGE_ZOOM_STEP : -PAGE_ZOOM_STEP;
    const nextZoom = clampPageZoomValue(pageZoom.value + delta);
    if (nextZoom === pageZoom.value) return;
    pageZoom.value = nextZoom;
    scheduleSaveLocalState();
    return;
  }
  if (messageType !== "host-ai-chat-send-direct") return;
  if (Date.now() - lastLocalAiChatSendKeyAt <= HOST_AI_CHAT_SEND_DEDUP_MS) return;
  if (!shouldAcceptHostAiChatSendForward()) {
    return;
  }
  if (activeTab.value !== "ai-chat") {
    return;
  }
  lastLocalAiChatSendKeyAt = Date.now();
  void sendAiChatMessage();
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
  if (document.visibilityState !== "visible") {
    resetAiChatModifierLatch();
    return;
  }
  stopImagePreviewPan();
  stopImagePreviewFrameResize();
  scheduleFocusMainInteractionAnchor();
};

const onWindowBlurStopInteraction = () => {
  resetAiChatModifierLatch();
  stopImagePreviewPan();
  stopImagePreviewFrameResize();
};

watch(
    () => [
      form.apiBaseUrl,
      form.model,
      form.prompt,
      form.size,
      form.batchSize,
      form.timeoutSeconds,
      form.antiMode,
      showProviderTab.value,
      showForgeTab.value,
      showPromptQueryTab.value,
      singleApiKeyName.value,
      singleProviderId.value,
      aiChatProviderId.value,
      JSON.stringify(providerItems.value),
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
      aiChatSendShortcut.value,
      mainTabPrevShortcut.value,
      mainTabNextShortcut.value,
      inputPrevShortcut.value,
      inputNextShortcut.value,
      promptLibraryForceSync.value,
      aiChatBaseUrl.value,
      aiChatApiKeyName.value,
      aiChatSelectedModel.value,
      aiChatOperationModel.value,
      aiChatApiKey.value,
      aiChatUserAvatarDataUrl.value,
      aiChatContextCount.value,
      aiChatTimeoutSeconds.value,
      aiChatMaxTokens.value,
      aiChatSystemPrompt.value,
      aiChatTemperature.value,
      aiChatTopP.value,
      aiChatPresencePenalty.value,
      aiChatFrequencyPenalty.value,
      aiChatJsonModeEnabled.value,
      forgeForm.apiUrl,
      forgeForm.mode,
      forgeForm.prompt,
      forgeForm.negativePrompt,
      forgeForm.model,
      forgeForm.sampler,
      forgeForm.scheduler,
      forgeForm.steps,
      forgeForm.cfgScale,
      forgeForm.denoise,
      forgeForm.width,
      forgeForm.height,
      forgeForm.batchSize,
      forgeForm.seed,
      forgeForm.lora,
      forgeForm.loraWeight,
      forgeForm.controlNetEnabled,
      forgeForm.controlNetModule,
      forgeForm.controlNetModel,
      forgeForm.controlNetWeight,
      forgeForm.timeoutSeconds,
      forgeForm.maxResolution,
      pluginBackgroundImageDataUrl.value,
      pluginBackgroundOpacity.value,
      pluginBackgroundPanelOpacity.value,
      pluginBackgroundBlur.value,
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

watch(providerManageSelected, (value) => {
  const selectedId = normalizeApiKeyValue(value);
  const item = providerItems.value.find((row) => row.id === selectedId) || null;
  if (!item) {
    providerManageName.value = "";
    providerManageBaseUrl.value = "";
    providerManageKey.value = "";
    providerManageProtocolMode.value = inferProviderProtocolModeByBaseUrl(providerManageBaseUrl.value);
    return;
  }
  providerManageName.value = item.name;
  providerManageBaseUrl.value = item.baseUrl;
  providerManageKey.value = item.key || "";
  providerManageProtocolMode.value = item.protocolMode;
});

watch(providerManageBaseUrl, (value) => {
  if (normalizeApiKeyValue(providerManageSelected.value)) return;
  providerManageProtocolMode.value = inferProviderProtocolModeByBaseUrl(String(value ?? ""));
});

watch(singleProviderId, (value) => {
  const selectedId = normalizeApiKeyValue(value);
  const provider = providerItems.value.find((item) => item.id === selectedId) || null;
  if (!provider) return;
  const baseUrl = normalizeApiBaseUrl(provider.baseUrl, DEFAULT_API_BASE_URL);
  if (form.apiBaseUrl !== baseUrl) {
    form.apiBaseUrl = baseUrl;
  }
  const key = normalizeApiKeyValue(provider.key);
  if (form.apiKey !== key) {
    form.apiKey = key;
  }
  void syncSingleModelForProvider(selectedId, "切换服务商");
});

watch(aiChatProviderId, (value) => {
  const selectedId = normalizeApiKeyValue(value);
  const provider = providerItems.value.find((item) => item.id === selectedId) || null;
  if (!provider) return;
  const baseUrl = normalizeAiChatBaseUrl(provider.baseUrl);
  if (aiChatBaseUrl.value !== baseUrl) {
    aiChatBaseUrl.value = baseUrl;
  }
  const key = normalizeAiChatApiToken(provider.key);
  if (aiChatApiKey.value !== key) {
    aiChatApiKey.value = key;
  }
  const protocol = resolveAiChatRuntimeProtocol(provider);
  if (aiChatLoadedProtocol.value && aiChatLoadedProtocol.value !== protocol) {
    clearAiChatModels();
  }
});

watch(
  () => getCurrentAiChatProvider()?.protocolMode || "",
  (value, previousValue) => {
    if (value === previousValue) return;
    if (!value) return;
    clearAiChatModels();
  },
);

watch(
  () => [
    JSON.stringify(providerItems.value),
    singleProviderId.value,
    aiChatProviderId.value,
  ],
  () => {
    scheduleSaveProviderConfigsToJson();
  },
);

watch(
  () => form.model,
  (model) => {
    syncSingleRuntimeByModel(model);
  },
);

watch(singleApiKeyName, (value) => {
  const selectedName = normalizeApiKeyValue(value);
  if (selectedName && managedApiKeyValueMap.value.has(selectedName)) {
    apiKeyManageSelected.value = selectedName;
  }
});

watch(
  () => form.apiBaseUrl,
  (value) => {
    const normalized = normalizeApiBaseUrl(value, DEFAULT_API_BASE_URL);
    if (value !== normalized) {
      form.apiBaseUrl = normalized;
      return;
    }
    const matched = providerItems.value.find(
      (item) => normalizeApiBaseUrl(item.baseUrl, DEFAULT_API_BASE_URL) === normalized,
    );
    if (matched && singleProviderId.value !== matched.id) {
      singleProviderId.value = matched.id;
    }
  },
);

watch(aiChatBaseUrl, (value, previousValue) => {
  const normalized = normalizeAiChatBaseUrl(value);
  if (value !== normalized) {
    aiChatBaseUrl.value = normalized;
    return;
  }
  const matched = providerItems.value.find(
    (item) => normalizeAiChatBaseUrl(item.baseUrl) === normalized,
  );
  if (matched && aiChatProviderId.value !== matched.id) {
    aiChatProviderId.value = matched.id;
  }
  if (normalized === normalizeAiChatBaseUrl(previousValue)) return;
  clearAiChatModels();
});

watch(aiChatApiKey, (value, previousValue) => {
  const nextKey = normalizeApiKeyValue(value);
  const prevKey = normalizeApiKeyValue(previousValue);
  if (nextKey === prevKey) return;
  clearAiChatModels();
});

watch(
  () => forgeForm.apiUrl,
  (value, previousValue) => {
    const nextUrl = normalizeForgeUrl(value || FORGE_DEFAULT_API_URL);
    if (value !== nextUrl) {
      forgeForm.apiUrl = nextUrl;
      return;
    }
    if (nextUrl === normalizeForgeUrl(previousValue || FORGE_DEFAULT_API_URL)) return;
    forgeConnected.value = false;
    forgeStatusText.value = "等待手动连接";
  },
);

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
  if (tab === "forge" && state.hostForge) {
    if (forgeRuntimeConnected.value && !forgeLoadingMeta.value) {
      void loadForgeMetaOptions(forgeForm.apiUrl, true);
    }
    if (state.hostForgePresets && !forgePresetLoading.value) {
      void loadForgePresetItems(true);
    }
    if (state.hostForgeCloud) {
      void prefillForgeCloudRememberedSetting();
    }
  }
  if (tab === "prompt-query" && !promptQueryInitialized.value) {
    void loadPromptQueryItems();
  }
});

watch(
    () => singlePromptQueryCommand.value.active,
    (active) => {
      if (!active) return;
      if (!state.hostPromptQuery) return;
      if (promptQueryInitialized.value || promptQueryLoading.value) return;
      void loadPromptQueryItems({ syncLibrary: false });
    },
);

watch(
    () => state.hostPromptQuery,
    (ready) => {
      if (!ready) return;
      if (!singlePromptQueryCommand.value.active) return;
      if (promptQueryInitialized.value || promptQueryLoading.value) return;
      void loadPromptQueryItems({ syncLibrary: false });
    },
);

watch(
  () => [
    pluginBackgroundImageDataUrl.value,
    pluginBackgroundOpacity.value,
    pluginBackgroundPanelOpacity.value,
    pluginBackgroundBlur.value,
  ],
  () => {
    savePluginBackgroundLocalState();
    scheduleSavePluginBackgroundToJson();
  },
);

onMounted(() => {
  loadLocalState();
  if (!removeHostMessageListener) {
    try {
      removeHostMessageListener = addHostMessageListener(onHostRawMessage);
    } catch (error) {
      console.warn("addHostMessageListener failed", error);
      removeHostMessageListener = null;
    }
  }
  window.addEventListener("keydown", onGlobalMainTabKeydown, true);
  window.addEventListener("keyup", onGlobalMainTabKeyup, true);
  document.addEventListener("keydown", onPromptHistoryShortcutKeydown, true);
  document.addEventListener("wheel", onGlobalPageZoomWheel, { capture: true, passive: false });
  window.addEventListener("wheel", onGlobalPageZoomWheel, { capture: true, passive: false });
  window.addEventListener(webviewAPI.HOST_MAIN_TAB_NAV_EVENT, onHostMainTabNav as EventListener);
  window.addEventListener(webviewAPI.HOST_AI_CHAT_SEND_EVENT, onHostAiChatSend as EventListener);
  window.addEventListener("focus", onWindowFocusRecoverInteraction);
  window.addEventListener("blur", onWindowBlurStopInteraction);
  document.addEventListener("visibilitychange", onDocumentVisibilityRecoverInteraction);
  scheduleFocusMainInteractionAnchor();

  void (async () => {
    await initHostCapabilities();
    await loadProviderConfigsFromJson();
    await loadSingleRunConfirmSkipDateFromHost();
    await syncCustomFeatureEnabledFromHost();
    await openStartupNoticeIfNeeded();
    await loadThemePresetFromJson();
    await loadPluginBackgroundFromJson();
    await loadPromptHistoryFromJson();
    message.success("用户个人设置数据加载成功");
    await loadManagedApiKeys();
    await refreshPromptCreateStorageInfo();
    if (activeTab.value === "prompt-query") {
      await loadPromptQueryItems();
    }

    logTagged("系统", `就绪 ${APP_VERSION}`, "info");
    logTagged(
      "系统",
      `API 挂载: runSingle=${state.hostRunSingle}, quota=${state.hostQuota}, batchCapture=${state.hostBatchCapture}, batchRun=${state.hostBatchRun}, forge=${state.hostForge}, forgePresets=${state.hostForgePresets}, forgePresetIO=${state.hostForgePresetIO}, antiReverse=${state.hostReverseAntiAction}, global=${state.hostGlobalPartition}, promptCreate=${state.hostPromptCreate}, promptQuery=${state.hostPromptQuery}, promptDelete=${state.hostPromptDelete}, promptFavorite=${state.hostPromptFavorite}, promptHistorySave=${state.hostPromptHistorySave}, promptHistoryRead=${state.hostPromptHistoryRead}, singleRunConfirm=${state.hostSingleRunConfirmPreference}, stampVisible=${state.hostStampVisibleLayer}, providerConfig=${state.hostProviderConfig}, keyManage=${state.hostApiKeyManage}`,
        state.hostRunSingle &&
        state.hostQuota &&
        state.hostBatchCapture &&
        state.hostBatchRun &&
        state.hostForge &&
        state.hostForgePresets &&
        state.hostForgePresetIO &&
        state.hostReverseAntiAction &&
        state.hostGlobalPartition &&
        state.hostPromptCreate &&
        state.hostPromptQuery &&
        state.hostPromptDelete &&
        state.hostPromptFavorite &&
        state.hostSingleRunConfirmPreference &&
        state.hostStampVisibleLayer &&
        state.hostProviderConfig &&
        state.hostApiKeyManage
            ? "success"
            : "warn",
    );
  })();
});

onBeforeUnmount(() => {
  if (aiChatRequestAbortController) {
    aiChatRequestAbortController.abort();
    aiChatRequestAbortController = null;
    aiChatAbortByUser = false;
  }
  if (removeHostMessageListener) {
    removeHostMessageListener();
    removeHostMessageListener = null;
  }
  window.removeEventListener("keydown", onGlobalMainTabKeydown, true);
  window.removeEventListener("keyup", onGlobalMainTabKeyup, true);
  document.removeEventListener("keydown", onPromptHistoryShortcutKeydown, true);
  document.removeEventListener("wheel", onGlobalPageZoomWheel, true);
  window.removeEventListener("wheel", onGlobalPageZoomWheel, true);
  window.removeEventListener(webviewAPI.HOST_MAIN_TAB_NAV_EVENT, onHostMainTabNav as EventListener);
  window.removeEventListener(webviewAPI.HOST_AI_CHAT_SEND_EVENT, onHostAiChatSend as EventListener);
  window.removeEventListener("focus", onWindowFocusRecoverInteraction);
  window.removeEventListener("blur", onWindowBlurStopInteraction);
  document.removeEventListener("visibilitychange", onDocumentVisibilityRecoverInteraction);
  stopImagePreviewPan();
  stopImagePreviewFrameResize();
  if (persistTimer) {
    window.clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (pluginBackgroundPersistTimer) {
    window.clearTimeout(pluginBackgroundPersistTimer);
    pluginBackgroundPersistTimer = null;
  }
  if (promptHistoryPersistTimer) {
    window.clearTimeout(promptHistoryPersistTimer);
    promptHistoryPersistTimer = null;
  }
  if (providerConfigPersistTimer) {
    window.clearTimeout(providerConfigPersistTimer);
    providerConfigPersistTimer = null;
    void saveProviderConfigsToJson();
  }
  clearImagePreviewItems();
  safeSaveLocalState();
});
</script>

<template>
  <main
    class="single-page"
    :class="{ 'has-plugin-background': hasPluginBackground }"
    :style="mainPageBackgroundStyle"
    @mousedown.capture="scheduleFocusMainInteractionAnchor"
  >
    <div v-if="hasPluginBackground" class="plugin-background-media-layer" aria-hidden="true">
      <img :src="pluginBackgroundImageDataUrl" alt="plugin background layer"/>
    </div>

    <button
        ref="mainInteractionFocusAnchorRef"
        class="main-interaction-focus-anchor"
        type="button"
        tabindex="0"
        aria-hidden="true"
    />

    <t-tabs v-model="activeTab" class="main-tabs">
      <t-tab-panel value="single">
        <template #label>图像工作台</template>
        <MainTabSingle
          v-model:single-provider-id="singleProviderId"
          :form="form"
          :state="state"
          :single-provider-options="singleProviderSelectOptions"
          :single-model-options="singleModelOptions"
          :layer-type-options="layerTypeOptions"
          :run-disabled="runDisabled"
          :add-batch-disabled="addBatchDisabled"
          :run-batch-disabled="runBatchDisabled"
          :quota-disabled="quotaDisabled"
          :quota-info="quotaInfo"
          :preview-image="previewImage"
          :batch-queue="batchQueue"
          :single-prompt-query-command="singlePromptQueryCommand"
          :single-prompt-query-results="singlePromptQueryResults"
          :single-prompt-query-loading="promptQueryLoading && singlePromptQueryCommand.active"
          :open-single-prompt-quick-save-dialog="openSinglePromptQuickSaveDialog"
          :jump-to-prompt-query="jumpToPromptQuery"
          :clear-prompt="clearPrompt"
          :load-single-provider-models="loadSingleProviderModels"
          :append-prompt-for-single="appendPromptForSingle"
          :use-prompt-for-single="usePromptForSingle"
          :set-anti-mode="setAntiMode"
          :reverse-anti-action-disabled="reverseAntiActionDisabled"
          :run-anti-reverse-action="runAntiReverseAction"
          :run-single-image="runSingleImage"
          :add-current-to-batch="addCurrentToBatch"
          :clear-batch-queue="clearBatchQueue"
          :remove-batch-task="removeBatchTask"
          :get-task-meta="getTaskMeta"
          :run-batch-queue="runBatchQueue"
          :check-quota="checkQuota"
        />
      </t-tab-panel>

      <t-tab-panel v-if="showProviderTab" value="provider">
        <template #label>服务商配置</template>
        <MainTabProvider
          v-model:provider-manage-selected="providerManageSelected"
          v-model:provider-manage-name="providerManageName"
          v-model:provider-manage-base-url="providerManageBaseUrl"
          v-model:provider-manage-key="providerManageKey"
          v-model:provider-manage-protocol-mode="providerManageProtocolMode"
          :provider-items="providerItems"
          :create-provider="createProvider"
          :update-provider="updateProvider"
          :delete-provider="deleteProvider"
          :load-provider-models="loadProviderModelsForManage"
        />
      </t-tab-panel>

      <t-tab-panel v-if="showForgeTab" value="forge">
        <template #label>Forge模式</template>
        <MainTabForge
          :forge-form="forgeForm"
          :state="state"
          :forge-connected="forgeRuntimeConnected"
          :forge-connecting="forgeConnecting"
          :forge-loading-meta="forgeLoadingMeta"
          :forge-running="forgeRunning"
          :forge-status-text="forgeDisplayStatusText"
          :forge-model-options="forgeModelOptions"
          :forge-sampler-options="forgeSamplerOptions"
          :forge-cn-module-options="forgeCnModuleOptions"
          :forge-cn-model-options="forgeCnModelOptions"
          :forge-lora-options="forgeLoraOptions"
          :forge-cloud-user="forgeCloudUser"
          :forge-cloud-points="forgeCloudPoints"
          :forge-cloud-connected="forgeCloudConnected"
          :forge-cloud-busy="forgeCloudBusy"
          :forge-cloud-auth-visible="forgeCloudAuthVisible"
          :forge-cloud-auth-submitting="forgeCloudAuthSubmitting"
          :forge-cloud-auth-form="forgeCloudAuthForm"
          v-model:forge-preset-keyword="forgePresetKeyword"
          v-model:forge-preset-category="forgePresetCategory"
          v-model:forge-preset-favorites-only="forgePresetFavoritesOnly"
          :forge-preset-category-options="forgePresetCategoryOptions"
          :forge-preset-loading="forgePresetLoading"
          :forge-preset-importing="forgePresetImporting"
          :forge-preset-exporting="forgePresetExporting"
          :forge-preset-items="forgePresetItems"
          :forge-preset-filtered-items="forgePresetFilteredItems"
          :refresh-forge-preset-items="refreshForgePresetItems"
          :import-forge-preset-items="importForgePresetItems"
          :export-forge-preset-items="exportForgePresetItems"
          :open-forge-preset-save-dialog="openForgePresetSaveDialog"
          :apply-forge-preset-item="applyForgePresetItem"
          :delete-forge-preset-item="deleteForgePresetItem"
          :toggle-forge-preset-favorite-item="toggleForgePresetFavoriteItem"
          :connect-forge="connectForge"
          :save-forge-draft="saveForgeDraft"
          :refresh-forge-meta-options="refreshForgeMetaOptions"
          :run-forge-generate="runForgeGenerate"
          :interrupt-forge-generate="interruptForgeGenerate"
          :set-forge-cloud-auth-visible="setForgeCloudAuthVisible"
          :login-forge-cloud="loginForgeCloud"
          :logout-forge-cloud="logoutForgeCloud"
          :connect-forge-cloud="connectForgeCloud"
          :disconnect-forge-cloud="disconnectForgeCloud"
          :refresh-forge-cloud-points="() => refreshForgeCloudPoints()"
          :translate-forge-text="translateForgeText"
        />
      </t-tab-panel>

      <t-tab-panel value="ai-chat">
        <template #label>与AI对话</template>
        <MainTabAiChat
          v-model:ai-chat-provider-id="aiChatProviderId"
          v-model:ai-chat-selected-model="aiChatSelectedModel"
          v-model:ai-chat-operation-model="aiChatOperationModel"
          v-model:ai-chat-input-text="aiChatInputText"
          v-model:ai-chat-send-shortcut="aiChatSendShortcut"
          v-model:ai-chat-context-count="aiChatContextCount"
          v-model:ai-chat-timeout-seconds="aiChatTimeoutSeconds"
          v-model:ai-chat-max-tokens="aiChatMaxTokens"
          v-model:ai-chat-system-prompt="aiChatSystemPrompt"
          v-model:ai-chat-temperature="aiChatTemperature"
          v-model:ai-chat-top-p="aiChatTopP"
          v-model:ai-chat-presence-penalty="aiChatPresencePenalty"
          v-model:ai-chat-frequency-penalty="aiChatFrequencyPenalty"
          v-model:ai-chat-json-mode-enabled="aiChatJsonModeEnabled"
          :state="state"
          :ai-chat-provider-options="aiChatProviderSelectOptions"
          :ai-chat-model-loading="aiChatModelLoading"
          :ai-chat-model-select-options="aiChatModelSelectOptions"
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
          :handle-ai-chat-fill-prompt="handleAiChatFillPrompt"
          :set-ai-chat-messages-ref="setAiChatMessagesRef"
          :set-ai-chat-upload-input-ref="setAiChatUploadInputRef"
          :on-ai-chat-files-change="onAiChatFilesChange"
          :remove-ai-chat-pending-image="removeAiChatPendingImage"
          :open-ai-chat-image-picker="openAiChatImagePicker"
          :upload-ai-chat-current-selection-image="uploadAiChatCurrentSelectionImage"
          :send-ai-chat-message="sendAiChatMessage"
          :load-ai-chat-models="loadAiChatModels"
          :clear-ai-chat-models="clearAiChatModels"
          :is-ai-chat-send-shortcut-event="isAiChatSendShortcutEvent"
          :get-ai-chat-send-shortcut-label="getAiChatSendShortcutLabel"
          :on-ai-chat-shortcut-debug="onAiChatShortcutDebug"
          :abort-ai-chat-sending="abortAiChatSending"
          :rewind-ai-chat-last-user-message="rewindAiChatLastUserMessage"
          :ai-chat-rewind-disabled="aiChatRewindDisabled"
          :clear-ai-chat-conversation="clearAiChatConversation"
          :apply-ai-chat-last-json-to-single-prompt="applyAiChatLastJsonToSinglePrompt"
        />
      </t-tab-panel>

      <t-tab-panel v-if="showPromptQueryTab" value="prompt-query">
        <template #label>提示词查询</template>
        <MainTabPromptQuery
          v-model:prompt-query-name-keyword="promptQueryNameKeyword"
          v-model:prompt-query-description-keyword="promptQueryDescriptionKeyword"
          v-model:prompt-query-tag-keyword="promptQueryTagKeyword"
          v-model:prompt-query-ai-input="promptQueryAiInput"
          v-model:prompt-query-favorites-only="promptQueryFavoritesOnly"
          v-model:prompt-query-source-type="promptQuerySourceType"
          v-model:prompt-library-force-sync="promptLibraryForceSync"
          :state="state"
          :prompt-query-items="promptQueryItems"
          :prompt-query-filtered-items="promptQueryFilteredItems"
          :prompt-query-loading="promptQueryLoading"
          :prompt-library-refresh-loading="promptLibraryRefreshLoading"
          :prompt-query-ai-loading="promptQueryAiLoading"
          :prompt-query-ai-disabled="promptQueryAiDisabled"
          :prompt-query-detail-item="promptQueryDetailItem"
          :prompt-query-deleting-name="promptQueryDeletingName"
          :pull-prompt-library-from-cloud="pullPromptLibraryFromCloud"
          :load-prompt-query-items="loadPromptQueryItems"
          :apply-prompt-query-ai-filter="applyPromptQueryAiFilter"
          :close-prompt-query-detail="closePromptQueryDetail"
          :format-prompt-time="formatPromptTime"
          :toggle-prompt-query-favorite="togglePromptQueryFavorite"
          :delete-prompt-query-item="deletePromptQueryItem"
          :open-prompt-query-edit-dialog="openPromptQueryEditDialog"
          :open-prompt-create-dialog="openPromptCreateDialog"
          :append-prompt-for-single="appendPromptForSingle"
          :use-prompt-for-single="usePromptForSingle"
          :handle-prompt-query-item-click="handlePromptQueryItemClick"
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

      <t-tab-panel value="settings">
        <template #label>设置</template>
        <MainTabSettings
          v-model:theme-preset="themePreset"
          v-model:show-provider-tab="showProviderTab"
          v-model:show-forge-tab="showForgeTab"
          v-model:show-prompt-query-tab="showPromptQueryTab"
          v-model:single-run-shortcut="singleRunShortcut"
          v-model:ai-chat-send-shortcut="aiChatSendShortcut"
          v-model:main-tab-prev-shortcut="mainTabPrevShortcut"
          v-model:main-tab-next-shortcut="mainTabNextShortcut"
          v-model:input-prev-shortcut="inputPrevShortcut"
          v-model:input-next-shortcut="inputNextShortcut"
          v-model:plugin-background-opacity="pluginBackgroundOpacity"
          v-model:plugin-background-panel-opacity="pluginBackgroundPanelOpacity"
          v-model:plugin-background-blur="pluginBackgroundBlur"
          :theme-preset-options="themePresetOptions"
          :ai-chat-user-avatar-data-url="aiChatUserAvatarDataUrl"
          :plugin-background-image-data-url="pluginBackgroundImageDataUrl"
          :form="form"
          :global-form="globalForm"
          :size-options="sizeOptions"
          :state="state"
          :run-global-partition-disabled="runGlobalPartitionDisabled"
          :global-partition-result="globalPartitionResult"
          :open-ai-chat-avatar-picker="openAiChatAvatarPicker"
          :clear-ai-chat-user-avatar="clearAiChatUserAvatar"
          :set-ai-chat-avatar-input-ref="setAiChatAvatarInputRef"
          :on-ai-chat-avatar-change="onAiChatAvatarChange"
          :open-plugin-background-picker="openPluginBackgroundPicker"
          :clear-plugin-background="clearPluginBackground"
          :set-plugin-background-input-ref="setPluginBackgroundInputRef"
          :on-plugin-background-change="onPluginBackgroundChange"
          :capture-single-run-shortcut="captureSingleRunShortcut"
          :reset-single-run-shortcut="resetSingleRunShortcut"
          :capture-ai-chat-send-shortcut="captureAiChatSendShortcut"
          :reset-ai-chat-send-shortcut="resetAiChatSendShortcut"
          :capture-main-tab-prev-shortcut="captureMainTabPrevShortcut"
          :capture-main-tab-next-shortcut="captureMainTabNextShortcut"
          :capture-input-prev-shortcut="captureInputPrevShortcut"
          :capture-input-next-shortcut="captureInputNextShortcut"
          :reset-main-tab-prev-shortcut="resetMainTabPrevShortcut"
          :reset-main-tab-next-shortcut="resetMainTabNextShortcut"
          :reset-input-prev-shortcut="resetInputPrevShortcut"
          :reset-input-next-shortcut="resetInputNextShortcut"
          :confirm-feature-code="confirmFeatureCode"
          :set-max-resolution-preset="setMaxResolutionPreset"
          :run-global-partition="runGlobalPartition"
        />
      </t-tab-panel>
    </t-tabs>

    <t-dialog
      v-model:visible="promptHistoryDialogVisible"
      header="历史提示词检索"
      dialog-class-name="history-record-dialog"
      width="760px"
      placement="center"
      :footer="false"
    >
      <div class="history-record-search-row">
        <t-select
          v-model="promptHistoryEventType"
          class="history-record-event-select"
          clearable
          :options="promptHistoryEventOptions"
          placeholder="按事件筛选"
        />
        <t-input
          v-model.trim="promptHistoryKeyword"
          clearable
          placeholder="输入关键词搜索提示词 / 对话内容"
        />
        <t-button
          variant="outline"
          theme="default"
          :disabled="promptHistoryRecords.length === 0"
          @click="clearPromptHistory"
        >
          清空历史
        </t-button>
      </div>

      <div class="history-record-meta">
        总数 {{ promptHistoryRecords.length }} 条，匹配 {{ promptHistoryFilteredItems.length }} 条
      </div>

      <div class="history-record-list">
        <div v-if="promptHistoryRecords.length === 0" class="batch-empty">暂无历史记录。</div>
        <div v-else-if="promptHistoryFilteredItems.length === 0" class="batch-empty">没有匹配的记录。</div>
        <div
          v-for="item in promptHistoryFilteredItems"
          :key="item.id"
          class="history-record-item"
        >
          <div class="history-record-head">
            <span class="history-record-event">{{ PROMPT_HISTORY_EVENT_LABEL_MAP[item.eventType] }}</span>
            <span class="history-record-time">{{ formatPromptHistoryTime(item.createdAt) }}</span>
          </div>
          <div
            class="history-record-content"
            :class="{ 'is-collapsed': !isPromptHistoryRecordExpanded(item.id) }"
          >
            {{ item.content }}
          </div>
          <div class="history-record-actions">
            <t-button
              size="small"
              variant="text"
              theme="primary"
              @click="togglePromptHistoryRecordExpand(item.id)"
            >
              {{ isPromptHistoryRecordExpanded(item.id) ? "折叠内容" : "展开内容" }}
            </t-button>
            <t-button size="small" variant="outline" theme="primary" @click="applyPromptHistoryToSinglePrompt(item)">
              填入图像工作台
            </t-button>
          </div>
        </div>
      </div>
    </t-dialog>

    <t-dialog
      v-model:visible="forgePresetSaveVisible"
      header="保存Forge预设"
      dialog-class-name="quick-prompt-save-dialog"
      width="520px"
      placement="center"
      :close-on-overlay-click="!forgePresetSaving"
      :close-on-esc-keydown="!forgePresetSaving"
    >
      <div class="quick-prompt-save-body">
        <section class="field-block">
          <label>预设名称</label>
          <t-input
            v-model.trim="forgePresetSaveForm.name"
            clearable
            placeholder="请输入预设名称"
          />
        </section>
        <section class="field-block">
          <label>分类</label>
          <t-input
            v-model.trim="forgePresetSaveForm.category"
            clearable
            placeholder="例如：portrait / product / anime"
          />
        </section>
      </div>
      <template #footer>
        <div class="quick-prompt-save-footer">
          <t-button
            variant="outline"
            theme="default"
            :disabled="forgePresetSaving"
            @click="forgePresetSaveVisible = false"
          >
            取消
          </t-button>
          <t-button
            theme="primary"
            :loading="forgePresetSaving"
            :disabled="forgePresetSaving || !forgePresetSaveForm.name.trim()"
            @click="saveForgePresetFromDialog"
          >
            {{ forgePresetSaving ? "保存中..." : "保存" }}
          </t-button>
        </div>
      </template>
    </t-dialog>

    <t-dialog
      v-model:visible="promptCreateDialogVisible"
      header="提示词新增"
      dialog-class-name="quick-prompt-save-dialog prompt-create-entry-dialog"
      width="960px"
      placement="center"
      :footer="false"
      :close-on-overlay-click="!promptCreateSaving"
      :close-on-esc-keydown="!promptCreateSaving"
    >
      <MainTabPromptCreate
        :prompt-create-form="promptCreateForm"
        :prompt-create-saving="promptCreateSaving"
        :prompt-create-ai-filling="promptCreateAiFilling"
        :prompt-create-save-disabled="promptCreateSaveDisabled"
        :prompt-create-ai-fill-disabled="promptCreateAiFillDisabled"
        :prompt-create-storage-path="promptCreateStoragePath"
        :prompt-create-total="promptCreateTotal"
        :save-prompt-create-form="savePromptCreateForm"
        :fill-prompt-create-form-by-ai="fillPromptCreateFormByAi"
        :jump-to-prompt-query="jumpToPromptQuery"
        :clear-prompt-create-form="clearPromptCreateForm"
        :copy-prompt-create-storage-path="copyPromptCreateStoragePath"
      />
    </t-dialog>

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
      v-model:visible="singleRunConfirmVisible"
      header="开始生成确认"
      dialog-class-name="quick-prompt-save-dialog single-run-confirm-dialog"
      width="560px"
      placement="center"
      :close-on-overlay-click="!singleRunConfirmSubmitting"
      :close-on-esc-keydown="!singleRunConfirmSubmitting"
    >
      <div class="single-run-confirm-body">
        <div class="single-run-confirm-grid">
          <div class="single-run-confirm-item">
            <span class="single-run-confirm-label">服务商</span>
            <span class="single-run-confirm-value">{{ getCurrentSingleProviderDisplayName() }}</span>
          </div>
          <div class="single-run-confirm-item">
            <span class="single-run-confirm-label">模型</span>
            <span class="single-run-confirm-value">{{ normalizeApiKeyValue(form.model) || SINGLE_DEFAULT_MODEL }}</span>
          </div>
          <div class="single-run-confirm-item">
            <span class="single-run-confirm-label">数量</span>
            <span class="single-run-confirm-value">{{ form.batchSize }}</span>
          </div>
          <div class="single-run-confirm-item">
            <span class="single-run-confirm-label">超时</span>
            <span class="single-run-confirm-value">{{ form.timeoutSeconds }} 秒</span>
          </div>
        </div>
        <div class="single-run-confirm-tip">
          是否在执行生成前先盖印一层。
        </div>
        <t-checkbox
          v-model="singleRunConfirmStampLayer"
          class="single-run-confirm-check"
          :disabled="!stampVisibleLayerSupported"
        >
          生成前先盖印一层
        </t-checkbox>
        <div v-if="!stampVisibleLayerSupported" class="single-run-confirm-tip">
          当前宿主未提供盖印接口，本次只能直接执行生成。
        </div>
      </div>
      <template #footer>
        <div class="single-run-confirm-footer">
          <t-button
            theme="primary"
            :loading="singleRunConfirmSubmitting"
            :disabled="singleRunConfirmSubmitting"
            @click="confirmSingleRun(false)"
          >
            确定
          </t-button>
          <t-button
            variant="outline"
            theme="primary"
            :loading="singleRunConfirmSubmitting"
            :disabled="singleRunConfirmSubmitting || !singleRunConfirmJsonSupported"
            @click="confirmSingleRun(true)"
          >
            确定且当天不再弹出
          </t-button>
        </div>
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

  <teleport to="body">
    <button
      type="button"
      class="history-float-ball"
      aria-label="历史检索"
      title="历史检索（Ctrl+Shift+F）"
      @click="openPromptHistoryDialog('悬浮球')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 2a10 10 0 1 0 9.95 11h-2.03A8 8 0 1 1 12 4a7.95 7.95 0 0 1 5.56 2.25L15 9h7V2l-2.99 2.99A9.94 9.94 0 0 0 12 2Zm-.9 5.2v5.22l4.3 2.58.98-1.68-3.28-1.98V7.2h-2Z"
          fill="currentColor"
        />
      </svg>
      <span>历史检索</span>
    </button>
  </teleport>
</template>



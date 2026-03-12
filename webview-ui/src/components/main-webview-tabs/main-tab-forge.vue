<script setup lang="ts">
import {computed, ref, watch} from "vue";

const props = defineProps<{
  forgeForm: any;
  state: any;
  forgeConnected: boolean;
  forgeConnecting: boolean;
  forgeLoadingMeta: boolean;
  forgeRunning: boolean;
  forgeStatusText: string;
  forgeModelOptions: any[];
  forgeSamplerOptions: any[];
  forgeCnModuleOptions: any[];
  forgeCnModelOptions: any[];
  forgeLoraOptions: any[];
  forgePresetCategoryOptions: any[];
  forgePresetLoading: boolean;
  forgePresetImporting: boolean;
  forgePresetExporting: boolean;
  forgePresetItems: any[];
  forgePresetFilteredItems: any[];
  forgeCloudUser: any;
  forgeCloudPoints: number;
  forgeCloudConnected: boolean;
  forgeCloudBusy: boolean;
  forgeCloudAuthVisible: boolean;
  forgeCloudAuthSubmitting: boolean;
  forgeCloudAuthForm: any;
  refreshForgePresetItems: () => void;
  importForgePresetItems: (replace?: boolean) => void;
  exportForgePresetItems: () => void;
  openForgePresetSaveDialog: (item?: any | null) => void;
  applyForgePresetItem: (item: any) => void;
  deleteForgePresetItem: (item: any) => void;
  toggleForgePresetFavoriteItem: (item: any) => void;
  connectForge: () => void;
  saveForgeDraft: () => void;
  refreshForgeMetaOptions: () => void;
  runForgeGenerate: () => void;
  interruptForgeGenerate: () => void;
  setForgeCloudAuthVisible: (visible: boolean) => void;
  loginForgeCloud: () => Promise<boolean>;
  logoutForgeCloud: () => Promise<void>;
  connectForgeCloud: () => Promise<boolean>;
  disconnectForgeCloud: () => void;
  refreshForgeCloudPoints: () => Promise<boolean>;
  translateForgeText: (text: string) => Promise<string>;
}>();

defineModel<string>("forgePresetKeyword", {required: true});
defineModel<string>("forgePresetCategory", {required: true});
defineModel<boolean>("forgePresetFavoritesOnly", {required: true});

const selectedPresetId = ref("");
const forgeTranslateInput = ref("");
const forgeTranslating = ref(false);

const forgeRuntimeConnected = computed(() => props.forgeConnected || props.forgeCloudConnected);

const FORGE_CATEGORY_LABEL_MAP: Record<string, string> = {
  head: "脸部",
  hair: "毛发",
  torso: "身体",
  legs: "腿部",
  background: "背景",
  custom: "自定义",
};

const forgeSchedulerOptions = [
  {label: "Automatic", value: "automatic"},
  {label: "uniform", value: "uniform"},
  {label: "karras", value: "karras"},
  {label: "exponential", value: "exponential"},
  {label: "sgm_uniform", value: "sgm_uniform"},
];

const quickPresetOptions = computed(() =>
  (Array.isArray(props.forgePresetItems) ? props.forgePresetItems : []).map((item: any) => ({
    label: `${Number(item?.favorite) === 1 ? "★ " : ""}${String(item?.name ?? "")}`,
    value: String(item?.id ?? ""),
  })),
);

const selectedPresetItem = computed(
  () =>
    (Array.isArray(props.forgePresetItems) ? props.forgePresetItems : []).find(
      (item: any) => String(item?.id ?? "") === selectedPresetId.value,
    ) || null,
);

const selectedPresetMeta = computed(() => {
  const item = selectedPresetItem.value;
  if (!item) return "选择预设后会立即填充当前参数";
  const category = String(item?.category ?? "").trim() || "custom";
  const mode = String(item?.data?.mode ?? "img2img") === "txt2img" ? "txt2img" : "img2img";
  return `${FORGE_CATEGORY_LABEL_MAP[category] || category} · ${mode}`;
});

const forgeModeLabel = computed(() =>
  props.forgeForm.mode === "txt2img" ? "当前模式：txt2img" : "当前模式：img2img",
);

const generateButtonText = computed(() => {
  if (props.forgeRunning) return "执行中...";
  return props.forgeForm.mode === "txt2img" ? "Forge txt2img 生成" : "Forge img2img 生成";
});

const cloudButtonText = computed(() => {
  if (props.forgeCloudBusy) return "处理中...";
  if (props.forgeCloudConnected) return "断开云端";
  if (props.forgeCloudUser) return "连接云端";
  return "登录云端";
});

const cloudHeadline = computed(() => {
  if (props.forgeCloudConnected) return "云 Forge 已连接，当前可直接走云端生成";
  if (props.forgeCloudUser) return "云账号已登录，按需手动连接云 Forge";
  return "登录后可连接云 Forge，本地 Forge 保持手动连接";
});

const cloudStatusText = computed(() => {
  if (props.forgeCloudConnected) return "云端在线";
  if (props.forgeCloudUser) return "账号已登录";
  return "未登录";
});

watch(
  () => props.forgePresetItems,
  (items) => {
    const currentId = selectedPresetId.value;
    if (!currentId) return;
    const exists = Array.isArray(items)
      && items.some((item: any) => String(item?.id ?? "") === currentId);
    if (!exists) {
      selectedPresetId.value = "";
    }
  },
  {deep: true},
);

watch(selectedPresetId, (value, previousValue) => {
  if (!value || value === previousValue) return;
  const target = selectedPresetItem.value;
  if (target) {
    props.applyForgePresetItem(target);
  }
});

const openCloudAuth = () => {
  props.setForgeCloudAuthVisible(true);
};

const closeCloudAuth = () => {
  props.setForgeCloudAuthVisible(false);
};

const handleCloudPrimaryAction = async () => {
  if (props.forgeCloudConnected) {
    props.disconnectForgeCloud();
    return;
  }
  if (props.forgeCloudUser) {
    await props.connectForgeCloud();
    return;
  }
  openCloudAuth();
};

const handleTranslateFill = async () => {
  const text = String(forgeTranslateInput.value ?? "").trim();
  if (!text || forgeTranslating.value) return;
  forgeTranslating.value = true;
  try {
    forgeTranslateInput.value = await props.translateForgeText(text);
  } finally {
    forgeTranslating.value = false;
  }
};

const appendTranslatedPrompt = async (target: "positive" | "negative") => {
  const text = String(forgeTranslateInput.value ?? "").trim();
  if (!text || forgeTranslating.value) return;
  forgeTranslating.value = true;
  try {
    const translated = await props.translateForgeText(text);
    const current = String(
      target === "positive" ? props.forgeForm.prompt ?? "" : props.forgeForm.negativePrompt ?? "",
    ).trim();
    const nextValue = current ? `${current}, ${translated}` : translated;
    if (target === "positive") {
      props.forgeForm.prompt = nextValue;
    } else {
      props.forgeForm.negativePrompt = nextValue;
    }
    forgeTranslateInput.value = "";
  } finally {
    forgeTranslating.value = false;
  }
};
</script>

<template>
  <div class="tab-pane-body tab-pane-forge">
    <div class="forge-reference-panel">
      <div v-if="!props.state.hostForge" class="batch-empty">
        当前宿主未挂载 Forge 接口，请重载插件后重试。
      </div>

      <template v-else>
        <section class="forge-topbar">
          <div class="forge-topbar-copy">
            <span class="forge-topbar-badge">LOCAL</span>
            <div class="forge-topbar-copy-text">
              <div class="forge-topbar-title">本地 Forge</div>
              <div class="forge-topbar-caption">不会自动连接，填写地址后手动连接。</div>
            </div>
          </div>
          <t-input
            v-model.trim="props.forgeForm.apiUrl"
            class="forge-topbar-input"
            clearable
            placeholder="http://127.0.0.1:7860"
          />
          <t-button
            variant="outline"
            theme="default"
            class="forge-topbar-btn forge-topbar-btn-save"
            @click="props.saveForgeDraft"
          >
            保存地址
          </t-button>
          <t-button
            theme="primary"
            class="forge-topbar-btn"
            :loading="props.forgeConnecting"
            @click="props.connectForge"
          >
            {{ props.forgeConnecting ? "连接中..." : "连接本地" }}
          </t-button>
        </section>

        <section class="forge-statusbar">
          <span class="forge-statusbar-text">{{ props.forgeStatusText }}</span>
          <span class="forge-statusbar-mode">{{ forgeModeLabel }}</span>
        </section>

        <section
          v-if="props.state.hostForgeCloud"
          class="forge-cloud-panel"
          :class="{ 'is-connected': props.forgeCloudConnected }"
        >
          <div class="forge-cloud-panel-main">
            <div class="forge-cloud-panel-copy">
              <span class="forge-cloud-panel-kicker">CLOUD</span>
              <div class="forge-cloud-panel-title">{{ cloudHeadline }}</div>
              <div class="forge-cloud-panel-desc">
                云端连接成功后会优先走云端链路；本地 Forge 仍然只在你点击“连接本地”时探测。
              </div>
            </div>
            <div class="forge-cloud-panel-actions">
              <t-button
                variant="outline"
                theme="primary"
                class="forge-cloud-login-btn"
                :disabled="props.forgeCloudBusy"
                @click="handleCloudPrimaryAction"
              >
                {{ cloudButtonText }}
              </t-button>
              <t-button
                v-if="props.forgeCloudUser"
                variant="outline"
                theme="default"
                size="small"
                :disabled="props.forgeCloudBusy"
                @click="props.refreshForgeCloudPoints"
              >
                刷新积分
              </t-button>
            </div>
          </div>

          <div class="forge-cloud-meta-row">
            <span class="forge-cloud-meta-pill" :class="{ 'is-connected': props.forgeCloudConnected }">
              {{ cloudStatusText }}
            </span>
            <span v-if="props.forgeCloudUser" class="forge-cloud-meta-pill forge-cloud-meta-pill-user">
              {{ props.forgeCloudUser.email || "未命名用户" }}
            </span>
            <span v-if="props.forgeCloudUser" class="forge-cloud-meta-pill">
              积分 {{ props.forgeCloudPoints }}
            </span>
            <t-button
              v-if="props.forgeCloudUser"
              variant="text"
              theme="warning"
              size="small"
              :disabled="props.forgeCloudBusy"
              @click="props.logoutForgeCloud"
            >
              退出账号
            </t-button>
          </div>
        </section>

        <section v-if="props.state.hostForgePresets" class="forge-section">
          <div class="forge-section-head">
            <span class="forge-section-title">快速预设</span>
            <span class="forge-section-meta">{{ props.forgePresetItems.length }} 条</span>
          </div>
          <t-select
            v-model="selectedPresetId"
            clearable
            :loading="props.forgePresetLoading"
            :options="quickPresetOptions"
            placeholder="快速预设 · 选择后立即应用"
          />
          <div class="forge-quick-preset-meta">{{ selectedPresetMeta }}</div>
          <div class="forge-mini-action-row">
            <t-button
              theme="primary"
              variant="outline"
              :disabled="props.forgePresetLoading || props.forgePresetImporting || props.forgePresetExporting"
              @click="props.openForgePresetSaveDialog()"
            >
              保存当前参数
            </t-button>
            <t-button
              variant="outline"
              theme="default"
              :disabled="props.forgePresetLoading || props.forgePresetImporting || props.forgePresetExporting"
              @click="props.refreshForgePresetItems"
            >
              刷新预设
            </t-button>
            <t-button
              variant="outline"
              theme="default"
              :disabled="!props.state.hostForgePresetIO || props.forgePresetLoading || props.forgePresetImporting || props.forgePresetExporting"
              :loading="props.forgePresetImporting"
              @click="props.importForgePresetItems(false)"
            >
              导入合并
            </t-button>
            <t-button
              variant="outline"
              theme="warning"
              :disabled="!props.state.hostForgePresetIO || props.forgePresetLoading || props.forgePresetImporting || props.forgePresetExporting"
              :loading="props.forgePresetImporting"
              @click="props.importForgePresetItems(true)"
            >
              导入替换
            </t-button>
            <t-button
              variant="outline"
              theme="default"
              :disabled="!props.state.hostForgePresetIO || props.forgePresetLoading || props.forgePresetImporting || props.forgePresetExporting"
              :loading="props.forgePresetExporting"
              @click="props.exportForgePresetItems"
            >
              导出
            </t-button>
          </div>
        </section>

        <section class="forge-section">
          <div class="forge-section-head">
            <span class="forge-section-title">提示词区</span>
          </div>
          <div class="forge-prompt-field">
            <label class="forge-field-label">正向提示词</label>
            <t-textarea
              v-model="props.forgeForm.prompt"
              :maxlength="5000"
              :autosize="{ minRows: 4, maxRows: 8 }"
              placeholder="输入 Forge 正向提示词..."
            />
          </div>
          <div class="forge-prompt-field">
            <label class="forge-field-label">反向提示词</label>
            <t-textarea
              v-model="props.forgeForm.negativePrompt"
              :maxlength="5000"
              :autosize="{ minRows: 2, maxRows: 6 }"
              placeholder="输入 Forge 反向提示词..."
            />
          </div>
          <div v-if="props.state.hostYoudaoTranslate" class="forge-translate-row">
            <t-input
              v-model.trim="forgeTranslateInput"
              clearable
              placeholder="输入中文，翻译后追加到提示词"
            />
            <t-button
              variant="outline"
              theme="default"
              :loading="forgeTranslating"
              @click="handleTranslateFill"
            >
              翻译
            </t-button>
            <t-button
              theme="primary"
              :disabled="forgeTranslating"
              @click="appendTranslatedPrompt('positive')"
            >
              + 正向
            </t-button>
            <t-button
              variant="outline"
              theme="default"
              :disabled="forgeTranslating"
              @click="appendTranslatedPrompt('negative')"
            >
              + 反向
            </t-button>
          </div>
          <div class="forge-mode-row">
            <button
              type="button"
              class="forge-mode-chip"
              :class="{ 'is-active': props.forgeForm.mode === 'img2img' }"
              @click="props.forgeForm.mode = 'img2img'"
            >
              img2img（需要选区）
            </button>
            <button
              type="button"
              class="forge-mode-chip"
              :class="{ 'is-active': props.forgeForm.mode === 'txt2img' }"
              @click="props.forgeForm.mode = 'txt2img'"
            >
              txt2img（无需选区）
            </button>
          </div>
        </section>

        <section class="forge-section">
          <div class="forge-section-head">
            <span class="forge-section-title">参数面板</span>
            <t-button
              variant="outline"
              theme="default"
              size="small"
              :loading="props.forgeLoadingMeta"
              :disabled="!forgeRuntimeConnected || props.forgeConnecting"
              @click="props.refreshForgeMetaOptions"
            >
              刷新参数
            </t-button>
          </div>

          <div class="forge-compact-row forge-compact-row-single">
            <div class="param-item">
              <span class="param-item-label">模型</span>
              <t-select
                v-model="props.forgeForm.model"
                clearable
                :options="props.forgeModelOptions"
                placeholder="-- 加载中 --"
              />
            </div>
          </div>

          <div class="forge-compact-row forge-compact-row-sampler">
            <div class="param-item">
              <span class="param-item-label">采样器</span>
              <t-select
                v-model="props.forgeForm.sampler"
                clearable
                :options="props.forgeSamplerOptions"
                placeholder="-- 加载中 --"
              />
            </div>
            <div class="param-item">
              <span class="param-item-label">调度器</span>
              <t-select
                v-model="props.forgeForm.scheduler"
                :options="forgeSchedulerOptions"
                placeholder="Automatic"
              />
            </div>
          </div>

          <div class="forge-compact-row forge-compact-row-four">
            <div class="param-item">
              <span class="param-item-label">步数</span>
              <t-input-number v-model="props.forgeForm.steps" :min="1" :max="150" />
            </div>
            <div class="param-item">
              <span class="param-item-label">CFG</span>
              <t-input-number v-model="props.forgeForm.cfgScale" :min="1" :max="30" :step="0.5" />
            </div>
            <div class="param-item">
              <span class="param-item-label">重绘幅度</span>
              <t-input-number v-model="props.forgeForm.denoise" :min="0" :max="1" :step="0.05" />
            </div>
            <div class="param-item">
              <span class="param-item-label">数量</span>
              <t-input-number v-model="props.forgeForm.batchSize" :min="1" :max="8" />
            </div>
          </div>

          <div class="forge-compact-row forge-compact-row-three">
            <div class="param-item">
              <span class="param-item-label">宽度</span>
              <t-input-number v-model="props.forgeForm.width" :min="64" :max="4096" />
            </div>
            <div class="param-item">
              <span class="param-item-label">高度</span>
              <t-input-number v-model="props.forgeForm.height" :min="64" :max="4096" />
            </div>
            <div class="param-item">
              <span class="param-item-label">种子</span>
              <t-input-number v-model="props.forgeForm.seed" :min="-1" :max="2147483647" />
            </div>
          </div>

          <div class="forge-param-tip">
            如果宽高和选区尺寸不一致，当前参数会直接发送给 Forge。
          </div>
        </section>

        <section class="forge-section">
          <div class="forge-section-head">
            <span class="forge-section-title">LoRA + ControlNet</span>
            <t-switch v-model="props.forgeForm.controlNetEnabled" size="small" />
          </div>

          <div class="forge-compact-row forge-compact-row-lora">
            <div class="param-item">
              <span class="param-item-label">LoRA</span>
              <t-select
                v-model="props.forgeForm.lora"
                clearable
                :options="props.forgeLoraOptions"
                placeholder="无"
              />
            </div>
            <div class="param-item">
              <span class="param-item-label">LoRA 权重</span>
              <t-input-number v-model="props.forgeForm.loraWeight" :min="-3" :max="3" :step="0.1" />
            </div>
            <t-button
              variant="outline"
              theme="default"
              class="forge-square-action"
              :loading="props.forgeLoadingMeta"
              :disabled="!forgeRuntimeConnected || props.forgeConnecting"
              @click="props.refreshForgeMetaOptions"
            >
              刷新
            </t-button>
          </div>

          <div class="forge-compact-row forge-compact-row-cn">
            <div class="param-item">
              <span class="param-item-label">CN 预处理器</span>
              <t-select
                v-model="props.forgeForm.controlNetModule"
                :disabled="!props.forgeForm.controlNetEnabled"
                :options="props.forgeCnModuleOptions"
              />
            </div>
            <div class="param-item">
              <span class="param-item-label">CN 模型</span>
              <t-select
                v-model="props.forgeForm.controlNetModel"
                :disabled="!props.forgeForm.controlNetEnabled"
                :options="props.forgeCnModelOptions"
              />
            </div>
            <div class="param-item">
              <span class="param-item-label">CN 强度</span>
              <t-input-number
                v-model="props.forgeForm.controlNetWeight"
                :disabled="!props.forgeForm.controlNetEnabled"
                :min="0"
                :max="2"
                :step="0.05"
              />
            </div>
          </div>
        </section>

        <section class="forge-section">
          <div class="forge-compact-row forge-compact-row-single">
            <div class="param-item">
              <span class="param-item-label">导出压缩（长边）</span>
              <t-input-number v-model="props.forgeForm.maxResolution" :min="512" :max="4096" />
            </div>
            <div class="param-item">
              <span class="param-item-label">超时（秒）</span>
              <t-input-number v-model="props.forgeForm.timeoutSeconds" :min="8" :max="600" />
            </div>
          </div>
        </section>

        <section class="forge-sticky-actionbar">
          <div class="forge-action-main">
            <t-button
              theme="primary"
              size="large"
              class="forge-generate-btn"
              :loading="props.forgeRunning"
              :disabled="props.forgeConnecting || !forgeRuntimeConnected"
              @click="props.runForgeGenerate"
            >
              {{ generateButtonText }}
            </t-button>
            <t-button
              variant="outline"
              theme="warning"
              class="forge-stop-btn"
              :disabled="!props.forgeRunning"
              @click="props.interruptForgeGenerate"
            >
              中断
            </t-button>
          </div>
          <div class="forge-action-footnote">
            {{
              props.forgeRunning
                ? "Forge 正在执行，请勿重复提交。"
                : "本地 Forge 需要手动连接；云 Forge 接通后会优先走云端链路。"
            }}
          </div>
        </section>

        <t-dialog
          :visible="props.forgeCloudAuthVisible"
          header="云 Forge 登录"
          dialog-class-name="forge-cloud-dialog"
          width="420px"
          placement="center"
          :close-on-overlay-click="!props.forgeCloudAuthSubmitting"
          :close-on-esc-keydown="!props.forgeCloudAuthSubmitting"
          @update:visible="props.setForgeCloudAuthVisible"
        >
          <div class="forge-cloud-dialog-body">
            <section class="field-block">
              <label>邮箱</label>
              <t-input
                v-model.trim="props.forgeCloudAuthForm.email"
                clearable
                placeholder="请输入邮箱"
              />
            </section>
            <section class="field-block">
              <label>密码</label>
              <t-input
                v-model="props.forgeCloudAuthForm.password"
                type="password"
                clearable
                placeholder="请输入密码"
              />
            </section>
            <label class="forge-cloud-remember">
              <t-switch v-model="props.forgeCloudAuthForm.remember" size="small" />
              <span>记住密码</span>
            </label>
          </div>
          <template #footer>
            <div class="forge-cloud-dialog-footer">
              <t-button
                variant="outline"
                theme="default"
                :disabled="props.forgeCloudAuthSubmitting"
                @click="closeCloudAuth"
              >
                取消
              </t-button>
              <t-button
                theme="primary"
                :loading="props.forgeCloudAuthSubmitting"
                @click="props.loginForgeCloud"
              >
                登录
              </t-button>
            </div>
          </template>
        </t-dialog>
      </template>
    </div>
  </div>
</template>

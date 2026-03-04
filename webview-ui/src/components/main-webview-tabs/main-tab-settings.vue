<script setup lang="ts">
import {onBeforeUnmount, ref, watch} from "vue";
import CollapsiblePanelCard from "./collapsible-panel-card.vue";

const props = defineProps<{
  themePresetOptions: any[];
  managedApiKeys: any[];
  aiChatBaseUrl: string;
  aiChatApiKeySaving: boolean;
  aiChatJsonSaveSupported: boolean;
  aiChatUserAvatarDataUrl: string;
  pluginBackgroundImageDataUrl: string;
  form: any;
  globalForm: any;
  sizeOptions: any[];
  state: any;
  runGlobalPartitionDisabled: boolean;
  globalPartitionResult: any | null;
  createManagedApiKey: () => void;
  updateManagedApiKey: () => void;
  deleteManagedApiKey: () => void;
  clearSavedApiKeys: () => void;
  onSaveAiChatApiKeyClick: () => void;
  openAiChatAvatarPicker: () => void;
  clearAiChatUserAvatar: () => void;
  setAiChatAvatarInputRef: (el: HTMLInputElement | null) => void;
  onAiChatAvatarChange: (event: Event) => void;
  openPluginBackgroundPicker: () => void;
  clearPluginBackground: () => void;
  setPluginBackgroundInputRef: (el: HTMLInputElement | null) => void;
  onPluginBackgroundChange: (event: Event) => void;
  captureSingleRunShortcut: (event: KeyboardEvent) => void;
  resetSingleRunShortcut: () => void;
  captureAiChatSendShortcut: (event: KeyboardEvent) => void;
  resetAiChatSendShortcut: () => void;
  captureMainTabPrevShortcut: (event: KeyboardEvent) => void;
  captureMainTabNextShortcut: (event: KeyboardEvent) => void;
  captureInputPrevShortcut: (event: KeyboardEvent) => void;
  captureInputNextShortcut: (event: KeyboardEvent) => void;
  resetMainTabPrevShortcut: () => void;
  resetMainTabNextShortcut: () => void;
  resetInputPrevShortcut: () => void;
  resetInputNextShortcut: () => void;
  confirmFeatureCode: (code: string) => boolean;
  setMaxResolutionPreset: (value: number) => void;
  runGlobalPartition: () => void;
}>();

const themePreset = defineModel<string>("themePreset", {required: true});
const singleRunShortcut = defineModel<string>("singleRunShortcut", {required: true});
const aiChatSendShortcut = defineModel<string>("aiChatSendShortcut", {required: true});
const mainTabPrevShortcut = defineModel<string>("mainTabPrevShortcut", {required: true});
const mainTabNextShortcut = defineModel<string>("mainTabNextShortcut", {required: true});
const inputPrevShortcut = defineModel<string>("inputPrevShortcut", {required: true});
const inputNextShortcut = defineModel<string>("inputNextShortcut", {required: true});
const apiKeyManageSelected = defineModel<string>("apiKeyManageSelected", {required: true});
const apiKeyManageDraft = defineModel<string>("apiKeyManageDraft", {required: true});
const aiChatApiKey = defineModel<string>("aiChatApiKey", {required: true});
const pluginBackgroundOpacity = defineModel<number>("pluginBackgroundOpacity", {required: true});
const pluginBackgroundPanelOpacity = defineModel<number>("pluginBackgroundPanelOpacity", {required: true});
const pluginBackgroundBlur = defineModel<number>("pluginBackgroundBlur", {required: true});

const DEFAULT_SINGLE_RUN_SHORTCUT = "Ctrl+Alt+Enter";
const DEFAULT_AI_CHAT_SEND_SHORTCUT = "Alt+Enter";
const DEFAULT_MAIN_TAB_PREV_SHORTCUT = "ArrowLeft";
const DEFAULT_MAIN_TAB_NEXT_SHORTCUT = "ArrowRight";
const DEFAULT_INPUT_PREV_SHORTCUT = "ArrowUp";
const DEFAULT_INPUT_NEXT_SHORTCUT = "ArrowDown";

type ShortcutRecordTarget = "singleRun" | "aiChatSend" | "mainTabPrev" | "mainTabNext" | "inputPrev" | "inputNext";
const shortcutRecordTarget = ref<ShortcutRecordTarget | "">("");
const featureCodeInput = ref("");
let shortcutRecordTimer: number | null = null;

const isShortcutRecording = (target: ShortcutRecordTarget) => shortcutRecordTarget.value === target;

const toggleShortcutRecording = (target: ShortcutRecordTarget) => {
  shortcutRecordTarget.value = shortcutRecordTarget.value === target ? "" : target;
};

const onSingleRunShortcutRecordKeydown = (event: KeyboardEvent) => {
  event.preventDefault();
  event.stopPropagation();
  switch (shortcutRecordTarget.value) {
    case "singleRun":
      props.captureSingleRunShortcut(event);
      break;
    case "aiChatSend":
      props.captureAiChatSendShortcut(event);
      break;
    case "mainTabPrev":
      props.captureMainTabPrevShortcut(event);
      break;
    case "mainTabNext":
      props.captureMainTabNextShortcut(event);
      break;
    case "inputPrev":
      props.captureInputPrevShortcut(event);
      break;
    case "inputNext":
      props.captureInputNextShortcut(event);
      break;
    default:
      return;
  }

  const key = String(event.key || "").toLowerCase();
  if (!["control", "shift", "alt", "meta"].includes(key)) {
    shortcutRecordTarget.value = "";
  }
};

const onConfirmFeatureCode = () => {
  const success = props.confirmFeatureCode(featureCodeInput.value);
  if (success) featureCodeInput.value = "";
};

watch(shortcutRecordTarget, (value) => {
  if (value) {
    if (shortcutRecordTimer) {
      window.clearTimeout(shortcutRecordTimer);
      shortcutRecordTimer = null;
    }
    window.addEventListener("keydown", onSingleRunShortcutRecordKeydown, true);
    shortcutRecordTimer = window.setTimeout(() => {
      shortcutRecordTarget.value = "";
    }, 10000);
    return;
  }
  if (shortcutRecordTimer) {
    window.clearTimeout(shortcutRecordTimer);
    shortcutRecordTimer = null;
  }
  window.removeEventListener("keydown", onSingleRunShortcutRecordKeydown, true);
});

onBeforeUnmount(() => {
  if (shortcutRecordTimer) {
    window.clearTimeout(shortcutRecordTimer);
    shortcutRecordTimer = null;
  }
  window.removeEventListener("keydown", onSingleRunShortcutRecordKeydown, true);
});
</script>

<template>
  <div class="tab-pane-body tab-pane-settings">
    <CollapsiblePanelCard class="panel-card settings-theme-card">
      <section class="field-block">
        <label>界面主题</label>
        <t-select
          v-model="themePreset"
          class="settings-theme-select"
          :options="props.themePresetOptions"
          placeholder="请选择主题颜色"
        />
        <div class="settings-hint">切换后立即生效，并自动保存到本地配置。</div>
      </section>
    </CollapsiblePanelCard>

    <CollapsiblePanelCard class="panel-card settings-mini-card">
      <section class="field-block">
        <label>背景图片</label>
        <div v-if="props.pluginBackgroundImageDataUrl" class="plugin-bg-preview">
          <img :src="props.pluginBackgroundImageDataUrl" alt="plugin background"/>
        </div>
        <div class="settings-inline-actions">
          <t-button size="small" variant="outline" theme="default" @click="props.openPluginBackgroundPicker">
            上传背景
          </t-button>
          <t-button
            size="small"
            variant="outline"
            theme="default"
            :disabled="!props.pluginBackgroundImageDataUrl"
            @click="props.clearPluginBackground"
          >
            清除背景
          </t-button>
        </div>
        <input
          :ref="props.setPluginBackgroundInputRef"
          class="plugin-bg-input"
          type="file"
          accept="image/*"
          @change="props.onPluginBackgroundChange"
        />
      </section>
      <section class="field-block">
        <label>背景图透明度 {{ pluginBackgroundOpacity }}%</label>
        <input v-model.number="pluginBackgroundOpacity" type="range" min="0" max="100" step="1" class="plugin-bg-opacity-range"/>
      </section>
      <section class="field-block">
        <label>面板不透明度 {{ pluginBackgroundPanelOpacity }}%</label>
        <input
          v-model.number="pluginBackgroundPanelOpacity"
          type="range"
          min="0"
          max="100"
          step="1"
          class="plugin-bg-opacity-range"
        />
      </section>
      <section class="field-block">
        <label>高斯模糊 {{ pluginBackgroundBlur }}px</label>
        <input
          v-model.number="pluginBackgroundBlur"
          type="range"
          min="0"
          max="30"
          step="1"
          class="plugin-bg-opacity-range"
        />
      </section>
    </CollapsiblePanelCard>

    <CollapsiblePanelCard class="panel-card settings-mini-card">
      <section class="field-block settings-shortcut-item">
        <label>单图开始生成（仅“图像工作台”页）</label>
        <t-input
          v-model="singleRunShortcut"
          readonly
          placeholder="点击“开始录制”后按下快捷键组合"
        />
        <div class="settings-inline-actions">
          <t-button
            size="small"
            :theme="isShortcutRecording('singleRun') ? 'warning' : 'primary'"
            :variant="isShortcutRecording('singleRun') ? 'base' : 'outline'"
            @click="toggleShortcutRecording('singleRun')"
          >
            {{ isShortcutRecording("singleRun") ? "停止录制" : "开始录制" }}
          </t-button>
          <t-button size="small" variant="outline" theme="default" @click="props.resetSingleRunShortcut">
            恢复默认 {{ DEFAULT_SINGLE_RUN_SHORTCUT }}
          </t-button>
        </div>
      </section>
      <section class="field-block settings-shortcut-item">
        <label>发送消息（仅“与AI对话”页）</label>
        <t-input
          v-model="aiChatSendShortcut"
          readonly
          placeholder="点击“开始录制”后按下快捷键组合"
        />
        <div class="settings-inline-actions">
          <t-button
            size="small"
            :theme="isShortcutRecording('aiChatSend') ? 'warning' : 'primary'"
            :variant="isShortcutRecording('aiChatSend') ? 'base' : 'outline'"
            @click="toggleShortcutRecording('aiChatSend')"
          >
            {{ isShortcutRecording("aiChatSend") ? "停止录制" : "开始录制" }}
          </t-button>
          <t-button size="small" variant="outline" theme="default" @click="props.resetAiChatSendShortcut">
            恢复默认 {{ DEFAULT_AI_CHAT_SEND_SHORTCUT }}
          </t-button>
        </div>
      </section>
      <div class="settings-hint">
        {{
          shortcutRecordTarget
            ? "正在录制：请按下组合键..."
            : "仅展示触发点击动作的快捷键。"
        }}
      </div>
    </CollapsiblePanelCard>

    <CollapsiblePanelCard class="panel-card settings-mini-card">
      <section class="field-block">
        <label>输入功能码</label>
        <t-input
          v-model.trim="featureCodeInput"
          placeholder="请输入功能码"
        />
      </section>
      <div class="settings-inline-actions">
        <t-button size="small" theme="primary" @click="onConfirmFeatureCode">
          确定
        </t-button>
      </div>
    </CollapsiblePanelCard>

    <CollapsiblePanelCard class="panel-card settings-mini-card">
      <section class="field-block">
        <label>已保存名称（点击可填充）</label>
        <div v-if="props.managedApiKeys.length === 0" class="settings-hint">暂无大香蕉Key名称</div>
        <div v-else class="api-key-name-list">
          <button
            v-for="item in props.managedApiKeys"
            :key="item.name"
            type="button"
            class="api-key-name-item"
            :class="{ 'is-active': apiKeyManageSelected === item.name }"
            @click="apiKeyManageSelected = item.name"
          >
            {{ item.name }}
          </button>
        </div>
      </section>
      <section class="field-block">
        <label>新增 / 更新大香蕉Key</label>
        <t-input
          v-model.trim="apiKeyManageDraft"
          class="manage-api-key-password-input"
          type="password"
          placeholder="输入新增或更新的大香蕉Key"
        />
      </section>
      <div class="settings-inline-actions">
        <t-button size="medium" theme="primary" @click="props.createManagedApiKey">
          新增
        </t-button>
        <t-button size="medium" variant="outline" theme="warning" @click="props.updateManagedApiKey">
          更新选中
        </t-button>
        <t-button size="medium" variant="outline" theme="danger" @click="props.deleteManagedApiKey">
          删除选中
        </t-button>
        <t-button size="medium" variant="outline" theme="danger" @click="props.clearSavedApiKeys">
          清空全部
        </t-button>
      </div>
      <div class="settings-hint api-key-manage-hint">页面仅展示名称，内部使用真实大香蕉Key值。</div>
    </CollapsiblePanelCard>

    <CollapsiblePanelCard class="panel-card settings-mini-card">
      <section class="field-block">
        <label>AI对话 Key（comfly）</label>
        <div class="ai-chat-api-key-row settings-inline-actions">
          <t-input
            v-model.trim="aiChatApiKey"
            class="ai-chat-api-key-input"
            type="password"
            placeholder="请输入 AI对话 Key"
          />
          <t-button
            size="small"
            variant="outline"
            theme="default"
            :loading="props.aiChatApiKeySaving"
            :disabled="!aiChatApiKey.trim() || !props.aiChatJsonSaveSupported"
            @click.stop.prevent="props.onSaveAiChatApiKeyClick"
          >
            {{ props.aiChatApiKeySaving ? "保存中..." : "保存" }}
          </t-button>
        </div>
      </section>
      <section class="field-block">
        <label>用户头像</label>
        <div class="ai-chat-avatar-editor">
          <div class="ai-chat-avatar ai-chat-avatar-user-preview">
            <img v-if="props.aiChatUserAvatarDataUrl" :src="props.aiChatUserAvatarDataUrl" alt="user avatar"/>
            <span v-else>你</span>
          </div>
          <div class="settings-inline-actions ai-chat-avatar-actions">
            <t-button
              size="small"
              variant="outline"
              theme="default"
              @click="props.openAiChatAvatarPicker"
            >
              上传头像
            </t-button>
            <t-button
              size="small"
              variant="outline"
              theme="default"
              :disabled="!props.aiChatUserAvatarDataUrl"
              @click="props.clearAiChatUserAvatar"
            >
              移除头像
            </t-button>
          </div>
        </div>
        <input
          :ref="props.setAiChatAvatarInputRef"
          class="ai-chat-avatar-input"
          type="file"
          accept="image/*"
          @change="props.onAiChatAvatarChange"
        />
      </section>
    </CollapsiblePanelCard>

    <CollapsiblePanelCard class="panel-card settings-mini-card">
      <div class="settings-status-row">
        <span>图层类型：{{ props.form.layerType === "smartObject" ? "智能对象" : "栅格化图层" }}</span>
        <span>压缩长边：{{ props.form.maxResolution }}px</span>
      </div>
      <div class="settings-inline-actions">
        <t-button
          size="small"
          :theme="props.form.maxResolution === 1024 ? 'primary' : 'default'"
          :variant="props.form.maxResolution === 1024 ? 'base' : 'outline'"
          @click="props.setMaxResolutionPreset(1024)"
        >
          1024
        </t-button>
        <t-button
          size="small"
          :theme="props.form.maxResolution === 1536 ? 'primary' : 'default'"
          :variant="props.form.maxResolution === 1536 ? 'base' : 'outline'"
          @click="props.setMaxResolutionPreset(1536)"
        >
          1536
        </t-button>
        <t-button
          size="small"
          :theme="props.form.maxResolution === 2048 ? 'primary' : 'default'"
          :variant="props.form.maxResolution === 2048 ? 'base' : 'outline'"
          @click="props.setMaxResolutionPreset(2048)"
        >
          2048
        </t-button>
        <t-button
          size="small"
          :theme="props.form.maxResolution === 3072 ? 'primary' : 'default'"
          :variant="props.form.maxResolution === 3072 ? 'base' : 'outline'"
          @click="props.setMaxResolutionPreset(3072)"
        >
          3072
        </t-button>
      </div>
    </CollapsiblePanelCard>

    <CollapsiblePanelCard class="panel-card settings-partition-card">
      <section class="field-block field-prompt">
        <label>全局提示词</label>
        <t-textarea
          v-model="props.globalForm.prompt"
          :maxlength="5000"
          :autosize="{ minRows: 3, maxRows: 10 }"
          placeholder="用于所有分区任务的提示词..."
        />
      </section>
      <div class="param-inline-row">
        <div class="param-item">
          <span class="param-item-label">分辨率档位</span>
          <t-select v-model="props.globalForm.size" :options="props.sizeOptions" placeholder="分辨率档位"/>
        </div>
        <div class="param-item">
          <span class="param-item-label">每区数量</span>
          <t-input-number v-model="props.globalForm.batchSize" :min="1" :max="5" theme="normal"/>
        </div>
        <div class="param-item">
          <span class="param-item-label">超时(秒)</span>
          <t-input-number v-model="props.globalForm.timeoutSeconds" :min="5" theme="normal"/>
        </div>
      </div>
      <div class="settings-hint">
        会处理当前所有打开文档：横图取左上+右上，竖图取左上+左下，正方形取整图。
      </div>
      <t-button
        block
        class="global-partition-run-btn"
        theme="primary"
        size="large"
        :loading="props.state.runningGlobalPartition"
        :disabled="props.runGlobalPartitionDisabled"
        @click="props.runGlobalPartition"
      >
        {{ props.state.runningGlobalPartition ? "全局处理中..." : "开始全局分区计算" }}
      </t-button>
    </CollapsiblePanelCard>

    <CollapsiblePanelCard
      v-if="props.globalPartitionResult"
      class="panel-card quota-card settings-result-card"
      :bordered="false"
    >
      <div class="quota-grid settings-result-grid">
        <div class="quota-item">
          <span>文档数</span>
          <strong>{{ props.globalPartitionResult.documentCount }}</strong>
        </div>
        <div class="quota-item">
          <span>总任务</span>
          <strong>{{ props.globalPartitionResult.taskCount }}</strong>
        </div>
        <div class="quota-item">
          <span>成功</span>
          <strong>{{ props.globalPartitionResult.successCount }}</strong>
        </div>
        <div class="quota-item">
          <span>失败</span>
          <strong>{{ props.globalPartitionResult.failureCount }}</strong>
        </div>
      </div>
    </CollapsiblePanelCard>
  </div>
</template>

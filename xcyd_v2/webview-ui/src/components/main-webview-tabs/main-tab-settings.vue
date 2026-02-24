<script setup lang="ts">
import {onBeforeUnmount, ref, watch} from "vue";

const props = defineProps<{
  aiChatModelsBaseUrl: string;
  themePresetOptions: any[];
  managedApiKeys: any[];
  aiChatApiKeySaving: boolean;
  aiChatJsonSaveSupported: boolean;
  aiChatUserAvatarDataUrl: string;
  aiChatModelLoading: boolean;
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
  loadAiChatModels: () => void;
  clearAiChatModels: () => void;
  captureSingleRunShortcut: (event: KeyboardEvent) => void;
  resetSingleRunShortcut: () => void;
  confirmFeatureCode: (code: string) => boolean;
  setMaxResolutionPreset: (value: number) => void;
  runGlobalPartition: () => void;
}>();

const themePreset = defineModel<string>("themePreset", {required: true});
const singleRunShortcut = defineModel<string>("singleRunShortcut", {required: true});
const apiKeyManageSelected = defineModel<string>("apiKeyManageSelected", {required: true});
const apiKeyManageDraft = defineModel<string>("apiKeyManageDraft", {required: true});
const aiChatApiKey = defineModel<string>("aiChatApiKey", {required: true});

const singleRunShortcutRecording = ref(false);
const featureCodeInput = ref("");
let singleRunShortcutRecordTimer: number | null = null;

const onSingleRunShortcutRecordKeydown = (event: KeyboardEvent) => {
  event.preventDefault();
  event.stopPropagation();
  props.captureSingleRunShortcut(event);

  const key = String(event.key || "").toLowerCase();
  if (!["control", "shift", "alt", "meta"].includes(key)) {
    singleRunShortcutRecording.value = false;
  }
};

const toggleSingleRunShortcutRecording = () => {
  singleRunShortcutRecording.value = !singleRunShortcutRecording.value;
};

const onConfirmFeatureCode = () => {
  const success = props.confirmFeatureCode(featureCodeInput.value);
  if (success) featureCodeInput.value = "";
};

watch(singleRunShortcutRecording, (value) => {
  if (value) {
    if (singleRunShortcutRecordTimer) {
      window.clearTimeout(singleRunShortcutRecordTimer);
      singleRunShortcutRecordTimer = null;
    }
    window.addEventListener("keydown", onSingleRunShortcutRecordKeydown, true);
    singleRunShortcutRecordTimer = window.setTimeout(() => {
      singleRunShortcutRecording.value = false;
    }, 10000);
    return;
  }
  if (singleRunShortcutRecordTimer) {
    window.clearTimeout(singleRunShortcutRecordTimer);
    singleRunShortcutRecordTimer = null;
  }
  window.removeEventListener("keydown", onSingleRunShortcutRecordKeydown, true);
});

onBeforeUnmount(() => {
  if (singleRunShortcutRecordTimer) {
    window.clearTimeout(singleRunShortcutRecordTimer);
    singleRunShortcutRecordTimer = null;
  }
  window.removeEventListener("keydown", onSingleRunShortcutRecordKeydown, true);
});
</script>

<template>
  <div class="tab-pane-body tab-pane-settings">
    <div class="settings-page-version">版本号 1.0.0</div>
    <t-card class="panel-card settings-card">
      <div class="settings-section">
        <div class="settings-section-title">界面主题</div>
        <section class="field-block">
          <label>主题颜色</label>
          <t-select
            v-model="themePreset"
            :options="props.themePresetOptions"
            placeholder="请选择主题颜色"
          />
        </section>
        <div class="settings-hint">切换后立即生效，并自动保存到本地配置。</div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">快捷键</div>
        <section class="field-block">
          <label>单图开始生成</label>
          <t-input
            v-model="singleRunShortcut"
            readonly
            placeholder="点击“开始录制”后按下快捷键组合"
          />
        </section>
        <div class="settings-inline-actions">
          <t-button
            size="small"
            :theme="singleRunShortcutRecording ? 'warning' : 'primary'"
            :variant="singleRunShortcutRecording ? 'base' : 'outline'"
            @click="toggleSingleRunShortcutRecording"
          >
            {{ singleRunShortcutRecording ? "停止录制" : "开始录制" }}
          </t-button>
          <t-button size="small" variant="outline" theme="default" @click="props.resetSingleRunShortcut">
            恢复默认 Ctrl+Alt+Enter
          </t-button>
        </div>
        <div class="settings-hint">
          {{ singleRunShortcutRecording ? "正在录制：请按下组合键..." : "仅在“单图处理”页面生效。" }}
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">功能码</div>
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
        <div class="settings-hint">
          输入功能码可以使用定制化功能
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">大香蕉Key管理</div>
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
      </div>

      <div class="settings-section ai-chat-section">
        <div class="settings-section-title">AI对话 Key管理</div>
        <div class="settings-hint">
          接口地址：{{ props.aiChatModelsBaseUrl }}
        </div>
        <section class="field-block">
          <label>AI对话 Key</label>
          <div class="ai-chat-api-key-row settings-inline-actions">
            <t-input
              v-model.trim="aiChatApiKey"
              class="ai-chat-api-key-input"
              type="password"
              placeholder="请输入 AI对话 的Key"
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
        <div class="settings-inline-actions">
          <t-button
            theme="primary"
            :loading="props.aiChatModelLoading"
            @click="props.loadAiChatModels"
          >
            {{ props.aiChatModelLoading ? "加载中..." : "获取模型列表" }}
          </t-button>
          <t-button
            variant="outline"
            theme="default"
            :disabled="props.aiChatModelLoading"
            @click="props.clearAiChatModels"
          >
            清空结果
          </t-button>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">图层与压缩快捷设置</div>
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
      </div>
    </t-card>

    <t-card class="panel-card settings-card">
      <div class="settings-section">
        <div class="settings-section-title">全局分区计算</div>
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
      </div>
    </t-card>

    <t-card
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
    </t-card>
  </div>
</template>


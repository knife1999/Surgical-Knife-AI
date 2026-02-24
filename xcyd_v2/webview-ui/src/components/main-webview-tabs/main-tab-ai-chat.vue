<script setup lang="ts">
import {reactive, ref} from "vue";

const props = defineProps<{
  state: any;
  aiChatModelLoading: boolean;
  aiChatModelSelectOptions: any[];
  aiChatModels: any[];
  aiChatLastFetchAt: string;
  aiChatMessages: any[];
  aiChatUserAvatarDataUrl: string;
  aiChatPendingImages: any[];
  aiChatSending: boolean;
  aiChatUploadingCurrentImage: boolean;
  aiChatSendDisabled: boolean;
  aiChatUseJsonDisabled: boolean;
  formatAiChatTime: (time: number) => string;
  handleAiChatCopyCode: (code: string) => void;
  setAiChatMessagesRef: (el: HTMLDivElement | null) => void;
  setAiChatUploadInputRef: (el: HTMLInputElement | null) => void;
  onAiChatFilesChange: (event: Event) => void;
  removeAiChatPendingImage: (id: number) => void;
  openAiChatImagePicker: () => void;
  uploadAiChatCurrentSelectionImage: () => void;
  sendAiChatMessage: () => void;
  clearAiChatConversation: () => void;
  applyAiChatLastJsonToSinglePrompt: () => void;
}>();

const aiChatSelectedModel = defineModel<string>("aiChatSelectedModel", {required: true});
const aiChatInputText = defineModel<string>("aiChatInputText", {required: true});
const aiChatContextCount = defineModel<number>("aiChatContextCount", {required: true});
const aiChatMaxTokens = defineModel<number>("aiChatMaxTokens", {required: true});
const aiChatSystemPrompt = defineModel<string>("aiChatSystemPrompt", {required: true});
const aiChatTemperature = defineModel<number>("aiChatTemperature", {required: true});
const aiChatTopP = defineModel<number>("aiChatTopP", {required: true});
const aiChatPresencePenalty = defineModel<number>("aiChatPresencePenalty", {required: true});
const aiChatFrequencyPenalty = defineModel<number>("aiChatFrequencyPenalty", {required: true});
const aiChatJsonModeEnabled = defineModel<boolean>("aiChatJsonModeEnabled", {required: true});

const aiChatParamDialogVisible = ref(false);
const aiChatParamAdvancedVisible = ref(false);

const aiChatParamDraft = reactive({
  contextCount: 12,
  maxTokens: 4096,
  systemPrompt: "",
  temperature: 0.7,
  topP: 1,
  presencePenalty: 0,
  frequencyPenalty: 0,
});

const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
};

const syncAiChatParamDraftFromModels = () => {
  aiChatParamDraft.contextCount = Math.round(clampNumber(aiChatContextCount.value, 1, 30, 12));
  aiChatParamDraft.maxTokens = Math.round(clampNumber(aiChatMaxTokens.value, 1, 32000, 4096));
  aiChatParamDraft.systemPrompt = String(aiChatSystemPrompt.value ?? "");
  aiChatParamDraft.temperature = clampNumber(aiChatTemperature.value, 0, 2, 0.7);
  aiChatParamDraft.topP = clampNumber(aiChatTopP.value, 0, 1, 1);
  aiChatParamDraft.presencePenalty = clampNumber(aiChatPresencePenalty.value, -2, 2, 0);
  aiChatParamDraft.frequencyPenalty = clampNumber(aiChatFrequencyPenalty.value, -2, 2, 0);
};

const openAiChatParamDialog = () => {
  if (!aiChatSelectedModel.value) return;
  syncAiChatParamDraftFromModels();
  aiChatParamDialogVisible.value = true;
};

const resetAiChatParamDraft = () => {
  aiChatParamDraft.contextCount = 12;
  aiChatParamDraft.maxTokens = 4096;
  aiChatParamDraft.systemPrompt = "";
  aiChatParamDraft.temperature = 0.7;
  aiChatParamDraft.topP = 1;
  aiChatParamDraft.presencePenalty = 0;
  aiChatParamDraft.frequencyPenalty = 0;
};

const saveAiChatParamDraft = () => {
  aiChatContextCount.value = Math.round(clampNumber(aiChatParamDraft.contextCount, 1, 30, 12));
  aiChatMaxTokens.value = Math.round(clampNumber(aiChatParamDraft.maxTokens, 1, 32000, 4096));
  aiChatSystemPrompt.value = String(aiChatParamDraft.systemPrompt ?? "").trim();
  aiChatTemperature.value = clampNumber(aiChatParamDraft.temperature, 0, 2, 0.7);
  aiChatTopP.value = clampNumber(aiChatParamDraft.topP, 0, 1, 1);
  aiChatPresencePenalty.value = clampNumber(aiChatParamDraft.presencePenalty, -2, 2, 0);
  aiChatFrequencyPenalty.value = clampNumber(aiChatParamDraft.frequencyPenalty, -2, 2, 0);
  aiChatParamDialogVisible.value = false;
};

const formatParamValue = (value: number, digits = 2) => {
  const text = Number(value).toFixed(digits);
  return text.replace(/\.00$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
};
</script>

<template>
  <div class="tab-pane-body tab-pane-ai-chat">
    <t-card class="panel-card ai-chat-card">
      <div class="settings-section ai-chat-section">
        <div class="settings-section-title">模型筛选</div>
        <section class="field-block">
          <t-select
            v-model="aiChatSelectedModel"
            class="ai-chat-model-select"
            clearable
            filterable
            :loading="props.aiChatModelLoading"
            :options="props.aiChatModelSelectOptions"
            placeholder="在设置中配置对话ai的key"
          />
        </section>
        <div class="ai-chat-meta-row">
          <span>总数 {{ props.aiChatModels.length }}</span>
          <span v-if="props.aiChatLastFetchAt">刷新 {{ props.aiChatLastFetchAt }}</span>
        </div>
        <button
          v-if="aiChatSelectedModel"
          type="button"
          class="ai-chat-selected-model ai-chat-selected-model-btn"
          @click="openAiChatParamDialog"
        >
          已选模型：{{ aiChatSelectedModel }}
        </button>
      </div>
    </t-card>

    <t-card class="panel-card ai-chat-card ai-chat-conversation-card">
      <div class="settings-section ai-chat-section ai-chat-dialog-section">
        <div class="settings-section-title">对话</div>

        <div :ref="props.setAiChatMessagesRef" class="ai-chat-messages">
          <div v-if="props.aiChatMessages.length === 0" class="batch-empty">
            请输入文本或上传图片后发送消息。
          </div>
          <div
            v-for="message in props.aiChatMessages"
            :key="message.id"
            class="ai-chat-message-row"
            :class="message.role === 'user' ? 'is-user' : 'is-assistant'"
          >
            <div class="ai-chat-avatar" :class="message.role === 'user' ? 'is-user' : 'is-assistant'">
              <img
                v-if="message.role === 'user' && props.aiChatUserAvatarDataUrl"
                :src="props.aiChatUserAvatarDataUrl"
                alt="user avatar"
              />
              <span v-else-if="message.role === 'user'">你</span>
              <svg
                v-else
                class="ai-chat-ai-icon"
                viewBox="0 0 32 32"
                aria-hidden="true"
              >
                <path d="M29.71,13.09A8.09,8.09,0,0,0,20.34,2.68a8.08,8.08,0,0,0-13.7,2.9A8.08,8.08,0,0,0,2.3,18.9,8,8,0,0,0,3,25.45a8.08,8.08,0,0,0,8.69,3.87,8,8,0,0,0,6,2.68,8.09,8.09,0,0,0,7.7-5.61,8,8,0,0,0,5.33-3.86A8.09,8.09,0,0,0,29.71,13.09Zm-12,16.82a6,6,0,0,1-3.84-1.39l.19-.11,6.37-3.68a1,1,0,0,0,.53-.91v-9l2.69,1.56a.08.08,0,0,1,.05.07v7.44A6,6,0,0,1,17.68,29.91ZM4.8,24.41a6,6,0,0,1-.71-4l.19.11,6.37,3.68a1,1,0,0,0,1,0l7.79-4.49V22.8a.09.09,0,0,1,0,.08L13,26.6A6,6,0,0,1,4.8,24.41ZM3.12,10.53A6,6,0,0,1,6.28,7.9v7.57a1,1,0,0,0,.51.9l7.75,4.47L11.85,22.4a.14.14,0,0,1-.09,0L5.32,18.68a6,6,0,0,1-2.2-8.18Zm22.13,5.14-7.78-4.52L20.16,9.6a.08.08,0,0,1,.09,0l6.44,3.72a6,6,0,0,1-.9,10.81V16.56A1.06,1.06,0,0,0,25.25,15.67Zm2.68-4-.19-.12-6.36-3.7a1,1,0,0,0-1.05,0l-7.78,4.49V9.2a.09.09,0,0,1,0-.09L19,5.4a6,6,0,0,1,8.91,6.21ZM11.08,17.15,8.38,15.6a.14.14,0,0,1-.05-.08V8.1a6,6,0,0,1,9.84-4.61L18,3.6,11.61,7.28a1,1,0,0,0-.53.91ZM12.54,14,16,12l3.47,2v4L16,20l-3.47-2Z" fill="currentColor"></path>
              </svg>
            </div>

            <div class="ai-chat-bubble">
              <div class="ai-chat-message-head">
                <span class="ai-chat-role-name">{{ message.role === "user" ? "你" : "AI 助手" }}</span>
                <span class="ai-chat-message-time">{{ props.formatAiChatTime(message.createdAt) }}</span>
              </div>

              <div v-if="message.images.length > 0" class="ai-chat-image-grid">
                <div v-for="image in message.images" :key="image.id" class="ai-chat-image-item">
                  <img :src="image.dataUrl" :alt="image.name"/>
                  <span class="ai-chat-image-name">{{ image.name }}</span>
                </div>
              </div>

              <div class="ai-chat-message-body">
                <template v-for="segment in message.segments" :key="segment.id">
                  <div
                    v-if="segment.type === 'text'"
                    class="ai-chat-markdown"
                    v-html="segment.html"
                  />
                  <div v-else class="ai-chat-code-block">
                    <div class="ai-chat-code-head">
                      <span>{{ segment.language || "code" }}</span>
                      <t-button
                        size="small"
                        variant="outline"
                        theme="default"
                        @click="props.handleAiChatCopyCode(segment.code || '')"
                      >
                        复制
                      </t-button>
                    </div>
                    <pre><code>{{ segment.code }}</code></pre>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <input
          :ref="props.setAiChatUploadInputRef"
          class="ai-chat-upload-input"
          type="file"
          accept="image/*"
          multiple
          @change="props.onAiChatFilesChange"
        />

        <section class="field-block">
          <label>输入内容</label>
          <t-textarea
            v-model="aiChatInputText"
            class="ai-chat-input-textarea"
            :maxlength="8000"
            :autosize="{ minRows: 3, maxRows: 10 }"
            placeholder="请输入问题，可搭配图片一起发送..."
          />
        </section>

        <div v-if="props.aiChatPendingImages.length > 0" class="ai-chat-pending-list">
          <div v-for="item in props.aiChatPendingImages" :key="item.id" class="ai-chat-pending-item">
            <img :src="item.dataUrl" :alt="item.name"/>
            <span>{{ item.name }}</span>
            <t-button
              size="small"
              variant="text"
              theme="danger"
              @click="props.removeAiChatPendingImage(item.id)"
            >
              移除
            </t-button>
          </div>
        </div>

        <div class="settings-inline-actions ai-chat-action-row">
          <t-tooltip content="将自然语言转换成 json语言" placement="top">
            <span class="ai-chat-json-tooltip">
              <t-checkbox v-model="aiChatJsonModeEnabled" class="ai-chat-json-checkbox">转json</t-checkbox>
            </span>
          </t-tooltip>
          <t-button
            variant="outline"
            theme="default"
            :disabled="props.aiChatSending"
            @click="props.openAiChatImagePicker"
          >
            上传图片
          </t-button>
          <t-button
            variant="outline"
            theme="default"
            :loading="props.aiChatUploadingCurrentImage"
            :disabled="props.aiChatSending || props.aiChatUploadingCurrentImage || !props.state.hostAiChatCurrentSelectionImage"
            @click="props.uploadAiChatCurrentSelectionImage"
          >
            上传当前图片
          </t-button>
          <t-button
            theme="primary"
            :loading="props.aiChatSending"
            :disabled="props.aiChatSendDisabled"
            @click="props.sendAiChatMessage"
          >
            {{ props.aiChatSending ? "发送中..." : "发送消息" }}
          </t-button>
          <t-button
            variant="outline"
            theme="default"
            :disabled="props.aiChatSending || (props.aiChatMessages.length === 0 && props.aiChatPendingImages.length === 0 && !aiChatInputText.trim())"
            @click="props.clearAiChatConversation"
          >
            清空对话
          </t-button>
          <t-tooltip content="将ai返回的json文本直接使用" placement="top">
            <span class="ai-chat-use-json-tooltip">
              <t-button
                variant="outline"
                theme="default"
                :disabled="props.aiChatUseJsonDisabled"
                @click="props.applyAiChatLastJsonToSinglePrompt"
              >
                使用
              </t-button>
            </span>
          </t-tooltip>
        </div>
      </div>
    </t-card>

    <t-dialog
      v-model:visible="aiChatParamDialogVisible"
      header="对话参数设置"
      dialog-class-name="ai-chat-params-dialog"
      width="760px"
      placement="center"
    >
      <div class="ai-chat-params-body">
        <section class="ai-chat-param-row">
          <div class="ai-chat-param-label-wrap">
            <div class="ai-chat-param-label">上下文数量</div>
            <div class="ai-chat-param-desc">更多上下文会让记忆更准确，但会消耗更多额度</div>
          </div>
          <div class="ai-chat-param-control">
            <input
              v-model.number="aiChatParamDraft.contextCount"
              class="ai-chat-param-range"
              type="range"
              min="1"
              max="30"
              step="1"
            />
            <span class="ai-chat-param-value">{{ aiChatParamDraft.contextCount }}</span>
          </div>
        </section>

        <section class="ai-chat-param-row">
          <div class="ai-chat-param-label-wrap">
            <div class="ai-chat-param-label">回复数</div>
            <div class="ai-chat-param-desc">即 max_tokens 回答越长，越有可能消耗更多额度</div>
          </div>
          <div class="ai-chat-param-control">
            <input
              v-model.number="aiChatParamDraft.maxTokens"
              class="ai-chat-param-range"
              type="range"
              min="64"
              max="32000"
              step="1"
            />
            <span class="ai-chat-param-value">{{ aiChatParamDraft.maxTokens }}</span>
          </div>
        </section>

        <section class="field-block field-prompt ai-chat-param-role-block">
          <label>角色设定</label>
          <t-textarea
            v-model="aiChatParamDraft.systemPrompt"
            :maxlength="5000"
            :autosize="{ minRows: 4, maxRows: 10 }"
            placeholder="给你的会话设置一个专属的角色，不是必须"
          />
        </section>

        <div v-if="aiChatParamAdvancedVisible" class="ai-chat-param-advanced">
          <section class="ai-chat-param-row">
            <div class="ai-chat-param-label-wrap">
              <div class="ai-chat-param-label">温度</div>
              <div class="ai-chat-param-desc">0 更严谨，越高越发散</div>
            </div>
            <div class="ai-chat-param-control">
              <input
                v-model.number="aiChatParamDraft.temperature"
                class="ai-chat-param-range"
                type="range"
                min="0"
                max="2"
                step="0.01"
              />
              <span class="ai-chat-param-value">{{ formatParamValue(aiChatParamDraft.temperature) }}</span>
            </div>
          </section>

          <section class="ai-chat-param-row">
            <div class="ai-chat-param-label-wrap">
              <div class="ai-chat-param-label">Top P</div>
              <div class="ai-chat-param-desc">与温度二选一微调，通常保持 1</div>
            </div>
            <div class="ai-chat-param-control">
              <input
                v-model.number="aiChatParamDraft.topP"
                class="ai-chat-param-range"
                type="range"
                min="0"
                max="1"
                step="0.01"
              />
              <span class="ai-chat-param-value">{{ formatParamValue(aiChatParamDraft.topP) }}</span>
            </div>
          </section>

          <section class="ai-chat-param-row">
            <div class="ai-chat-param-label-wrap">
              <div class="ai-chat-param-label">Presence Penalty</div>
              <div class="ai-chat-param-desc">提高新话题倾向，范围 -2 到 2</div>
            </div>
            <div class="ai-chat-param-control">
              <input
                v-model.number="aiChatParamDraft.presencePenalty"
                class="ai-chat-param-range"
                type="range"
                min="-2"
                max="2"
                step="0.1"
              />
              <span class="ai-chat-param-value">{{ formatParamValue(aiChatParamDraft.presencePenalty, 1) }}</span>
            </div>
          </section>

          <section class="ai-chat-param-row">
            <div class="ai-chat-param-label-wrap">
              <div class="ai-chat-param-label">Frequency Penalty</div>
              <div class="ai-chat-param-desc">降低重复表达，范围 -2 到 2</div>
            </div>
            <div class="ai-chat-param-control">
              <input
                v-model.number="aiChatParamDraft.frequencyPenalty"
                class="ai-chat-param-range"
                type="range"
                min="-2"
                max="2"
                step="0.1"
              />
              <span class="ai-chat-param-value">{{ formatParamValue(aiChatParamDraft.frequencyPenalty, 1) }}</span>
            </div>
          </section>
        </div>
      </div>

      <template #footer>
        <div class="ai-chat-params-footer">
          <t-button
            variant="text"
            theme="default"
            @click="aiChatParamAdvancedVisible = !aiChatParamAdvancedVisible"
          >
            {{ aiChatParamAdvancedVisible ? "收起" : "More..." }}
          </t-button>

          <div class="ai-chat-params-footer-actions">
            <t-button
              variant="outline"
              theme="default"
              @click="resetAiChatParamDraft"
            >
              恢复默认
            </t-button>
            <t-button
              theme="primary"
              @click="saveAiChatParamDraft"
            >
              保存
            </t-button>
          </div>
        </div>
      </template>
    </t-dialog>
  </div>
</template>

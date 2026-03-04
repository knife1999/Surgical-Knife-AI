<script setup lang="ts">
import CollapsiblePanelCard from "./collapsible-panel-card.vue";

const props = defineProps<{
  form: any;
  state: any;
  singleModelOptions: any[];
  sizeOptions: any[];
  layerTypeOptions: any[];
  apiKeyNameSelectOptions: any[];
  runDisabled: boolean;
  addBatchDisabled: boolean;
  runBatchDisabled: boolean;
  quotaDisabled: boolean;
  quotaInfo: any | null;
  previewImage: string;
  batchQueue: any[];
  singlePromptQueryCommand: any;
  singlePromptQueryResults: any[];
  singlePromptQueryLoading: boolean;
  openSinglePromptQuickSaveDialog: () => void;
  jumpToPromptQuery: () => void;
  clearPrompt: () => void;
  appendPromptForSingle: (item: any) => void;
  usePromptForSingle: (item: any) => void;
  setAntiMode: (mode: number) => void;
  runSingleImage: () => void;
  addCurrentToBatch: () => void;
  clearBatchQueue: () => void;
  removeBatchTask: (taskId: number) => void;
  getTaskMeta: (task: any) => string;
  runBatchQueue: () => void;
  checkQuota: () => void;
}>();

const singleApiKeyName = defineModel<string>("singleApiKeyName", {required: true});
</script>

<template>
  <div class="tab-pane-body tab-pane-single">
    <CollapsiblePanelCard class="panel-card single-form-card">
      <div class="form-grid">
        <section class="field-block">
          <label>API 地址</label>
          <t-input
            v-model.trim="props.form.apiBaseUrl"
            clearable
            placeholder="例如: https://ai.ajiai.top"
          />
        </section>

        <section class="field-block">
          <label>API Key</label>
          <t-select
            v-model="singleApiKeyName"
            class="api-key-autocomplete"
            clearable
            filterable
            :options="props.apiKeyNameSelectOptions"
            placeholder="请先在设置页面填入大香蕉Key并选择名称"
          />
        </section>

        <section class="field-block field-prompt">
          <div class="field-head-row">
            <label>提示词</label>
            <div class="field-head-actions">
              <t-button
                variant="text"
                theme="default"
                size="small"
                @click="props.openSinglePromptQuickSaveDialog"
              >
                保存当前提示词
              </t-button>
              <t-button
                variant="text"
                theme="default"
                size="small"
                @click="props.jumpToPromptQuery"
              >
                跳转提示词查询
              </t-button>
              <t-button
                variant="text"
                theme="default"
                size="small"
                @click="props.clearPrompt"
              >
                清空提示词
              </t-button>
            </div>
          </div>
          <t-textarea
            v-model="props.form.prompt"
            :maxlength="5000"
            :autosize="{ minRows: 4, maxRows: 8 }"
            placeholder="在此输入提示词..."
          />
          <div v-if="props.singlePromptQueryCommand.active" class="single-prompt-query-panel">
            <div class="single-prompt-query-head">
              <span class="single-prompt-query-title">提示词快速检索</span>
              <span class="single-prompt-query-meta">
                模式：{{ props.singlePromptQueryCommand.modeLabel }}
              </span>
            </div>
            <div class="single-prompt-query-help">
              指令（首行或末行）：$关键词 / $ -n 名称 / $ -t 标签 / $ -c 内容（可组合）
            </div>
            <div
              v-if="!props.state.hostPromptQuery"
              class="single-prompt-query-empty"
            >
              本地提示词接口未挂载，请重载插件后再试。
            </div>
            <div
              v-else-if="props.singlePromptQueryLoading"
              class="single-prompt-query-empty"
            >
              正在加载提示词库...
            </div>
            <div
              v-else-if="!props.singlePromptQueryCommand.hasKeyword"
              class="single-prompt-query-empty"
            >
              请输入关键词后开始检索。
            </div>
            <div
              v-else-if="props.singlePromptQueryResults.length === 0"
              class="single-prompt-query-empty"
            >
              没有匹配的提示词。
            </div>
            <div v-else class="single-prompt-query-list">
              <div
                v-for="item in props.singlePromptQueryResults"
                :key="`${item.name}-${item.updatedAt}`"
                class="single-prompt-query-item"
              >
                <div class="single-prompt-query-item-head">
                  <strong class="single-prompt-query-item-name">{{ item.name }}</strong>
                  <span
                    class="single-prompt-query-type-badge"
                    :class="item.type === 2 ? 'is-library' : 'is-local'"
                  >
                    {{ item.type === 2 ? "图书馆" : "本地" }}
                  </span>
                </div>
                <div class="single-prompt-query-item-content">{{ item.content }}</div>
                <div
                  v-if="Array.isArray(item.tags) && item.tags.length > 0"
                  class="prompt-query-tag-row"
                >
                  <span
                    v-for="tag in item.tags"
                    :key="`${item.name}-${tag}`"
                    class="prompt-query-tag"
                  >
                    {{ tag }}
                  </span>
                </div>
                <div class="single-prompt-query-item-foot">
                  <t-button
                    size="small"
                    variant="outline"
                    theme="primary"
                    @click="props.appendPromptForSingle(item)"
                  >
                    追加
                  </t-button>
                  <t-button
                    size="small"
                    variant="outline"
                    theme="primary"
                    @click="props.usePromptForSingle(item)"
                  >
                    使用
                  </t-button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="field-block">
          <label>模型</label>
          <t-select
            v-model="props.form.model"
            :options="props.singleModelOptions"
            placeholder="请选择模型"
          />
        </section>

        <section class="field-block">
          <label>基础参数</label>
          <div class="param-inline-row">
            <div class="param-item">
              <span class="param-item-label">分辨率档位</span>
              <t-select v-model="props.form.size" :options="props.sizeOptions" placeholder="分辨率档位"/>
            </div>
            <div class="param-item">
              <span class="param-item-label">数量</span>
              <t-input-number v-model="props.form.batchSize" :min="1" :max="5" theme="normal"/>
            </div>
            <div class="param-item">
              <span class="param-item-label">超时(秒)</span>
              <t-input-number v-model="props.form.timeoutSeconds"  :min="60" theme="normal"/>
            </div>
          </div>
        </section>

        <section class="field-block">
          <label>图层与压缩</label>
          <div class="param-inline-row-2">
            <div class="param-item">
              <span class="param-item-label">图层类型</span>
              <t-select v-model="props.form.layerType" :options="props.layerTypeOptions" placeholder="图层类型"/>
            </div>
            <div class="param-item">
              <span class="param-item-label">传出压缩(长边)</span>
              <t-input-number v-model="props.form.maxResolution" :min="512" :max="4096" theme="normal"/>
            </div>
          </div>
        </section>

        <section class="field-block">
          <label>抗截断模式</label>
          <div class="anti-row">
            <t-button
              :theme="props.form.antiMode === 1 ? 'primary' : 'default'"
              variant="outline"
              @click="props.setAntiMode(1)"
            >
              普通
            </t-button>
            <t-button
              :theme="props.form.antiMode === 2 ? 'warning' : 'default'"
              variant="outline"
              @click="props.setAntiMode(2)"
            >
              高强
            </t-button>
          </div>
        </section>
      </div>
    </CollapsiblePanelCard>

    <CollapsiblePanelCard class="panel-card single-action-card">
      <div class="action-row">
        <t-button
          theme="primary"
          size="large"
          :loading="props.state.running"
          :disabled="props.runDisabled"
          @click="props.runSingleImage"
        >
          {{ props.state.running ? "处理中..." : "开始生成(当前单图)" }}
        </t-button>

        <t-button
          theme="default"
          variant="outline"
          size="large"
          :loading="props.state.addingBatchTask"
          :disabled="props.addBatchDisabled"
          @click="props.addCurrentToBatch"
        >
          {{ props.state.addingBatchTask ? "添加中..." : "+ 添加到批处理" }}
        </t-button>

        <t-button
          theme="default"
          variant="outline"
          size="large"
          :loading="props.state.checkingQuota"
          :disabled="props.quotaDisabled"
          @click="props.checkQuota"
        >
          {{ props.state.checkingQuota ? "查询中..." : "查询剩余次数" }}
        </t-button>
      </div>
    </CollapsiblePanelCard>

    <CollapsiblePanelCard class="panel-card batch-head-card">
      <div class="batch-header-row">
        <div>
          <div class="batch-title">批处理任务队列</div>
          <div class="batch-subtitle">任务来自当前页面“+ 添加到批处理”</div>
        </div>
        <t-button
          size="small"
          variant="outline"
          theme="default"
          :disabled="props.batchQueue.length === 0 || props.state.batchRunning"
          @click="props.clearBatchQueue"
        >
          清空
        </t-button>
      </div>
    </CollapsiblePanelCard>

    <CollapsiblePanelCard class="panel-card batch-list-card batch-queue-card">
      <div v-if="props.batchQueue.length === 0" class="batch-empty">
        暂无任务，请先点击“+ 添加到批处理”。
      </div>
      <div v-else class="batch-list">
        <div v-for="task in props.batchQueue" :key="task.id" class="batch-item">
          <div class="batch-item-top">
            <div class="batch-item-doc">{{ task.docName }}</div>
            <t-button
              size="small"
              variant="text"
              theme="danger"
              :disabled="props.state.batchRunning"
              @click="props.removeBatchTask(task.id)"
            >
              删除
            </t-button>
          </div>
          <div class="batch-item-meta">{{ props.getTaskMeta(task) }}</div>
          <div class="batch-item-prompt">{{ task.prompt }}</div>
        </div>
      </div>
    </CollapsiblePanelCard>

    <CollapsiblePanelCard class="panel-card batch-run-card">
      <div class="batch-run-row">
        <div class="batch-note">注意：批处理运行期间请勿关闭原文档，否则无法回贴。</div>
        <t-button
          block
          theme="primary"
          size="large"
          :loading="props.state.batchRunning"
          :disabled="props.runBatchDisabled"
          @click="props.runBatchQueue"
        >
          {{ props.state.batchRunning ? "批处理中..." : "开始批量处理" }}
        </t-button>
      </div>
    </CollapsiblePanelCard>

    <CollapsiblePanelCard v-if="props.quotaInfo" class="panel-card quota-card single-quota-card" :bordered="false">
      <div class="quota-grid">
        <div class="quota-item">
          <span>余额(USD)</span>
          <strong>${{ props.quotaInfo.availableUSD.toFixed(2) }}</strong>
        </div>
        <div class="quota-item">
          <span>可用总量</span>
          <strong>{{ props.quotaInfo.totalAvailable }}</strong>
        </div>
        <div class="quota-item">
          <span>1K</span>
          <strong>{{ props.quotaInfo.count1K }}</strong>
        </div>
        <div v-if="props.form.model !== 'gemini-2.5-flash-image'" class="quota-item">
          <span>2K</span>
          <strong>{{ props.quotaInfo.count2K }}</strong>
        </div>
        <div v-if="props.form.model !== 'gemini-2.5-flash-image'" class="quota-item">
          <span>4K</span>
          <strong>{{ props.quotaInfo.count4K }}</strong>
        </div>
      </div>
    </CollapsiblePanelCard>

    <CollapsiblePanelCard v-if="props.previewImage" class="panel-card single-preview-card" :bordered="false">
      <div class="preview-box">
        <img :src="props.previewImage" alt="preview"/>
      </div>
    </CollapsiblePanelCard>
  </div>
</template>

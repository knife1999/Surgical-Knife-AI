<script setup lang="ts">
import {computed, ref, watch} from "vue";
import CollapsiblePanelCard from "./collapsible-panel-card.vue";

const props = defineProps<{
  form: any;
  state: any;
  singleProviderOptions: any[];
  singleModelOptions: any[];
  layerTypeOptions: any[];
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
  loadSingleProviderModels: () => Promise<string[]>;
  appendPromptForSingle: (item: any) => void;
  usePromptForSingle: (item: any) => void;
  setAntiMode: (mode: number) => void;
  reverseAntiActionDisabled: boolean;
  runAntiReverseAction: () => void;
  runSingleImage: () => void;
  addCurrentToBatch: () => void;
  clearBatchQueue: () => void;
  removeBatchTask: (taskId: number) => void;
  getTaskMeta: (task: any) => string;
  runBatchQueue: () => void;
  checkQuota: () => void;
}>();

const singleProviderId = defineModel<string>("singleProviderId", {required: true});

const singleModelDialogVisible = ref(false);
const singleModelLoading = ref(false);
const singleModelItems = ref<string[]>([]);
const singleModelError = ref("");
const singleModelKeyword = ref("");
const singleModelGroupKey = ref<string>("all");

const SINGLE_MODEL_GROUPS = [
  { key: "deepseek", label: "Deepseek", icon: "◉" },
  { key: "openai", label: "OpenAI", icon: "◎" },
  { key: "openai_o", label: "OpenAI O", icon: "◌" },
  { key: "claude", label: "Claude", icon: "✳" },
  { key: "gemini", label: "Gemini", icon: "✦" },
  { key: "grok", label: "Grok", icon: "△" },
  { key: "other", label: "Other", icon: "•" },
] as const;

const resolveSingleModelGroupKey = (modelId: string) => {
  const id = String(modelId || "").toLowerCase();
  if (id.includes("deepseek")) return "deepseek";
  if (id.includes("claude")) return "claude";
  if (id.includes("gemini")) return "gemini";
  if (id.includes("grok") || id.includes("xai")) return "grok";
  if (/\bo[1-9]\b|gpt-4o|gpt-o/i.test(id)) return "openai_o";
  if (id.includes("openai") || id.includes("gpt")) return "openai";
  return "other";
};

const singleFilteredModelItems = computed(() => {
  const keyword = String(singleModelKeyword.value || "").trim().toLowerCase();
  if (!keyword) return [...singleModelItems.value];
  return singleModelItems.value.filter((item) => String(item || "").toLowerCase().includes(keyword));
});

const singleModelGroupedItems = computed(() => {
  const groups = SINGLE_MODEL_GROUPS.map((group) => ({
    ...group,
    items: [] as string[],
  }));
  const groupMap = new Map(groups.map((group) => [group.key, group]));
  for (const rawItem of singleFilteredModelItems.value) {
    const item = String(rawItem || "").trim();
    if (!item) continue;
    const key = resolveSingleModelGroupKey(item);
    const group = groupMap.get(key) || groupMap.get("other");
    group?.items.push(item);
  }
  return groups.filter((group) => group.items.length > 0);
});

const singleFilteredModelCount = computed(() => singleFilteredModelItems.value.length);

const singleModelMenuItems = computed(() => ([
  {
    key: "all",
    label: "全部",
    icon: "◍",
    count: singleFilteredModelCount.value,
  },
  ...singleModelGroupedItems.value.map((group) => ({
    key: group.key,
    label: group.label,
    icon: group.icon,
    count: group.items.length,
  })),
]));

const singleModelActiveGroupKey = computed(() => {
  const key = String(singleModelGroupKey.value || "all");
  if (key === "all") return "all";
  return singleModelGroupedItems.value.some((group) => group.key === key) ? key : "all";
});

const singleModelActiveGroup = computed(() => {
  const key = singleModelActiveGroupKey.value;
  if (key === "all") {
    return {
      key: "all",
      label: "全部模型",
      items: singleFilteredModelItems.value,
    };
  }
  const group = singleModelGroupedItems.value.find((item) => item.key === key);
  return {
    key,
    label: group?.label || "全部模型",
    items: group?.items || [],
  };
});

watch(singleModelKeyword, (value) => {
  if (String(value || "").trim()) {
    singleModelGroupKey.value = "all";
  }
});

const selectSingleModel = (modelId: string) => {
  const model = String(modelId || "").trim();
  if (!model) return;
  props.form.model = model;
  singleModelDialogVisible.value = false;
};

const openSingleModelDialog = async () => {
  singleModelDialogVisible.value = true;
  singleModelLoading.value = true;
  singleModelError.value = "";
  singleModelKeyword.value = "";
  singleModelGroupKey.value = "all";
  try {
    const models = await props.loadSingleProviderModels();
    singleModelItems.value = Array.isArray(models) ? models : [];
  } catch (error) {
    singleModelItems.value = [];
    singleModelError.value = error instanceof Error ? error.message : String(error);
  } finally {
    singleModelLoading.value = false;
  }
};
</script>

<template>
  <div class="tab-pane-body tab-pane-single">
    <CollapsiblePanelCard class="panel-card single-form-card" title="图像工作台">
      <div class="form-grid">
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
          <label>服务商与模型</label>
          <div class="param-inline-row-2">
            <div class="param-item">
              <span class="param-item-label">服务商</span>
              <t-select
                v-model="singleProviderId"
                :options="props.singleProviderOptions"
                placeholder="请选择服务商"
              />
            </div>
            <div class="param-item">
              <span class="param-item-label">模型</span>
              <div class="provider-model-toolbar">
                <t-input
                  v-model.trim="props.form.model"
                  clearable
                  placeholder="请通过模型列表选择或手动输入模型"
                />
                <div class="provider-model-toolbar-actions">
                  <t-button size="small" variant="outline" theme="default" @click="openSingleModelDialog">
                    模型列表
                  </t-button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="field-block">
          <label>基础参数</label>
          <div class="param-inline-row">
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
            <t-button
              variant="outline"
              theme="default"
              :disabled="props.reverseAntiActionDisabled"
              :loading="props.state.reversingAntiAction"
              @click="props.runAntiReverseAction"
            >
              反向操作
            </t-button>
          </div>
        </section>
      </div>
    </CollapsiblePanelCard>

    <CollapsiblePanelCard class="panel-card single-action-card" title="执行操作">
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

    <CollapsiblePanelCard class="panel-card batch-card" title="批处理">
      <div class="batch-header-row">
        <div>
          <div class="batch-title">任务队列</div>
          <div class="batch-subtitle">任务来自当前页面“+ 添加到批处理”</div>
        </div>
        <div class="batch-header-actions">
          <span class="batch-queue-count">共 {{ props.batchQueue.length }} 项</span>
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
      </div>
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

    <CollapsiblePanelCard v-if="props.quotaInfo" class="panel-card quota-card single-quota-card" :bordered="false" title="额度信息">
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

    <CollapsiblePanelCard v-if="props.previewImage" class="panel-card single-preview-card" :bordered="false" title="结果预览">
      <div class="preview-box">
        <img :src="props.previewImage" alt="preview"/>
      </div>
    </CollapsiblePanelCard>

    <t-dialog
      v-model:visible="singleModelDialogVisible"
      header="模型列表"
      dialog-class-name="single-model-dialog"
      width="760px"
      placement="center"
      :footer="false"
    >
      <div v-if="singleModelLoading" class="batch-empty">模型拉取中...</div>
      <div v-else-if="singleModelError" class="batch-empty">{{ singleModelError }}</div>
      <div v-else-if="singleModelItems.length === 0" class="batch-empty">未获取到模型列表</div>
      <div v-else class="single-model-dialog-body">
        <div class="single-model-dialog-toolbar">
          <t-input
            v-model.trim="singleModelKeyword"
            clearable
            placeholder="搜索模型，例如：gpt / gemini / deepseek"
          />
          <div class="single-model-dialog-toolbar-actions">
            <t-button size="small" variant="outline" theme="default" @click="singleModelGroupKey = 'all'">
              显示全部
            </t-button>
          </div>
        </div>
        <div class="single-model-dialog-meta-row">
          <span>总模型 {{ singleModelItems.length }}</span>
          <span>匹配 {{ singleFilteredModelCount }}</span>
          <span v-if="props.form.model">当前 {{ props.form.model }}</span>
        </div>
        <div v-if="singleFilteredModelCount === 0" class="batch-empty">没有匹配的模型</div>
        <div v-else class="single-model-layout">
          <div class="single-model-group-nav">
            <button
              v-for="group in singleModelMenuItems"
              :key="group.key"
              type="button"
              class="single-model-group-btn"
              :class="{ 'is-active': singleModelActiveGroupKey === group.key }"
              @click="singleModelGroupKey = group.key"
            >
              <span class="single-model-group-btn-main">
                <span>{{ group.icon }}</span>
                <span>{{ group.label }}</span>
              </span>
              <span class="single-model-group-btn-count">{{ group.count }}</span>
            </button>
          </div>
          <div class="single-model-results-panel">
            <div class="single-model-results-head">
              <div class="single-model-results-title">{{ singleModelActiveGroup.label }}</div>
              <div class="single-model-results-meta">共 {{ singleModelActiveGroup.items.length }} 项</div>
            </div>
            <div class="single-model-results-list">
              <button
                v-for="item in singleModelActiveGroup.items"
                :key="item"
                type="button"
                class="single-model-item"
                :class="{ 'is-active': props.form.model === item }"
                @click="selectSingleModel(item)"
              >
                <span>{{ item }}</span>
                <span v-if="props.form.model === item" class="single-model-item-tag">当前</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

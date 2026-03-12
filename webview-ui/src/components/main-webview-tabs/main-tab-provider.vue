<script setup lang="ts">
import {computed, ref, watch} from "vue";
import CollapsiblePanelCard from "./collapsible-panel-card.vue";

const props = defineProps<{
  providerItems: any[];
  createProvider: () => void;
  updateProvider: () => void;
  deleteProvider: () => void;
  loadProviderModels: () => Promise<string[]>;
}>();

const providerManageSelected = defineModel<string>("providerManageSelected", { required: true });
const providerManageName = defineModel<string>("providerManageName", { required: true });
const providerManageBaseUrl = defineModel<string>("providerManageBaseUrl", { required: true });
const providerManageKey = defineModel<string>("providerManageKey", { required: true });
const providerManageProtocolMode = defineModel<string>("providerManageProtocolMode", { required: true });

const providerModelDialogVisible = ref(false);
const providerModelLoading = ref(false);
const providerModelItems = ref<string[]>([]);
const providerModelError = ref("");
const providerModelKeyword = ref("");
const providerModelCollapsedMap = ref<Record<string, boolean>>({});

const providerDialogProviderName = computed(() => {
  const selectedId = String(providerManageSelected.value || "").trim();
  const selectedItem = props.providerItems.find((item) => String(item?.id || "").trim() === selectedId);
  const selectedName = String(selectedItem?.name || "").trim();
  if (selectedName) return selectedName;
  const formName = String(providerManageName.value || "").trim();
  if (formName) return formName;
  const baseUrl = String(providerManageBaseUrl.value || "").trim();
  return baseUrl || "当前服务商";
});

const PROVIDER_MODEL_GROUPS = [
  { key: "deepseek", label: "Deepseek", icon: "◉" },
  { key: "openai", label: "OpenAI", icon: "◎" },
  { key: "openai_o", label: "OpenAI O", icon: "◌" },
  { key: "claude", label: "Claude", icon: "✳" },
  { key: "gemini", label: "Gemini", icon: "✦" },
  { key: "grok", label: "Grok", icon: "△" },
  { key: "other", label: "Other", icon: "•" },
] as const;

const resolveProviderModelGroupKey = (modelId: string) => {
  const id = String(modelId || "").toLowerCase();
  if (id.includes("deepseek")) return "deepseek";
  if (id.includes("claude")) return "claude";
  if (id.includes("gemini")) return "gemini";
  if (id.includes("grok") || id.includes("xai")) return "grok";
  if (/\bo[1-9]\b|gpt-4o|gpt-o/i.test(id)) return "openai_o";
  if (id.includes("openai") || id.includes("gpt")) return "openai";
  return "other";
};

const providerFilteredModelItems = computed(() => {
  const keyword = String(providerModelKeyword.value || "").trim().toLowerCase();
  if (!keyword) return [...providerModelItems.value];
  return providerModelItems.value.filter((item) => String(item || "").toLowerCase().includes(keyword));
});

const providerModelGroupedItems = computed(() => {
  const groups = PROVIDER_MODEL_GROUPS.map((group) => ({
    ...group,
    items: [] as string[],
  }));
  const groupMap = new Map(groups.map((group) => [group.key, group]));
  for (const rawItem of providerFilteredModelItems.value) {
    const item = String(rawItem || "").trim();
    if (!item) continue;
    const key = resolveProviderModelGroupKey(item);
    const group = groupMap.get(key) || groupMap.get("other");
    group?.items.push(item);
  }
  return groups.filter((group) => group.items.length > 0);
});

const providerFilteredModelCount = computed(() => providerFilteredModelItems.value.length);

const setAllProviderModelGroupsCollapsed = (collapsed: boolean) => {
  const nextMap: Record<string, boolean> = {};
  for (const group of providerModelGroupedItems.value) {
    nextMap[group.key] = collapsed;
  }
  providerModelCollapsedMap.value = nextMap;
};

const toggleProviderModelGroupCollapsed = (groupKey: string) => {
  providerModelCollapsedMap.value = {
    ...providerModelCollapsedMap.value,
    [groupKey]: !providerModelCollapsedMap.value[groupKey],
  };
};

const isProviderModelGroupCollapsed = (groupKey: string) =>
  providerModelCollapsedMap.value[groupKey] !== false;

watch(providerModelKeyword, (value) => {
  if (String(value || "").trim()) {
    setAllProviderModelGroupsCollapsed(false);
  }
});

const openProviderModelDialog = async () => {
  providerModelDialogVisible.value = true;
  providerModelLoading.value = true;
  providerModelError.value = "";
  providerModelKeyword.value = "";
  try {
    const models = await props.loadProviderModels();
    providerModelItems.value = Array.isArray(models) ? models : [];
    setAllProviderModelGroupsCollapsed(true);
  } catch (error) {
    providerModelItems.value = [];
    providerModelError.value = error instanceof Error ? error.message : String(error);
    providerModelCollapsedMap.value = {};
  } finally {
    providerModelLoading.value = false;
  }
};
</script>

<template>
  <div class="tab-pane-body tab-pane-settings">
    <CollapsiblePanelCard class="panel-card settings-mini-card provider-config-card" title="服务商配置">
      <section class="field-block">
        <div class="provider-head-row">
          <t-button
            size="small"
            variant="outline"
            theme="default"
            class="provider-model-list-btn"
            @click="openProviderModelDialog"
          >
            模型列表
          </t-button>
        </div>
        <div v-if="props.providerItems.length === 0" class="settings-hint">暂无服务商配置</div>
        <div v-else class="api-key-name-list">
          <button
            v-for="item in props.providerItems"
            :key="item.id"
            type="button"
            class="api-key-name-item"
            :class="{ 'is-active': providerManageSelected === item.id }"
            @click="providerManageSelected = item.id"
          >
            {{ item.name }} · {{ item.protocolMode === "openai" ? "OpenAI" : item.protocolMode === "both" ? "Gemini + OpenAI" : "Gemini" }}
          </button>
        </div>
      </section>

      <section class="field-block">
        <label>服务商名称</label>
        <t-input v-model.trim="providerManageName" clearable placeholder="例如：Comfly / AJI" />
      </section>

      <section class="field-block">
        <label>Base URL</label>
        <t-input v-model.trim="providerManageBaseUrl" clearable placeholder="例如: https://ai.comfly.chat" />
      </section>

      <section class="field-block">
        <label>Key</label>
        <t-input
          v-model.trim="providerManageKey"
          type="password"
          clearable
          placeholder="请输入该服务商对应 Key"
        />
      </section>

      <section class="field-block">
        <label>协议支持</label>
        <t-select
          v-model="providerManageProtocolMode"
          :options="[
            { label: 'Gemini', value: 'gemini' },
            { label: 'OpenAI', value: 'openai' },
            { label: 'Gemini + OpenAI（默认 Gemini）', value: 'both' },
          ]"
          placeholder="请选择协议支持"
        />
      </section>

      <div class="provider-action-row">
        <t-button size="medium" theme="primary" @click="props.createProvider">新增</t-button>
        <t-button size="medium" variant="outline" theme="warning" @click="props.updateProvider">更新选中</t-button>
        <t-button size="medium" variant="outline" theme="danger" class="provider-delete-btn" @click="props.deleteProvider">
          删除选中
        </t-button>
      </div>
    </CollapsiblePanelCard>

    <t-dialog
      v-model:visible="providerModelDialogVisible"
      header="模型列表"
      dialog-class-name="provider-model-dialog"
      width="640px"
      placement="center"
      :footer="false"
    >
      <div v-if="providerModelLoading" class="batch-empty">模型拉取中...</div>
      <div v-else-if="providerModelError" class="provider-model-error-box">{{ providerModelError }}</div>
      <div v-else-if="providerModelItems.length === 0" class="batch-empty">未获取到模型列表</div>
      <div v-else class="provider-model-dialog-body">
        <div class="provider-model-dialog-tip">
          <div class="provider-model-dialog-tip-title">支持模型参考</div>
          <div class="provider-model-dialog-tip-text">
            这里只展示当前服务商支持哪些模型，方便核对能力范围；实际可用性仍以服务商接口返回结果为准。
          </div>
        </div>
        <div class="provider-model-toolbar">
          <t-input
            v-model.trim="providerModelKeyword"
            clearable
            placeholder="搜索模型，例如：gpt / gemini / deepseek"
          />
          <div class="provider-model-toolbar-actions">
            <t-button size="small" variant="text" theme="default" @click="setAllProviderModelGroupsCollapsed(false)">
              全部展开
            </t-button>
            <t-button size="small" variant="text" theme="default" @click="setAllProviderModelGroupsCollapsed(true)">
              全部收起
            </t-button>
          </div>
        </div>
        <div class="provider-model-meta-row">
          <span class="provider-model-provider-name">{{ providerDialogProviderName }}</span>
          <span>总模型 {{ providerModelItems.length }}</span>
          <span>匹配 {{ providerFilteredModelCount }}</span>
        </div>
        <div v-if="providerFilteredModelCount === 0" class="batch-empty">没有匹配的模型</div>
        <div v-else class="provider-model-group-list">
          <div v-for="group in providerModelGroupedItems" :key="group.key" class="provider-model-group-card">
            <button
              type="button"
              class="provider-model-group-head"
              @click="toggleProviderModelGroupCollapsed(group.key)"
            >
              <span class="provider-model-group-title">{{ group.icon }} {{ group.label }}</span>
              <span class="provider-model-group-tail">
                <span class="provider-model-group-count">{{ group.items.length }}</span>
                <span
                  class="provider-model-group-arrow"
                  :class="{ 'is-collapsed': isProviderModelGroupCollapsed(group.key) }"
                >
                  ▾
                </span>
              </span>
            </button>
            <div v-if="!isProviderModelGroupCollapsed(group.key)" class="provider-model-list">
              <div v-for="item in group.items" :key="item" class="provider-model-item">{{ item }}</div>
            </div>
          </div>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

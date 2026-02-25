<script setup lang="ts">
const props = defineProps<{
  state: any;
  promptQueryItems: any[];
  promptQueryFilteredItems: any[];
  promptQueryLoading: boolean;
  promptLibraryRefreshLoading: boolean;
  promptQueryDetailItem: any | null;
  promptQueryDeletingName: string;
  pullPromptLibraryFromCloud: () => void;
  loadPromptQueryItems: (options: any) => void;
  closePromptQueryDetail: () => void;
  formatPromptTime: (value: unknown) => string;
  togglePromptQueryFavorite: (item: any) => void;
  deletePromptQueryItem: (item: any) => void;
  openPromptQueryEditDialog: (item: any) => void;
  appendPromptForSingle: (item: any) => void;
  usePromptForSingle: (item: any) => void;
  handlePromptQueryItemClick: (item: any) => void;
}>();

const promptQueryNameKeyword = defineModel<string>("promptQueryNameKeyword", {required: true});
const promptQueryTagKeyword = defineModel<string>("promptQueryTagKeyword", {required: true});
const promptQueryFavoritesOnly = defineModel<boolean>("promptQueryFavoritesOnly", {required: true});
const promptQuerySourceType = defineModel<"" | "local" | "online">("promptQuerySourceType", {required: true});
const promptLibraryForceSync = defineModel<boolean>("promptLibraryForceSync", {required: true});

const promptQuerySourceOptions = [
  {label: "本地", value: "local" as const},
  {label: "线上", value: "online" as const},
];
</script>

<template>
  <div class="tab-pane-body tab-pane-prompt-query">
    <t-card class="panel-card prompt-query-search-card">
      <div class="prompt-query-head">
        <div class="prompt-query-title">提示词检索</div>
      </div>

      <div class="prompt-query-search-row">
        <div class="prompt-query-search-wrap">
          <span class="prompt-query-search-icon">名</span>
          <input
            v-model.trim="promptQueryNameKeyword"
            class="prompt-query-search-input"
            type="text"
            placeholder="按名称搜索"
          />
          <button
            v-if="promptQueryNameKeyword.trim().length > 0"
            type="button"
            class="prompt-query-search-clear"
            aria-label="清除名称搜索"
            @click="promptQueryNameKeyword = ''"
          >
            ×
          </button>
        </div>
        <div class="prompt-query-search-wrap">
          <span class="prompt-query-search-icon">#</span>
          <input
            v-model.trim="promptQueryTagKeyword"
            class="prompt-query-search-input"
            type="text"
            placeholder="按标签搜索"
          />
          <button
            v-if="promptQueryTagKeyword.trim().length > 0"
            type="button"
            class="prompt-query-search-clear"
            aria-label="清除标签搜索"
            @click="promptQueryTagKeyword = ''"
          >
            ×
          </button>
        </div>
      </div>

      <div class="prompt-query-toolbar">
        <div class="prompt-query-stats">
          <span class="prompt-query-stat">总数 {{ props.promptQueryItems.length }}</span>
          <span class="prompt-query-stat prompt-query-stat-active">匹配 {{ props.promptQueryFilteredItems.length }}</span>
        </div>
        <div class="prompt-query-toolbar-actions">
          <label class="prompt-query-fav-row">
            <span>只看收藏</span>
            <t-checkbox v-model="promptQueryFavoritesOnly" />
          </label>
          <label class="prompt-query-source-row">
            <span class="prompt-query-source-label">来源</span>
            <div class="prompt-query-source-control">
              <t-select
                v-model="promptQuerySourceType"
                class="prompt-query-source-select"
                size="small"
                :options="promptQuerySourceOptions"
                :popup-props="{ overlayClassName: 'prompt-query-source-dropdown' }"
                placeholder="全部"
              />
              <button
                v-if="promptQuerySourceType"
                type="button"
                class="prompt-query-source-clear"
                aria-label="清除来源筛选"
                @click="promptQuerySourceType = ''"
              >
                ×
              </button>
            </div>
          </label>
          <label class="prompt-query-force-row">
            <span>禁止自动拉取</span>
            <t-switch v-model="promptLibraryForceSync" size="small"/>
          </label>
          <t-button
            size="small"
            variant="outline"
            theme="default"
            :loading="props.promptLibraryRefreshLoading"
            :disabled="props.promptQueryLoading"
            @click="props.pullPromptLibraryFromCloud"
          >
            从云端拉取提示词
          </t-button>
          <t-button
            size="small"
            variant="outline"
            theme="default"
            :loading="props.promptQueryLoading"
            :disabled="props.promptLibraryRefreshLoading"
            @click="props.loadPromptQueryItems({ syncLibrary: false, forceReloadDisk: true, clearCacheFirst: true })"
          >
            刷新列表
          </t-button>
        </div>
      </div>
    </t-card>

    <t-card class="panel-card prompt-query-list-card">
      <div v-if="!props.state.hostPromptQuery" class="batch-empty">
        本地存储接口未挂载，请重载插件后再试（与网络无关）。
      </div>
      <div v-else-if="props.promptQueryLoading && props.promptQueryItems.length === 0" class="batch-empty">
        正在加载提示词...
      </div>
      <div v-else-if="props.promptQueryDetailItem" class="prompt-query-detail">
        <div class="prompt-query-detail-head">
          <t-button size="small" variant="outline" theme="default" @click="props.closePromptQueryDetail">
            返回列表
          </t-button>
        </div>

        <div class="prompt-query-detail-card">
          <span
            class="prompt-query-type-badge prompt-query-detail-badge"
            :class="props.promptQueryDetailItem.type === 2 ? 'is-library' : 'is-local'"
          >
            {{ props.promptQueryDetailItem.type === 2 ? "图书馆提示词" : "本地" }}
          </span>
          <div class="prompt-query-detail-title-row">
            <strong class="prompt-query-item-name">{{ props.promptQueryDetailItem.name }}</strong>
            <span v-if="props.promptQueryDetailItem.category" class="prompt-query-item-category">
              {{ props.promptQueryDetailItem.category }}
            </span>
          </div>
          <div v-if="props.promptQueryDetailItem.description" class="prompt-query-detail-desc">
            {{ props.promptQueryDetailItem.description }}
          </div>
          <div class="prompt-query-detail-content">{{ props.promptQueryDetailItem.content }}</div>
          <div v-if="props.promptQueryDetailItem.tags.length > 0" class="prompt-query-tag-row">
            <span
              v-for="tag in props.promptQueryDetailItem.tags"
              :key="`${props.promptQueryDetailItem.name}-${tag}`"
              class="prompt-query-tag"
            >
              {{ tag }}
            </span>
          </div>
          <div class="prompt-query-item-foot">
            <span v-if="props.formatPromptTime(props.promptQueryDetailItem.updatedAt)" class="prompt-query-item-time">
              {{ props.formatPromptTime(props.promptQueryDetailItem.updatedAt) }}
            </span>
            <t-button
              size="small"
              variant="text"
              theme="warning"
              class="prompt-query-fav-btn"
              :disabled="!props.state.hostPromptFavorite"
              @click="props.togglePromptQueryFavorite(props.promptQueryDetailItem)"
            >
              {{ Number(props.promptQueryDetailItem.favorite) === 1 ? "★" : "☆" }}
            </t-button>
            <t-button
              v-if="props.promptQueryDetailItem.type === 1"
              size="small"
              variant="outline"
              theme="default"
              :disabled="!props.state.hostPromptCreate"
              @click="props.openPromptQueryEditDialog(props.promptQueryDetailItem)"
            >
              修改
            </t-button>
            <t-button
              size="small"
              variant="outline"
              theme="danger"
              :disabled="props.promptQueryDetailItem.type !== 1 || !props.state.hostPromptDelete"
              :loading="props.promptQueryDeletingName === props.promptQueryDetailItem.name"
              @click="props.deletePromptQueryItem(props.promptQueryDetailItem)"
            >
              删除
            </t-button>
            <t-button
              size="small"
              variant="outline"
              theme="primary"
              @click="props.appendPromptForSingle(props.promptQueryDetailItem)"
            >
              追加
            </t-button>
            <t-button
              size="small"
              variant="outline"
              theme="primary"
              @click="props.usePromptForSingle(props.promptQueryDetailItem)"
            >
              使用
            </t-button>
          </div>
        </div>
      </div>
      <div v-else-if="props.promptQueryFilteredItems.length === 0" class="batch-empty">
        没有匹配结果，请尝试其他关键词。
      </div>
      <div v-else class="prompt-query-list">
        <div
          v-for="item in props.promptQueryFilteredItems"
          :key="`${item.name}-${item.updatedAt}`"
          class="prompt-query-item"
          @click="props.handlePromptQueryItemClick(item)"
        >
          <span
            class="prompt-query-type-badge"
            :class="item.type === 2 ? 'is-library' : 'is-local'"
          >
            {{ item.type === 2 ? "图书馆提示词" : "本地" }}
          </span>

          <div class="prompt-query-item-head">
            <div class="prompt-query-item-title">
              <strong class="prompt-query-item-name">{{ item.name }}</strong>
              <span v-if="item.category" class="prompt-query-item-category">{{ item.category }}</span>
            </div>
          </div>

          <div class="prompt-query-item-content is-clamped">{{ item.content }}</div>
          <div
            class="prompt-query-item-desc is-clamped"
            :class="{ 'is-empty': !item.description }"
          >
            {{ item.description || " " }}
          </div>

          <div class="prompt-query-tag-row" :class="{ 'is-empty': item.tags.length === 0 }">
            <span v-for="tag in item.tags" :key="`${item.name}-${tag}`" class="prompt-query-tag">
              {{ tag }}
            </span>
          </div>

          <div class="prompt-query-item-foot">
            <span v-if="props.formatPromptTime(item.updatedAt)" class="prompt-query-item-time">
              {{ props.formatPromptTime(item.updatedAt) }}
            </span>
            <t-button
              size="small"
              variant="text"
              theme="warning"
              class="prompt-query-fav-btn"
              :disabled="!props.state.hostPromptFavorite"
              @click.stop="props.togglePromptQueryFavorite(item)"
            >
              {{ Number(item.favorite) === 1 ? "★" : "☆" }}
            </t-button>
            <t-button
              v-if="item.type === 1"
              size="small"
              variant="outline"
              theme="default"
              :disabled="!props.state.hostPromptCreate"
              @click.stop="props.openPromptQueryEditDialog(item)"
            >
              修改
            </t-button>
            <t-button
              size="small"
              variant="outline"
              theme="danger"
              :disabled="item.type !== 1 || !props.state.hostPromptDelete"
              :loading="props.promptQueryDeletingName === item.name"
              @click.stop="props.deletePromptQueryItem(item)"
            >
              删除
            </t-button>
            <t-button
              size="small"
              variant="outline"
              theme="primary"
              @click.stop="props.appendPromptForSingle(item)"
            >
              追加
            </t-button>
            <t-button
              size="small"
              variant="outline"
              theme="primary"
              @click.stop="props.usePromptForSingle(item)"
            >
              使用
            </t-button>
          </div>
        </div>
      </div>
    </t-card>
  </div>
</template>


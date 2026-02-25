<script setup lang="ts">
const props = defineProps<{
  promptCreateForm: any;
  promptCreateSaving: boolean;
  promptCreateSaveDisabled: boolean;
  promptCreateStoragePath: string;
  promptCreateTotal: number;
  savePromptCreateForm: () => void;
  jumpToPromptQuery: () => void;
  clearPromptCreateForm: () => void;
  copyPromptCreateStoragePath: () => void;
}>();
</script>

<template>
  <div class="tab-pane-body tab-pane-prompt-create">
    <t-card class="panel-card settings-card">
      <div class="settings-section prompt-create-section">
        <section class="field-block">
          <label>提示词名称</label>
          <t-input
            v-model.trim="props.promptCreateForm.name"
            clearable
            placeholder="请输入提示词名称"
          />
        </section>

        <section class="field-block field-prompt">
          <label>提示词内容</label>
          <t-textarea
            v-model="props.promptCreateForm.content"
            :maxlength="10000"
            :autosize="{ minRows: 4, maxRows: 20 }"
            placeholder="请输入提示词内容..."
          />
        </section>

        <section class="field-block">
          <label>提示词描述</label>
          <t-input
            v-model.trim="props.promptCreateForm.description"
            clearable
            placeholder="请输入提示词描述"
          />
        </section>

        <section class="field-block">
          <label>分类</label>
          <t-input
            v-model.trim="props.promptCreateForm.category"
            clearable
            placeholder="例如：人物、风景、产品"
          />
        </section>

        <section class="field-block">
          <label>标签</label>
          <t-tag-input
            v-model="props.promptCreateForm.tags"
            clearable
            :max="30"
            placeholder="输入标签后按回车，可添加多个标签"
          />
        </section>

        <div class="settings-inline-actions">
          <t-button
            theme="primary"
            :loading="props.promptCreateSaving"
            :disabled="props.promptCreateSaveDisabled"
            @click="props.savePromptCreateForm"
          >
            {{ props.promptCreateSaving ? "保存中..." : "保存" }}
          </t-button>
          <t-button
            variant="outline"
            theme="primary"
            :disabled="props.promptCreateSaving"
            @click="props.jumpToPromptQuery"
          >
            跳转提示词查询
          </t-button>
          <t-button
            variant="outline"
            theme="default"
            :disabled="props.promptCreateSaving"
            @click="props.clearPromptCreateForm"
          >
            清空
          </t-button>
        </div>
      </div>
    </t-card>

    <t-card class="panel-card quota-card prompt-create-storage-card" :bordered="false">
      <div class="prompt-create-storage-head">
        <div class="prompt-create-storage-label">本地 JSON 路径</div>
        <t-button
          size="small"
          variant="outline"
          theme="default"
          @click="props.copyPromptCreateStoragePath"
        >
          复制路径
        </t-button>
      </div>
      <code class="prompt-create-storage-path">{{ props.promptCreateStoragePath }}</code>
      <div class="prompt-create-storage-meta">已保存 {{ props.promptCreateTotal }} 条提示词</div>
    </t-card>
  </div>
</template>


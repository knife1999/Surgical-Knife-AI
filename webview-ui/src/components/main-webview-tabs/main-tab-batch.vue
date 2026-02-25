<script setup lang="ts">
const props = defineProps<{
  batchQueue: any[];
  state: any;
  runBatchDisabled: boolean;
  clearBatchQueue: () => void;
  removeBatchTask: (taskId: number) => void;
  getTaskMeta: (task: any) => string;
  runBatchQueue: () => void;
}>();
</script>

<template>
  <div class="tab-pane-body tab-pane-batch">
    <t-card class="panel-card batch-head-card">
      <div class="batch-header-row">
        <div>
          <div class="batch-title">批处理任务队列</div>
          <div class="batch-subtitle">任务来自单图页“添加到批处理”</div>
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
    </t-card>

    <t-card class="panel-card batch-list-card batch-queue-card">
      <div v-if="props.batchQueue.length === 0" class="batch-empty">
        暂无任务，请先在“单图处理”页面添加。
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
    </t-card>

    <t-card class="panel-card batch-run-card">
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
    </t-card>
  </div>
</template>


<script setup lang="ts">
const props = defineProps<{
  usageGuideHtml: string;
}>();
</script>

<template>
  <div class="tab-pane-body tab-pane-guide">
    <t-card class="panel-card guide-doc-card">
      <div class="guide-markdown ai-chat-markdown" v-html="props.usageGuideHtml" />
    </t-card>
  </div>
</template>


<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    bordered?: boolean;
    defaultCollapsed?: boolean;
    ariaLabel?: string;
    title?: string;
  }>(),
  {
    defaultCollapsed: false,
    ariaLabel: "折叠面板",
    title: "",
  },
);

const collapsed = ref(Boolean(props.defaultCollapsed));

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value;
};
</script>

<template>
  <t-card class="collapsible-panel-card" :class="{ 'is-collapsed': collapsed }" :bordered="props.bordered">
    <div v-if="props.title || $slots.title" class="panel-collapse-header">
      <div class="panel-collapse-title">
        <slot name="title">{{ props.title }}</slot>
      </div>
      <button
        class="panel-collapse-toggle"
        type="button"
        :aria-label="props.ariaLabel"
        :aria-expanded="String(!collapsed)"
        :title="collapsed ? '展开面板' : '收起面板'"
        @click="toggleCollapsed"
      >
        <span class="panel-collapse-toggle-text">{{ collapsed ? "展开" : "收起" }}</span>
        <span class="panel-collapse-triangle" :class="{ 'is-collapsed': collapsed }">▼</span>
      </button>
    </div>

    <button
      v-else
      class="panel-collapse-toggle panel-collapse-toggle-only"
      type="button"
      :aria-label="props.ariaLabel"
      :aria-expanded="String(!collapsed)"
      :title="collapsed ? '展开面板' : '收起面板'"
      @click="toggleCollapsed"
    >
      <span class="panel-collapse-toggle-text">{{ collapsed ? "展开" : "收起" }}</span>
      <span class="panel-collapse-triangle" :class="{ 'is-collapsed': collapsed }">▼</span>
    </button>

    <div class="panel-collapse-content" :class="{ 'is-collapsed': collapsed }">
      <div class="panel-collapse-content-inner">
        <slot />
      </div>
    </div>
  </t-card>
</template>

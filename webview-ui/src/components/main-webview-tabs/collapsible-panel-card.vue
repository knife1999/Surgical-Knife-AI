<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    bordered?: boolean;
    defaultCollapsed?: boolean;
    ariaLabel?: string;
  }>(),
  {
    defaultCollapsed: false,
    ariaLabel: "折叠面板",
  },
);

const collapsed = ref(Boolean(props.defaultCollapsed));

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value;
};
</script>

<template>
  <t-card class="collapsible-panel-card" :class="{ 'is-collapsed': collapsed }" :bordered="props.bordered">
    <button
      class="panel-collapse-toggle"
      type="button"
      :aria-label="props.ariaLabel"
      :aria-expanded="String(!collapsed)"
      :title="collapsed ? '展开面板' : '收起面板'"
      @click="toggleCollapsed"
    >
      <span class="panel-collapse-triangle" :class="{ 'is-collapsed': collapsed }">▼</span>
    </button>
    <div v-show="!collapsed" class="panel-collapse-content">
      <slot />
    </div>
  </t-card>
</template>


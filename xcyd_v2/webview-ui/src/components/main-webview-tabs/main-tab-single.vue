<script setup lang="ts">
const props = defineProps<{
  form: any;
  state: any;
  sizeOptions: any[];
  layerTypeOptions: any[];
  apiKeyNameSelectOptions: any[];
  runDisabled: boolean;
  addBatchDisabled: boolean;
  quotaDisabled: boolean;
  quotaInfo: any | null;
  previewImage: string;
  openSinglePromptQuickSaveDialog: () => void;
  clearPrompt: () => void;
  setAntiMode: (mode: number) => void;
  runSingleImage: () => void;
  addCurrentToBatch: () => void;
  checkQuota: () => void;
}>();

const singleApiKeyName = defineModel<string>("singleApiKeyName", {required: true});
</script>

<template>
  <div class="tab-pane-body tab-pane-single">
    <t-card class="panel-card single-form-card">
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
            placeholder="请选择 API Key 名称"
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
    </t-card>

    <t-card class="panel-card single-action-card">
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
    </t-card>

    <t-card v-if="props.quotaInfo" class="panel-card quota-card single-quota-card" :bordered="false">
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
        <div class="quota-item">
          <span>2K</span>
          <strong>{{ props.quotaInfo.count2K }}</strong>
        </div>
        <div class="quota-item">
          <span>4K</span>
          <strong>{{ props.quotaInfo.count4K }}</strong>
        </div>
      </div>
    </t-card>

    <t-card v-if="props.previewImage" class="panel-card single-preview-card" :bordered="false">
      <div class="preview-box">
        <img :src="props.previewImage" alt="preview"/>
      </div>
    </t-card>
  </div>
</template>

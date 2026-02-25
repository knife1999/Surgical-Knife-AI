<script setup lang="ts">
const props = defineProps<{
  imagePreviewItems: any[];
  imagePreviewActiveIndex: number;
  imagePreviewPanState: any;
  setImagePreviewInputRef: (el: HTMLInputElement | null) => void;
  setImagePreviewCarouselRef: (el: HTMLDivElement | null) => void;
  onImagePreviewFilesChange: (event: Event) => void;
  openImagePreviewPicker: () => void;
  clearImagePreviewItems: () => void;
  goImagePreviewPrev: () => void;
  onImagePreviewScroll: () => void;
  onImagePreviewWheel: (event: WheelEvent, id: number) => void;
  startImagePreviewPan: (event: MouseEvent, id: number) => void;
  startImagePreviewFrameResize: (event: MouseEvent, id: number) => void;
  removeImagePreviewItem: (id: number) => void;
  goImagePreviewNext: () => void;
}>();
</script>

<template>
  <div class="tab-pane-body tab-pane-image-preview">
    <t-card class="panel-card image-preview-upload-card">
      <div class="image-preview-section">
        <div class="image-preview-head">
          <div class="settings-section-title">图片预览</div>
          <div class="image-preview-subtitle">
            可多选上传，左右滑动切换；滚轮按鼠标点缩放，拖拽图片可平移，拖拽下方信息栏可调整预览框高度
          </div>
        </div>

        <input
          :ref="props.setImagePreviewInputRef"
          class="image-preview-hidden-input"
          type="file"
          accept="image/*"
          multiple
          @change="props.onImagePreviewFilesChange"
        />

        <div class="settings-inline-actions">
          <t-button size="small" theme="primary" @click="props.openImagePreviewPicker">
            选择图片
          </t-button>
          <t-button
            size="small"
            variant="outline"
            theme="default"
            :disabled="props.imagePreviewItems.length === 0"
            @click="props.clearImagePreviewItems"
          >
            清空
          </t-button>
          <span class="image-preview-count">已选择 {{ props.imagePreviewItems.length }} 张</span>
        </div>
      </div>
    </t-card>

    <t-card class="panel-card image-preview-carousel-card" :bordered="false">
      <div v-if="props.imagePreviewItems.length === 0" class="batch-empty">
        暂无图片，请先上传。
      </div>

      <div v-else class="image-preview-carousel-shell">
        <t-button
          class="image-preview-nav"
          size="small"
          variant="outline"
          theme="default"
          :disabled="props.imagePreviewActiveIndex === 0"
          @click="props.goImagePreviewPrev"
        >
          ?
        </t-button>

        <div
          :ref="props.setImagePreviewCarouselRef"
          class="image-preview-carousel"
          @scroll="props.onImagePreviewScroll"
        >
          <div
            v-for="(item, index) in props.imagePreviewItems"
            :key="item.id"
            class="image-preview-slide"
          >
            <div
              class="image-preview-img-wrap"
              :class="{ 'is-panning': props.imagePreviewPanState.dragging && props.imagePreviewPanState.itemId === item.id }"
              :data-preview-id="item.id"
              @wheel.prevent="props.onImagePreviewWheel($event, item.id)"
              @mousedown.prevent="props.startImagePreviewPan($event, item.id)"
              :style="{ height: `${item.frameHeight}px` }"
            >
              <img
                :src="item.url"
                :alt="item.name"
                :style="{ transform: `translate3d(${item.offsetX}px, ${item.offsetY}px, 0) scale(${item.zoom})` }"
              />
              <span class="image-preview-zoom-tag">{{ Math.round(item.zoom * 100) }}%</span>
            </div>

            <div
              class="image-preview-meta image-preview-meta-resize"
              @mousedown.prevent="props.startImagePreviewFrameResize($event, item.id)"
            >
              <span>{{ index + 1 }} / {{ props.imagePreviewItems.length }} · {{ item.name }}</span>
              <t-button
                size="small"
                variant="text"
                theme="danger"
                @click="props.removeImagePreviewItem(item.id)"
              >
                删除
              </t-button>
            </div>
          </div>
        </div>

        <t-button
          class="image-preview-nav"
          size="small"
          variant="outline"
          theme="default"
          :disabled="props.imagePreviewActiveIndex >= props.imagePreviewItems.length - 1"
          @click="props.goImagePreviewNext"
        >
          ?
        </t-button>
      </div>
    </t-card>
  </div>
</template>


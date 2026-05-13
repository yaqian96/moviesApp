<template>
  <view class="mb-6 w-full min-w-0">
    <view v-if="showTitle" class="mb-3 flex items-center justify-between px-1">
      <text class="text-base font-medium text-white">{{ title }}</text>
    </view>
    <!-- #ifdef H5 -->
    <view class="media-row-h5-scroll" @wheel="horizontalWheelScroll">
      <view class="media-row-track">
        <slot />
      </view>
    </view>
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <scroll-view
      scroll-x
      enable-flex
      class="w-full"
      :show-scrollbar="false"
    >
      <view class="media-row-track">
        <slot />
      </view>
    </scroll-view>
    <!-- #endif -->
  </view>
</template>

<script setup>
import { horizontalWheelScroll } from '@/composables/use-horizontal-wheel'

defineProps({
  title: { type: String, default: '' },
  showTitle: { type: Boolean, default: true },
})
</script>

<style scoped>
.media-row-track {
  display: flex;
  width: max-content;
  max-width: none;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 0.75rem;
  padding-bottom: 0.25rem;
}

/* #ifdef H5 */
.media-row-h5-scroll {
  display: block;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  touch-action: pan-x pan-y;
}

@media (pointer: fine) {
  .media-row-h5-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.35) transparent;
  }
  .media-row-h5-scroll::-webkit-scrollbar {
    height: 8px;
  }
  .media-row-h5-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.35);
    border-radius: 4px;
  }
  .media-row-h5-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
}

@media (pointer: coarse) {
  .media-row-h5-scroll {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .media-row-h5-scroll::-webkit-scrollbar {
    display: none;
  }
}
/* #endif */
</style>

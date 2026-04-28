<template>
  <view class="mb-6">
    <view class="mb-3 flex items-center justify-between px-1">
      <text class="text-base font-medium text-white">{{ title }}</text>
    </view>
    <scroll-view scroll-x class="w-full whitespace-nowrap" show-scrollbar="false">
      <view class="inline-flex gap-3 pb-1">
        <slot />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
})
</script>

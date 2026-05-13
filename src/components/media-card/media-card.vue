<template>
  <view
    class="w-64 shrink-0 overflow-hidden rounded-lg bg-card active:opacity-80"
    @click="$emit('click')"
  >
    <image
      class="w-64 bg-white bg-opacity-5"
      :class="aspectRatio === 1 ? 'aspect-square' : 'aspect-[2/3]'"
      :src="poster"
      mode="aspectFill"
    />
    <view class="p-1.5">
      <text class="line-clamp-2 text-xs text-white text-opacity-90">{{ title }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  poster: { type: String, default: '' },
  aspectRatio: { type: Number, default: 2 / 3 },
})
defineEmits(['click'])
</script>

<style scoped>
.bg-card {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
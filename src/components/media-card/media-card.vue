<template>
  <view
    class="w-36 shrink-0 overflow-hidden rounded-lg bg-card active:opacity-80"
    @click="$emit('click')"
  >
    <image
      class="aspect-[2/3] w-full bg-white bg-opacity-5"
      :src="poster"
      mode="aspectFill"
    />
    <view class="p-2">
      <text class="line-clamp-2 text-xs text-white text-opacity-90">{{ title }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  poster: { type: String, default: '' },
})
defineEmits(['click'])
</script>

<style scoped>
.bg-card {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'

onLaunch(() => {
  useUserStore().hydrate()
})
</script>

<style lang="scss">
@import './tailwind.css';
</style>

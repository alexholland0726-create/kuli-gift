<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';

onLaunch(() => {
  console.log('酷礼工坊 App Launch');
});
</script>

<style>
/* 全局样式 */
page {
  background-color: #F8F8F8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #333;
}

/* uview-plus 主题色覆盖 */
:root {
  --u-primary: #D4A574;
  --u-primary-light: #E8C9A8;
  --u-primary-dark: #B8895A;
  --u-bg-color: #F8F8F8;
  --u-border-color: #F0F0F0;
}
</style>

<template>
  <view />
</template>

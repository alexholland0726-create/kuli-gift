<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';

onLaunch(() => {
  console.log('酷礼工坊 App Launch');
});
</script>

<style>
/* 全局样式 */
page {
  --brand-900: #183323;
  --brand-700: #315f40;
  --brand-500: #6aa257;
  --brand-100: #eaf4e5;
  --surface: #ffffff;
  --surface-soft: #f4f7f2;
  --text-main: #18221b;
  --text-muted: #738076;
  --danger: #c95645;
  background-color: #F5F7F3;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #333;
}

.pressable { opacity: .82; transform: scale(.975); }
button::after { border: 0; }
image { display: block; }

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

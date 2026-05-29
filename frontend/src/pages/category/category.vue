<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/index';

const categories = ref<any[]>([]);
const activeIndex = ref(0);

onMounted(async () => {
  try {
    const res = await api.categories.list();
    categories.value = res as any[];
  } catch (e) {}
});

function goProductList(id: number) {
  uni.navigateTo({ url: `/pages/product/list?categoryId=${id}` });
}
</script>

<template>
  <view class="page">
    <view class="cat-grid">
      <view class="cat-card" v-for="cat in categories" :key="cat.id" @tap="goProductList(cat.id)">
        <image :src="cat.icon || '/static/placeholder.png'" class="cat-img" mode="aspectFill" />
        <text class="cat-name">{{ cat.name }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { padding: 20rpx; }
.cat-grid { display: flex; flex-wrap: wrap; gap: 20rpx; }
.cat-card { width: calc(33.33% - 14rpx); background: #fff; border-radius: 16rpx; padding: 20rpx; text-align: center; }
.cat-img { width: 120rpx; height: 120rpx; border-radius: 16rpx; }
.cat-name { font-size: 24rpx; color: #333; margin-top: 12rpx; display: block; }
</style>

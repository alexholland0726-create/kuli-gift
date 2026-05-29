<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { api } from '@/api/index';

const products = ref<any[]>([]);
const categoryId = ref(0);
const keyword = ref('');

onLoad((opt: any) => {
  if (opt.categoryId) categoryId.value = Number(opt.categoryId);
  loadProducts();
});

async function loadProducts() {
  try {
    const res = await api.products.list({ categoryId: categoryId.value || undefined, keyword: keyword.value || undefined });
    products.value = (res as any).items || [];
  } catch (e) {}
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` });
}
</script>

<template>
  <view class="page">
    <view class="search-bar">
      <input v-model="keyword" class="search-input" placeholder="搜索礼品..." @confirm="loadProducts" />
      <text class="search-btn" @tap="loadProducts">搜索</text>
    </view>
    <view class="product-grid">
      <view class="product-card" v-for="item in products" :key="item.id" @tap="goDetail(item.id)">
        <image :src="item.coverImage || '/static/placeholder.png'" class="product-img" mode="aspectFill" />
        <view class="product-info">
          <text class="product-name ellipsis">{{ item.name }}</text>
          <view class="tag-row" v-if="item.tags">
            <text class="tag" v-for="t in item.tags" :key="t">{{ t }}</text>
          </view>
          <view class="price-row">
            <text class="price">¥{{ item.price }}</text>
            <text class="original" v-if="item.originalPrice">¥{{ item.originalPrice }}</text>
          </view>
        </view>
      </view>
    </view>
    <view class="empty" v-if="!products.length">暂无商品</view>
  </view>
</template>

<style scoped>
.page { padding: 20rpx; }
.search-bar { display: flex; margin-bottom: 20rpx; }
.search-input { flex: 1; height: 72rpx; background: #f5f5f5; border-radius: 36rpx; padding: 0 24rpx; font-size: 26rpx; }
.search-btn { margin-left: 16rpx; color: #D4A574; font-size: 28rpx; line-height: 72rpx; }
.product-grid { display: flex; flex-wrap: wrap; gap: 20rpx; }
.product-card { width: calc(50% - 10rpx); background: #fff; border-radius: 16rpx; overflow: hidden; }
.product-img { width: 100%; height: 340rpx; background: #f5f5f5; }
.product-info { padding: 16rpx; }
.product-name { font-size: 26rpx; color: #333; }
.tag-row { margin-top: 8rpx; display: flex; flex-wrap: wrap; gap: 8rpx; }
.tag { background: #F5E6D3; color: #B8895A; font-size: 20rpx; padding: 2rpx 12rpx; border-radius: 6rpx; }
.price-row { margin-top: 10rpx; display: flex; align-items: center; }
.price { font-size: 28rpx; font-weight: 600; color: #D4A574; }
.original { font-size: 22rpx; color: #ccc; text-decoration: line-through; margin-left: 12rpx; }
.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty { text-align: center; color: #999; font-size: 28rpx; padding: 100rpx 0; }
</style>

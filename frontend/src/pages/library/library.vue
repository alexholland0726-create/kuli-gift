<script setup lang="ts">
import { ref } from 'vue';
import { onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app';
import { api } from '@/api/index';
import { demoProducts } from '@/api/mock';

const products = ref<any[]>(demoProducts);
const loading = ref(false);
const activeSort = ref('综合');

const sorts = ['综合', '新品', '价格', '筛选'];
const placeholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><rect width="220" height="220" rx="18" fill="%23f7faf4"/><circle cx="110" cy="86" r="40" fill="%23d7ebcf"/><rect x="58" y="134" width="104" height="30" rx="15" fill="%2393bf82"/></svg>';

onShow(() => {
  enableShareMenu();
  loadProducts();
});

function enableShareMenu() {
  (uni as any).showShareMenu?.({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  });
}

onShareAppMessage(() => ({
  title: '酷礼工坊礼品库｜企业礼品自由选品',
  path: '/pages/library/library',
}));

onShareTimeline(() => ({
  title: '酷礼工坊礼品库｜企业礼品自由选品',
  query: '',
}));

async function loadProducts() {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await api.products.list({ limit: 60 });
    const items = (res as any)?.items || [];
    products.value = items.length ? items : demoProducts;
  } catch (_) {
    products.value = demoProducts;
  } finally {
    loading.value = false;
  }
}

function goSearch() {
  uni.navigateTo({ url: '/pages/search/search' });
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` });
}

function changeSort(sort: string) {
  activeSort.value = sort;
}

function priceLabel(price: number | string) {
  const value = Number(price || 0);
  return value > 0 ? `￥${value.toFixed(2)}` : '询价';
}
</script>

<template>
  <view class="page">
    <view class="top-bar">
      <view class="search" @tap="goSearch">
        <text class="search-mark"></text>
        <text class="search-text">请搜索你想要的礼品</text>
      </view>
    </view>

    <view class="sort-row">
      <text
        class="sort-item"
        :class="{ active: activeSort === sort }"
        v-for="sort in sorts"
        :key="sort"
        @tap="changeSort(sort)"
      >
        {{ sort }}
      </text>
    </view>

    <view class="price-row">
      <view class="price-input">最低价</view>
      <text class="dash">~</text>
      <view class="price-input">最高价</view>
      <view class="price-btn">搜索</view>
    </view>

    <view class="product-grid">
      <view class="product-card" v-for="item in products" :key="item.id" @tap="goDetail(item.id)">
        <image class="product-img" :src="item.coverImage || placeholder" mode="aspectFill" />
        <view class="product-info">
          <view class="tag-line">
            <text class="tag" v-for="tag in (item.tags || []).slice(0, 2)" :key="tag">{{ tag }}</text>
          </view>
          <text class="product-name">{{ item.name }}</text>
          <view class="card-bottom">
            <text class="price">{{ priceLabel(item.price) }}</text>
            <text class="plus">+</text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!loading && !products.length">暂无商品</view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 120rpx;
  background: #f5f6f5;
}

.top-bar {
  padding: 16rpx 22rpx;
  background: #fff;
}

.search {
  display: flex;
  align-items: center;
  height: 66rpx;
  padding: 0 22rpx;
  background: #f5f5f5;
  border-radius: 33rpx;
}

.search-mark {
  width: 24rpx;
  height: 24rpx;
  margin-right: 14rpx;
  border: 4rpx solid #b6b6b6;
  border-radius: 50%;
}

.search-text {
  color: #999;
  font-size: 24rpx;
}

.sort-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 72rpx;
  background: #fff;
  border-top: 1rpx solid #f2f2f2;
}

.sort-item {
  color: #333;
  font-size: 26rpx;
}

.sort-item.active {
  color: #8a6a3f;
  font-weight: 700;
}

.price-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 22rpx;
  background: #fff;
}

.price-input {
  flex: 1;
  height: 56rpx;
  color: #aaa;
  font-size: 24rpx;
  line-height: 56rpx;
  text-align: center;
  background: #f8f8f8;
  border: 1rpx solid #eee;
  border-radius: 8rpx;
}

.dash {
  color: #aaa;
}

.price-btn {
  width: 96rpx;
  height: 56rpx;
  color: #8a6a3f;
  font-size: 24rpx;
  line-height: 56rpx;
  text-align: center;
  border: 1rpx solid #c9ad7d;
  border-radius: 8rpx;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
  padding: 18rpx;
}

.product-card {
  overflow: hidden;
  background: #fff;
  border-radius: 16rpx;
}

.product-img {
  width: 100%;
  height: 220rpx;
  background: #f3f6f1;
}

.product-info {
  padding: 10rpx;
}

.tag-line {
  display: flex;
  gap: 4rpx;
  min-height: 26rpx;
}

.tag {
  padding: 2rpx 5rpx;
  color: #9a783d;
  font-size: 17rpx;
  background: #f7ead4;
  border-radius: 3rpx;
}

.product-name {
  display: -webkit-box;
  height: 68rpx;
  margin-top: 6rpx;
  overflow: hidden;
  color: #333;
  font-size: 22rpx;
  line-height: 34rpx;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8rpx;
}

.price {
  color: #d35b4b;
  font-size: 24rpx;
  font-weight: 700;
}

.plus {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  color: #b48745;
  border: 2rpx solid #d6b678;
  border-radius: 50%;
  font-size: 28rpx;
}

.empty {
  padding: 120rpx 0;
  color: #aaa;
  font-size: 26rpx;
  text-align: center;
}
</style>

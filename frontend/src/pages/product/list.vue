<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onReachBottom } from '@dcloudio/uni-app';
import { api } from '@/api/index';
import { demoProducts } from '@/api/mock';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  coverImage: string;
  sales: number;
  tags: string[];
  categoryId: number;
}

const products = ref<Product[]>(demoProducts);
const categoryId = ref(0);
const keyword = ref('');
const page = ref(1);
const hasMore = ref(true);
const loading = ref(false);
const sortBy = ref('default');
const sortOptions = [
  { label: '综合', value: 'default' },
  { label: '销量', value: 'sales' },
  { label: '新品', value: 'new' },
];

const productPlaceholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="345" height="345" viewBox="0 0 345 345"><rect fill="%23f5f5f5" width="345" height="345"/><text x="172" y="178" text-anchor="middle" fill="%23ccc" font-size="24">暂无图片</text></svg>';

onLoad((opt: any) => {
  if (opt.categoryId) categoryId.value = Number(opt.categoryId);
  if (opt.keyword) keyword.value = opt.keyword;
  products.value = getDemoProducts();
  loadProducts(true);
});

async function loadProducts(reset = false) {
  if (loading.value) return;
  if (!reset && !hasMore.value) return;

  loading.value = true;
  if (reset) {
    page.value = 1;
    products.value = getDemoProducts();
    hasMore.value = true;
  }

  try {
    const params: any = { limit: 10, page: page.value };
    if (categoryId.value) params.categoryId = categoryId.value;
    if (keyword.value) params.keyword = keyword.value;

    const res = await api.products.list(params) as any;
    let items: Product[] = res.items || [];
    if (!items.length && page.value === 1) {
      items = getDemoProducts();
    }

    if (reset) {
      products.value = items;
    } else {
      products.value = [...products.value, ...items];
    }

    hasMore.value = items.length >= 10;
    page.value++;
  } catch (_) {
    if (page.value === 1) {
      products.value = getDemoProducts();
      hasMore.value = false;
    } else {
      uni.showToast({ title: '加载失败', icon: 'none' });
    }
  } finally {
    loading.value = false;
  }
}

function getDemoProducts(): Product[] {
  return demoProducts.filter((item) => {
    const matchCategory = !categoryId.value || item.categoryId === categoryId.value;
    const matchKeyword = !keyword.value || item.name.includes(keyword.value) || item.description.includes(keyword.value);
    return matchCategory && matchKeyword;
  });
}

function onReachBottom() {
  loadProducts();
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` });
}

function doSearch() {
  loadProducts(true);
}

function clearSearch() {
  keyword.value = '';
  loadProducts(true);
}

function changeSort(value: string) {
  sortBy.value = value;
  loadProducts(true);
}
</script>

<template>
  <view class="page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索礼品..."
          :confirm-type="'search'"
          @confirm="doSearch"
        />
        <text v-if="keyword" class="clear-btn" @tap="clearSearch">✕</text>
      </view>
      <text class="search-btn" @tap="doSearch">搜索</text>
    </view>

    <view class="filter-shell">
      <view class="filter-tabs">
        <text
          class="filter-tab"
          :class="{ active: sortBy === opt.value }"
          v-for="opt in sortOptions"
          :key="opt.value"
          @tap="changeSort(opt.value)"
        >{{ opt.label }}</text>
      </view>
      <text class="filter-note">支持定制 · 批量采购 · 礼盒包装</text>
    </view>

    <!-- 商品列表 -->
    <view class="product-grid">
      <view
        class="product-card"
        v-for="item in products"
        :key="item.id"
        @tap="goDetail(item.id)"
      >
        <image
          :src="item.coverImage || productPlaceholder"
          class="product-img"
          mode="aspectFill"
        />
        <view class="product-info">
          <text class="product-name ellipsis">{{ item.name }}</text>
          <view class="tag-row" v-if="item.tags && item.tags.length">
            <text class="tag" v-for="t in item.tags.slice(0, 2)" :key="t">{{ t }}</text>
          </view>
          <view class="price-row">
            <text class="price">¥{{ item.price }}</text>
            <text class="original" v-if="item.originalPrice">¥{{ item.originalPrice }}</text>
          </view>
          <view class="meta-row">
            <text class="sales" v-if="item.sales > 0">已售 {{ item.sales }}</text>
            <text class="custom-tag">可定制</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="loading">
      <text>加载中...</text>
    </view>
    <view class="load-more" v-if="!loading && !hasMore && products.length > 0">
      <text>— 没有更多了 —</text>
    </view>

    <view class="empty" v-if="!loading && !products.length">
      <text class="empty-icon">📦</text>
      <text class="empty-text">暂无商品</text>
    </view>
  </view>
</template>

<style scoped>
.page {
  background: #f6f7f8;
  min-height: 100vh;
  padding-bottom: 40rpx;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}
.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  height: 68rpx;
  background: #f4f5f5;
  border-radius: 12rpx;
  padding: 0 20rpx;
}
.search-icon {
  font-size: 26rpx;
  margin-right: 10rpx;
}
.search-input {
  flex: 1;
  font-size: 26rpx;
  height: 68rpx;
}
.clear-btn {
  font-size: 28rpx;
  color: #ccc;
  padding: 0 8rpx;
}
.search-btn {
  margin-left: 16rpx;
  color: #8d633d;
  font-size: 28rpx;
  font-weight: 500;
}
.filter-shell {
  background: #fff;
  padding: 0 24rpx 20rpx;
  margin-bottom: 16rpx;
}
.filter-tabs {
  display: flex;
  align-items: center;
  gap: 14rpx;
}
.filter-tab {
  height: 54rpx;
  line-height: 54rpx;
  padding: 0 24rpx;
  border-radius: 8rpx;
  background: #f5f5f5;
  color: #6e665e;
  font-size: 24rpx;
}
.filter-tab.active {
  background: #f6eee5;
  color: #8d633d;
  font-weight: 600;
}
.filter-note {
  display: block;
  margin-top: 14rpx;
  color: #9a8d80;
  font-size: 22rpx;
}

/* 商品网格 */
.product-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0 24rpx;
  gap: 16rpx;
}
.product-card {
  width: calc(50% - 8rpx);
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  border: 1rpx solid #f0ece7;
}
.product-img {
  width: 100%;
  height: 345rpx;
  background: #f5f5f5;
}
.product-info {
  padding: 16rpx;
}
.product-name {
  font-size: 26rpx;
  color: #2f2924;
  line-height: 1.4;
  display: block;
}
.tag-row {
  margin-top: 8rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 6rpx;
}
.tag {
  background: #f7efe6;
  color: #8d633d;
  font-size: 20rpx;
  padding: 2rpx 12rpx;
  border-radius: 4rpx;
}
.price-row {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
}
.price {
  font-size: 30rpx;
  font-weight: 600;
  color: #b9824f;
}
.original {
  font-size: 22rpx;
  color: #ccc;
  text-decoration: line-through;
  margin-left: 10rpx;
}
.meta-row {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sales,
.custom-tag {
  font-size: 20rpx;
  color: #999;
}
.custom-tag {
  color: #8d633d;
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 底部 */
.load-more {
  text-align: center;
  padding: 40rpx 0;
  color: #ccc;
  font-size: 24rpx;
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 0;
}
.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}
.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>

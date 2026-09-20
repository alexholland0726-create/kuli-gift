<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onReachBottom, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { api } from '@/api/index';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  coverImage: string;
  sales: number;
  tags: string[];
  categoryId: number;
}

const products = ref<Product[]>([]);
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

const productPlaceholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="345" height="345" viewBox="0 0 345 345"><rect fill="%23f7faf4" width="345" height="345"/><circle cx="172" cy="138" r="58" fill="%23d7ebcf"/><rect x="108" y="214" width="128" height="36" rx="18" fill="%2393bf82"/><text x="172" y="302" text-anchor="middle" fill="%23799a71" font-size="24">礼品图</text></svg>';

onLoad((opt: any) => {
  enableShareMenu();
  if (opt.categoryId) categoryId.value = Number(opt.categoryId);
  if (opt.keyword) keyword.value = decodeURIComponent(opt.keyword);
  loadProducts(true);
});

onReachBottom(() => {
  loadProducts();
});

function enableShareMenu() {
  (uni as any).showShareMenu?.({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  });
}

onShareAppMessage(() => ({
  title: keyword.value ? `酷礼工坊｜${keyword.value}` : '酷礼工坊｜企业礼品精选',
  path: `/pages/product/list?${categoryId.value ? `categoryId=${categoryId.value}` : ''}${keyword.value ? `&keyword=${encodeURIComponent(keyword.value)}` : ''}`,
}));

onShareTimeline(() => ({
  title: keyword.value ? `酷礼工坊｜${keyword.value}` : '酷礼工坊｜企业礼品精选',
  query: `${categoryId.value ? `categoryId=${categoryId.value}` : ''}${keyword.value ? `&keyword=${encodeURIComponent(keyword.value)}` : ''}`,
}));

async function loadProducts(reset = false) {
  if (loading.value) return;
  if (!reset && !hasMore.value) return;

  loading.value = true;
  if (reset) {
    page.value = 1;
    hasMore.value = true;
  }

  try {
    const params: any = { limit: 18, page: page.value, sort: sortBy.value };
    if (categoryId.value) params.categoryId = categoryId.value;
    if (keyword.value) params.keyword = keyword.value;

    const res = await api.products.list(params) as any;
    let items: Product[] = res.items || [];
    products.value = reset ? items : [...products.value, ...items];
    hasMore.value = items.length >= 18;
    page.value++;
  } catch (_) {
    if (page.value === 1) {
      products.value = [];
      hasMore.value = false;
      uni.showToast({ title: '产品加载失败', icon: 'none' });
    } else {
      uni.showToast({ title: '加载失败', icon: 'none' });
    }
  } finally {
    loading.value = false;
  }
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` });
}

function priceLabel(price: number | string) {
  const value = Number(price || 0);
  return value > 0 ? `￥${value.toFixed(2)}` : '询价';
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
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon"></text>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索礼品、品牌或型号"
          confirm-type="search"
          @confirm="doSearch"
        />
        <text v-if="keyword" class="clear-btn" @tap="clearSearch">×</text>
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
        >
          {{ opt.label }}
        </text>
      </view>
      <text class="filter-note">支持定制 · 批量采购 · 礼盒包装</text>
    </view>

    <view class="product-grid">
      <view class="product-card" hover-class="pressable" v-for="item in products" :key="item.id" @tap="goDetail(item.id)">
        <image :src="item.coverImage || productPlaceholder" class="product-img" mode="aspectFill" />
        <view class="product-info">
          <view class="tag-row" v-if="item.tags && item.tags.length">
            <text class="tag" v-for="t in item.tags.slice(0, 2)" :key="t">{{ t }}</text>
          </view>
          <text class="product-name">{{ item.name }}</text>
          <view class="price-row">
            <text class="price">{{ priceLabel(item.price) }}</text>
            <text class="original" v-if="item.originalPrice">￥{{ item.originalPrice }}</text>
          </view>
          <view class="meta-row">
            <text class="sales" v-if="item.sales > 0">已选 {{ item.sales }}</text>
            <text class="custom-tag">可定制</text>
          </view>
        </view>
      </view>
    </view>

    <view class="list-skeleton" v-if="loading && !products.length"><view class="skeleton-card" v-for="i in 4" :key="i"><view class="skeleton-image"></view><view class="skeleton-line"></view><view class="skeleton-line short"></view></view></view>
    <view class="load-more" v-if="loading && products.length">正在加载更多…</view>
    <view class="load-more" v-if="!loading && !hasMore && products.length > 0">— 没有更多了 —</view>
    <view class="empty" v-if="!loading && !products.length">
      <text class="empty-icon">⌕</text>
      <text class="empty-text">暂时没有匹配的礼品</text>
      <text class="empty-hint">换个关键词，或去分类页看看</text>
    </view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 40rpx;
  background: #f6f7f5;
}

.search-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #fff;
}

.search-input-wrap {
  display: flex;
  flex: 1;
  align-items: center;
  height: 68rpx;
  padding: 0 20rpx;
  background: #f4f5f5;
  border-radius: 34rpx;
}

.search-icon {
  width: 24rpx;
  height: 24rpx;
  margin-right: 12rpx;
  border: 4rpx solid #b6b6b6;
  border-radius: 50%;
}

.search-input {
  flex: 1;
  height: 68rpx;
  font-size: 26rpx;
}

.clear-btn {
  padding: 0 8rpx;
  color: #aaa;
  font-size: 32rpx;
}

.search-btn {
  margin-left: 16rpx;
  color: #6fa458;
  font-size: 28rpx;
  font-weight: 600;
}

.filter-shell {
  padding: 0 24rpx 20rpx;
  margin-bottom: 16rpx;
  background: #fff;
}

.filter-tabs {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.filter-tab {
  height: 54rpx;
  padding: 0 24rpx;
  color: #5d675b;
  font-size: 24rpx;
  line-height: 54rpx;
  background: #f5f5f5;
  border-radius: 27rpx;
}

.filter-tab.active {
  color: #4f843f;
  font-weight: 700;
  background: #eaf6e2;
}

.filter-note {
  display: block;
  margin-top: 14rpx;
  color: #8b9688;
  font-size: 22rpx;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
  padding: 0 22rpx;
}

.product-card {
  min-width: 0;
  overflow: hidden;
  background: #fff;
  border: 1rpx solid #e7ede4;
  border-radius: 22rpx;
  box-shadow: 0 10rpx 28rpx rgba(37,66,44,.07);
}

.product-img {
  width: 100%;
  height: 330rpx;
  background: #f4f7f1;
}

.product-info {
  padding: 18rpx;
}

.tag-row {
  display: flex;
  gap: 8rpx;
  min-height: 30rpx;
}

.tag {
  padding: 3rpx 8rpx;
  color: #9a783d;
  font-size: 19rpx;
  background: #f7ead4;
  border-radius: 3rpx;
}

.product-name {
  display: -webkit-box;
  height: 78rpx;
  margin-top: 10rpx;
  overflow: hidden;
  color: #333;
  font-size: 27rpx;
  font-weight: 650;
  line-height: 39rpx;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.price-row {
  display: flex;
  align-items: center;
  margin-top: 8rpx;
}

.price {
  color: #d35b4b;
  font-size: 30rpx;
  font-weight: 700;
}

.original {
  margin-left: 8rpx;
  color: #aaa;
  font-size: 21rpx;
  text-decoration: line-through;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8rpx;
}

.sales,
.custom-tag {
  color: #999;
  font-size: 18rpx;
}

.custom-tag {
  color: #6fa458;
}

.load-more {
  padding: 40rpx 0;
  color: #aaa;
  font-size: 24rpx;
  text-align: center;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 0;
}

.empty-icon {
  margin-bottom: 20rpx;
  color: #aaa;
  font-size: 80rpx;
}

.empty-text {
  color: #999;
  font-size: 28rpx;
}
.empty-hint { margin-top: 12rpx; color: #a1aaa2; font-size: 23rpx; }
.list-skeleton { display:grid; grid-template-columns:repeat(2,1fr); gap:18rpx; padding:0 22rpx; }
.skeleton-card { overflow:hidden; background:#fff; border-radius:22rpx; }
.skeleton-image,.skeleton-line { background:linear-gradient(90deg,#edf1eb 25%,#f8faf6 50%,#edf1eb 75%); background-size:200% 100%; animation:shimmer 1.25s infinite; }
.skeleton-image { height:330rpx; }.skeleton-line { width:75%; height:26rpx; margin:20rpx; border-radius:13rpx; }.skeleton-line.short { width:45%; margin-top:0; }
@keyframes shimmer { from { background-position:200% 0; } to { background-position:-200% 0; } }
</style>

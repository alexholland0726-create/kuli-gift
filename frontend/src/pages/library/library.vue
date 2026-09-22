<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app';
import { api } from '@/api/index';

const products = ref<any[]>([]);
const loading = ref(false);
const activeSort = ref('综合');
const minPrice = ref('');
const maxPrice = ref('');
const priceFilterApplied = ref(false);

const sorts = ['综合', '销量', '新品', '价格'];
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
    const sort = activeSort.value === '销量' ? 'sales' : activeSort.value === '新品' ? 'new' : 'default';
    const res = await api.products.list({ limit: 100, sort });
    const items = (res as any)?.items || [];
    products.value = items;
  } catch (_) {
    products.value = [];
    uni.showToast({ title: '产品加载失败', icon: 'none' });
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
  if (activeSort.value === sort) return;
  activeSort.value = sort;
  if (sort !== '价格') loadProducts();
}

const displayProducts = computed(() => {
  const min = priceFilterApplied.value && minPrice.value !== '' ? Number(minPrice.value) : null;
  const max = priceFilterApplied.value && maxPrice.value !== '' ? Number(maxPrice.value) : null;
  const filtered = products.value.filter((item) => {
    const price = Number(item.price || 0);
    if (min !== null && price < min) return false;
    if (max !== null && price > max) return false;
    return true;
  });
  if (activeSort.value === '价格') return [...filtered].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  return filtered;
});

function applyPriceFilter() {
  const min = minPrice.value === '' ? null : Number(minPrice.value);
  const max = maxPrice.value === '' ? null : Number(maxPrice.value);
  if ((min !== null && (!Number.isFinite(min) || min < 0)) || (max !== null && (!Number.isFinite(max) || max < 0))) {
    uni.showToast({ title: '请输入正确的价格', icon: 'none' }); return;
  }
  if (min !== null && max !== null && min > max) {
    uni.showToast({ title: '最低价不能高于最高价', icon: 'none' }); return;
  }
  priceFilterApplied.value = true;
  uni.showToast({ title: `找到 ${displayProducts.value.length} 件礼品`, icon: 'none' });
}

function clearPriceFilter() {
  minPrice.value = ''; maxPrice.value = ''; priceFilterApplied.value = false;
}

function goInquiry(id: number) {
  uni.navigateTo({ url: `/pages/inquiry/inquiry?id=${id}` });
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
      <input v-model="minPrice" class="price-input" type="digit" placeholder="最低价" @confirm="applyPriceFilter" />
      <text class="dash">~</text>
      <input v-model="maxPrice" class="price-input" type="digit" placeholder="最高价" @confirm="applyPriceFilter" />
      <view class="price-btn" hover-class="pressable" @tap="applyPriceFilter">筛选</view>
      <view v-if="priceFilterApplied" class="price-clear" hover-class="pressable" @tap="clearPriceFilter">清除</view>
    </view>

    <view class="result-summary"><text>共 {{ displayProducts.length }} 件礼品</text><text>支持批量采购与企业定制</text></view>

    <view class="product-grid">
      <view class="product-card" hover-class="pressable" v-for="item in displayProducts" :key="item.id" @tap="goDetail(item.id)">
        <image class="product-img" :src="item.coverImage || placeholder" mode="aspectFill" />
        <view class="product-info">
          <view class="tag-line">
            <text class="tag" v-for="tag in (item.tags || []).slice(0, 2)" :key="tag">{{ tag }}</text>
          </view>
          <text class="product-name">{{ item.name }}</text>
          <view class="card-bottom">
            <text class="price">{{ priceLabel(item.price) }}</text>
            <text class="inquiry-link" hover-class="pressable" @tap.stop="goInquiry(item.id)">询价</text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!loading && !displayProducts.length"><text>暂时没有符合条件的礼品</text><text class="empty-action" v-if="priceFilterApplied" @tap="clearPriceFilter">清除价格筛选</text></view>
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
  color: #333;
  font-size: 24rpx;
  line-height: 56rpx;
  text-align: center;
  background: #f8f8f8;
  border: 1rpx solid #eee;
  border-radius: 8rpx;
  box-sizing: border-box;
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
.price-clear { color:#758071; font-size:22rpx; white-space:nowrap; }
.result-summary { display:flex; justify-content:space-between; padding:2rpx 24rpx 16rpx; color:#8a9487; font-size:21rpx; }

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
  padding: 18rpx 22rpx;
}

.product-card {
  overflow: hidden;
  background: #fff;
  border-radius: 16rpx;
}

.product-img {
  width: 100%;
  height: 324rpx;
  background: #f3f6f1;
}

.product-info {
  padding: 16rpx;
}

.tag-line {
  display: flex;
  gap: 4rpx;
  min-height: 26rpx;
}

.tag {
  padding: 2rpx 5rpx;
  color: #9a783d;
  font-size: 19rpx;
  background: #f7ead4;
  border-radius: 3rpx;
}

.product-name {
  display: -webkit-box;
  height: 76rpx;
  margin-top: 6rpx;
  overflow: hidden;
  color: #333;
  font-size: 27rpx;
  font-weight: 650;
  line-height: 38rpx;
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
  font-size: 29rpx;
  font-weight: 700;
}

.inquiry-link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 72rpx;
  height: 42rpx;
  padding:0 12rpx;
  color: #b48745;
  border: 2rpx solid #d6b678;
  border-radius: 999rpx;
  font-size: 21rpx;
}

.empty {
  padding: 120rpx 0;
  color: #aaa;
  font-size: 26rpx;
  text-align: center;
}
.empty text { display:block; }.empty-action { margin-top:20rpx; color:#5f914d; }
</style>

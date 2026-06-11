<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { api } from '@/api/index';
import { demoCategories, demoProducts } from '@/api/mock';

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  coverImage: string;
  sales: number;
}

const categories = ref<Category[]>(demoCategories);
const activeIndex = ref(0);
const products = ref<Product[]>(demoProducts.filter((item) => item.categoryId === demoCategories[0].id));
const loading = ref(false);

const productPlaceholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280"><rect fill="%23f5f5f5" width="280" height="280"/><text x="140" y="145" text-anchor="middle" fill="%23ccc" font-size="20">暂无图片</text></svg>';

onMounted(async () => {
  try {
    const res = await api.categories.list();
    const realCategories = Array.isArray(res) ? res : [];
    if (realCategories.length) categories.value = realCategories;
    if (categories.value.length > 0) {
      loadProducts(categories.value[0].id);
    }
  } catch (_) {
    categories.value = demoCategories;
    loadProducts(categories.value[0].id);
  }
});

function selectCategory(index: number) {
  activeIndex.value = index;
  const cat = categories.value[index];
  if (cat) loadProducts(cat.id);
}

async function loadProducts(categoryId: number) {
  loading.value = true;
  try {
    const res = await api.products.list({ categoryId, limit: 50 }) as any;
    products.value = res.items || [];
    if (!products.value.length) {
      products.value = demoProducts.filter((item) => item.categoryId === categoryId);
    }
  } catch (_) {
    products.value = demoProducts.filter((item) => item.categoryId === categoryId);
  } finally {
    loading.value = false;
  }
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` });
}
</script>

<template>
  <view class="page">
    <!-- 左侧分类导航 -->
    <scroll-view class="left-nav" scroll-y>
      <view
        class="nav-item"
        :class="{ active: activeIndex === i }"
        v-for="(cat, i) in categories"
        :key="cat.id"
        @tap="selectCategory(i)"
      >
        <text class="nav-text">{{ cat.name }}</text>
      </view>
    </scroll-view>

    <!-- 右侧商品列表 -->
    <scroll-view class="right-content" scroll-y>
      <view class="content-header">
        <view>
          <text class="header-title">{{ categories[activeIndex]?.name || '全部礼品' }}</text>
          <text class="header-subtitle">支持企业采购、定制包装、批量交付</text>
        </view>
      </view>
      <view class="guide-card">
        <text class="guide-title">礼赠方案预留位</text>
        <text class="guide-desc">后续可接入场景方案、预算筛选和企业报价入口</text>
      </view>
      <view class="product-list" v-if="!loading">
        <view
          class="product-item"
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
            <text class="product-service">可加 LOGO / 礼盒包装</text>
            <view class="price-line">
              <text class="product-price">¥{{ item.price }}</text>
              <text class="product-original" v-if="item.originalPrice">¥{{ item.originalPrice }}</text>
            </view>
          </view>
        </view>
      </view>
      <view class="loading-text" v-if="loading">加载中...</view>
      <view class="empty-text" v-if="!loading && !products.length">该分类暂无商品</view>
    </scroll-view>
  </view>
</template>

<style scoped>
.page {
  display: flex;
  height: 100vh;
  background: #f6f7f8;
}

/* 左侧导航 */
.left-nav {
  width: 180rpx;
  background: #f4f2ef;
  flex-shrink: 0;
}
.nav-item {
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.nav-item.active {
  background: #fff;
  font-weight: 600;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20rpx;
  bottom: 20rpx;
  width: 6rpx;
  background: #b9824f;
  border-radius: 3rpx;
}
.nav-text {
  font-size: 26rpx;
  color: #333;
}
.nav-item.active .nav-text {
  color: #8d633d;
}

/* 右侧内容 */
.right-content {
  flex: 1;
  padding: 20rpx;
}
.content-header {
  margin-bottom: 16rpx;
  padding: 4rpx 0;
}
.header-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #2f2924;
}
.header-subtitle {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #9a8d80;
}
.guide-card {
  margin-bottom: 18rpx;
  padding: 20rpx;
  background: #fff7ec;
  border-radius: 12rpx;
}
.guide-title {
  display: block;
  color: #2f2924;
  font-size: 25rpx;
  font-weight: 650;
}
.guide-desc {
  display: block;
  margin-top: 8rpx;
  color: #8a7a6a;
  font-size: 21rpx;
}
.product-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.product-item {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  border: 1rpx solid #f0ece7;
}
.product-img {
  width: 200rpx;
  height: 200rpx;
  flex-shrink: 0;
  background: #f5f5f5;
}
.product-info {
  flex: 1;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.product-name {
  font-size: 26rpx;
  color: #2f2924;
  display: block;
  line-height: 1.4;
}
.product-service {
  display: block;
  margin-top: 10rpx;
  color: #9a8d80;
  font-size: 21rpx;
}
.price-line {
  display: flex;
  align-items: baseline;
  margin-top: 12rpx;
}
.product-price {
  font-size: 30rpx;
  font-weight: 600;
  color: #b9824f;
  display: block;
}
.product-original {
  font-size: 22rpx;
  color: #ccc;
  text-decoration: line-through;
  margin-left: 10rpx;
  display: block;
}
.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.loading-text, .empty-text {
  text-align: center;
  padding: 80rpx 0;
  color: #999;
  font-size: 26rpx;
}
</style>

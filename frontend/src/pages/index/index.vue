<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/index';

const categories = ref<any[]>([]);
const recommendProducts = ref<any[]>([]);
const currentCategory = ref(0);

const banners = [
  'https://via.placeholder.com/750x300/F5E6D3/D4A574?text=酷礼工坊',
  'https://via.placeholder.com/750x300/F5E6D3/D4A574?text=精选好礼',
  'https://via.placeholder.com/750x300/F5E6D3/D4A574?text=送礼佳品',
];

onMounted(async () => {
  try {
    const [catRes, proRes] = await Promise.all([
      api.categories.list(),
      api.products.list({ recommended: true, limit: 10 }),
    ]);
    categories.value = catRes as any[];
    recommendProducts.value = (proRes as any).items || [];
  } catch (e) {
    console.error('load error', e);
  }
});

function goCategory(id: number) {
  uni.navigateTo({ url: `/pages/product/list?categoryId=${id}` });
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` });
}
</script>

<template>
  <view class="page">
    <!-- 搜索条 -->
    <view class="search-bar">
      <view class="search-input" @tap="uni.navigateTo({url:'/pages/product/list'})">
        <text class="search-icon">🔍</text>
        <text class="search-text">搜索礼品...</text>
      </view>
    </view>

    <!-- Banner Swiper -->
    <swiper class="banner" autoplay circular indicator-dots indicator-color="rgba(255,255,255,0.4)" indicator-active-color="#D4A574">
      <swiper-item v-for="(b, i) in banners" :key="i">
        <image :src="b" class="banner-img" mode="scaleToFill" />
      </swiper-item>
    </swiper>

    <!-- 快捷分类 -->
    <view class="quick-categories">
      <view class="cat-item" v-for="cat in categories" :key="cat.id" @tap="goCategory(cat.id)">
        <view class="cat-icon">{{ cat.icon || '🎁' }}</view>
        <text class="cat-name">{{ cat.name }}</text>
      </view>
    </view>

    <!-- 推荐商品 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">精选好礼</text>
        <text class="section-more" @tap="goCategory(0)">查看更多 ›</text>
      </view>
      <view class="product-grid">
        <view class="product-card" v-for="item in recommendProducts" :key="item.id" @tap="goDetail(item.id)">
          <image :src="item.coverImage || '/static/placeholder.png'" class="product-img" mode="aspectFill" />
          <view class="product-info">
            <text class="product-name ellipsis">{{ item.name }}</text>
            <view class="product-price-row">
              <text class="product-price">¥{{ item.price }}</text>
              <text class="product-original" v-if="item.originalPrice">¥{{ item.originalPrice }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; padding-bottom: 20rpx; }
.search-bar { padding: 20rpx 30rpx; background: #fff; }
.search-input { display: flex; align-items: center; background: #F5F5F5; border-radius: 50rpx; padding: 16rpx 30rpx; }
.search-icon { font-size: 28rpx; margin-right: 12rpx; }
.search-text { font-size: 26rpx; color: #999; }
.banner { width: 100%; height: 320rpx; }
.banner-img { width: 100%; height: 100%; }
.quick-categories { display: flex; padding: 30rpx; background: #fff; flex-wrap: wrap; }
.cat-item { display: flex; flex-direction: column; align-items: center; width: 20%; margin-bottom: 20rpx; }
.cat-icon { width: 80rpx; height: 80rpx; border-radius: 50%; background: #F5E6D3; display: flex; align-items: center; justify-content: center; font-size: 36rpx; }
.cat-name { font-size: 22rpx; color: #666; margin-top: 10rpx; }
.section { margin: 20rpx 30rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.section-title { font-size: 32rpx; font-weight: 600; color: #333; }
.section-more { font-size: 24rpx; color: #D4A574; }
.product-grid { display: flex; flex-wrap: wrap; gap: 20rpx; }
.product-card { width: calc(50% - 10rpx); background: #fff; border-radius: 16rpx; overflow: hidden; }
.product-img { width: 100%; height: 350rpx; background: #f5f5f5; }
.product-info { padding: 16rpx; }
.product-name { font-size: 26rpx; color: #333; line-height: 1.4; display: block; }
.product-price-row { display: flex; align-items: center; margin-top: 10rpx; }
.product-price { font-size: 28rpx; font-weight: 600; color: #D4A574; }
.product-original { font-size: 22rpx; color: #ccc; text-decoration: line-through; margin-left: 12rpx; }
.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>

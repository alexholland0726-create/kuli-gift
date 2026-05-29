<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { api } from '@/api/index';

const product = ref<any>(null);
const id = ref(0);

onLoad((opt: any) => {
  if (opt.id) {
    id.value = Number(opt.id);
    loadProduct();
  }
});

async function loadProduct() {
  try {
    const res = await api.products.detail(id.value);
    product.value = res as any;
  } catch (e) {
    uni.showToast({ title: '商品不存在', icon: 'none' });
  }
}

function shareProduct() {
  if (!product.value) return;
  api.share.record(product.value.id).catch(() => {});
  uni.share({
    provider: 'weixin',
    scene: 'session',
    type: 0,
    title: product.value.shareTitle || product.value.name,
    summary: product.value.shareDesc || '',
    imageUrl: product.value.coverImage,
    success: () => uni.showToast({ title: '分享成功 +10积分', icon: 'none' }),
  });
}

function goBuy() {
  if (!product.value) return;
  uni.showToast({ title: '正在开发中...', icon: 'none' });
}
</script>

<template>
  <view class="page" v-if="product">
    <swiper class="detail-swiper" autoplay circular indicator-dots indicator-color="rgba(255,255,255,0.4)" indicator-active-color="#D4A574">
      <swiper-item v-for="(img, i) in product.images" :key="i">
        <image :src="img" class="swiper-img" mode="aspectFill" />
      </swiper-item>
    </swiper>

    <view class="product-main">
      <view class="price-row">
        <text class="price">¥{{ product.price }}</text>
        <text class="original" v-if="product.originalPrice">¥{{ product.originalPrice }}</text>
      </view>
      <text class="product-title">{{ product.name }}</text>
      <text class="product-desc" v-if="product.description">{{ product.description }}</text>
    </view>

    <view class="action-bar">
      <view class="action-item" @tap="shareProduct">
        <text>📤</text>
        <text class="action-text">分享</text>
      </view>
      <view class="action-item" @tap="goBuy">
        <text>🛒</text>
        <text class="action-text">购买</text>
      </view>
      <view class="buy-btn" @tap="goBuy">立即购买</view>
    </view>
  </view>

  <view class="empty-page" v-else>
    <text>加载中...</text>
  </view>
</template>

<style scoped>
.detail-swiper { width: 100%; height: 750rpx; }
.swiper-img { width: 100%; height: 100%; }
.product-main { padding: 30rpx; background: #fff; }
.price-row { display: flex; align-items: center; }
.price { font-size: 40rpx; font-weight: 700; color: #D4A574; }
.original { font-size: 26rpx; color: #ccc; text-decoration: line-through; margin-left: 16rpx; }
.product-title { font-size: 32rpx; color: #333; font-weight: 500; margin-top: 16rpx; display: block; line-height: 1.5; }
.product-desc { font-size: 26rpx; color: #999; margin-top: 16rpx; display: block; line-height: 1.6; }
.action-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: center; background: #fff; padding: 16rpx 30rpx; border-top: 1rpx solid #f0f0f0; }
.action-item { display: flex; flex-direction: column; align-items: center; margin-right: 40rpx; font-size: 20rpx; color: #666; }
.action-text { margin-top: 4rpx; }
.buy-btn { flex: 1; background: linear-gradient(135deg, #D4A574, #B8895A); color: #fff; text-align: center; height: 80rpx; line-height: 80rpx; border-radius: 40rpx; font-size: 30rpx; }
.empty-page { display: flex; justify-content: center; padding: 200rpx 0; color: #999; }
</style>

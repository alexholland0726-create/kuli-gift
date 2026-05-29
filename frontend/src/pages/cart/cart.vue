<script setup lang="ts">
import { ref } from 'vue';

const cartItems = ref<any[]>([]);

function goLogin() {
  uni.navigateTo({ url: '/pages/user/user' });
}
</script>

<template>
  <view class="page">
    <view class="empty-cart" v-if="!cartItems.length">
      <text class="empty-icon">🛒</text>
      <text class="empty-text">购物车是空的</text>
      <view class="go-btn" @tap="uni.switchTab({url:'/pages/index/index'})">去逛逛</view>
    </view>
  </view>
</template>

<style scoped>
.empty-cart { display: flex; flex-direction: column; align-items: center; padding: 200rpx 0; }
.empty-icon { font-size: 120rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-bottom: 40rpx; }
.go-btn { background: #D4A574; color: #fff; padding: 16rpx 60rpx; border-radius: 40rpx; font-size: 28rpx; }
</style>

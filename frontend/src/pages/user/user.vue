<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/index';

const userInfo = ref<any>(null);

onMounted(async () => {
  try {
    const res = await api.user.info();
    userInfo.value = res as any;
  } catch (e) {}
});

function goOrders() {
  uni.navigateTo({ url: '/pages/order/list' });
}

function goShare() {
  uni.navigateTo({ url: '/pages/share/share' });
}

function login() {
  uni.login({
    provider: 'weixin',
    success: (res) => {
      const code = res.code;
      api.user.login(code || 'mock_openid', { nickname: '微信用户' }).then((r: any) => {
        uni.setStorageSync('token', r.token);
        userInfo.value = r.user;
      });
    },
  });
}
</script>

<template>
  <view class="page">
    <view class="user-header">
      <view class="user-avatar">
        <image :src="userInfo?.avatar || '/static/placeholder.png'" class="avatar-img" mode="aspectFill" />
      </view>
      <text class="user-name">{{ userInfo?.nickname || '点击登录' }}</text>
      <view class="login-btn" v-if="!userInfo" @tap="login">微信登录</view>
    </view>

    <view class="menu-grid">
      <view class="menu-item" @tap="goOrders">
        <text class="menu-icon">📋</text>
        <text class="menu-text">我的订单</text>
      </view>
      <view class="menu-item" @tap="goShare">
        <text class="menu-icon">📤</text>
        <text class="menu-text">分享记录</text>
      </view>
      <view class="menu-item">
        <text class="menu-icon">⭐</text>
        <text class="menu-text">积分 {{ userInfo?.points || 0 }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.user-header { display: flex; flex-direction: column; align-items: center; padding: 60rpx 0; background: linear-gradient(135deg, #F5E6D3, #E8C9A8); }
.user-avatar { width: 120rpx; height: 120rpx; border-radius: 60rpx; overflow: hidden; border: 4rpx solid #fff; }
.avatar-img { width: 100%; height: 100%; }
.user-name { font-size: 32rpx; font-weight: 500; color: #333; margin-top: 16rpx; }
.login-btn { margin-top: 16rpx; background: #D4A574; color: #fff; padding: 10rpx 40rpx; border-radius: 30rpx; font-size: 26rpx; }
.menu-grid { display: flex; margin: 30rpx; background: #fff; border-radius: 16rpx; padding: 30rpx; }
.menu-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
.menu-icon { font-size: 48rpx; }
.menu-text { font-size: 24rpx; color: #666; margin-top: 10rpx; }
</style>

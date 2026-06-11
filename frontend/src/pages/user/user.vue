<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api } from '@/api/index';
import { demoUser } from '@/api/mock';

const userInfo = ref<any>(null);
const isDemoMode = ref(false);
const loginLoading = ref(false);

onShow(async () => {
  const cachedUser = uni.getStorageSync('demoUser');
  if (cachedUser) {
    userInfo.value = cachedUser;
    isDemoMode.value = true;
    return;
  }

  const token = uni.getStorageSync('token');
  if (!token) return;

  try {
    const res = await api.user.info();
    userInfo.value = res as any;
  } catch (_) {}
});

function goOrders() {
  uni.navigateTo({ url: '/pages/order/list' });
}

function goAddresses() {
  uni.navigateTo({ url: '/pages/address/list' });
}

function goCoupons() {
  uni.navigateTo({ url: '/pages/coupon/list' });
}

function goShare() {
  uni.navigateTo({ url: '/pages/share/share' });
}

function login() {
  if (loginLoading.value) return;
  loginLoading.value = true;

  uni.login({
    provider: 'weixin',
    success: (res) => {
      api.user.login(res.code || 'mock_openid', { nickname: '微信用户' }).then((r: any) => {
        uni.removeStorageSync('demoUser');
        uni.setStorageSync('token', r.token);
        isDemoMode.value = false;
        userInfo.value = r.user;
        uni.showToast({ title: '登录成功', icon: 'success' });
      }).catch(() => {
        useDemoLogin();
      }).finally(() => {
        loginLoading.value = false;
      });
    },
    fail: () => {
      useDemoLogin();
      loginLoading.value = false;
    },
  });
}

function useDemoLogin() {
  isDemoMode.value = true;
  userInfo.value = demoUser;
  uni.setStorageSync('demoUser', demoUser);
  uni.setStorageSync('token', 'demo_token');
  uni.showToast({ title: '体验登录成功', icon: 'none' });
}

const menuItems = [
  { icon: '📋', text: '我的订单', action: goOrders },
  { icon: '📍', text: '收货地址', action: goAddresses },
  { icon: '🎫', text: '优惠券', action: goCoupons },
  { icon: '📤', text: '分享记录', action: goShare },
];
</script>

<template>
  <view class="page">
    <!-- 用户头部 -->
    <view class="user-header">
      <view class="user-avatar">
        <image :src="userInfo?.avatar || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22 viewBox=%220 0 120 120%22><rect fill=%22%23f0e0cc%22 width=%22120%22 height=%22120%22 rx=%2260%22/><text x=%2260%22 y=%2268%22 text-anchor=%22middle%22 fill=%22%23B8895A%22 font-size=%2242%22>君</text></svg>'" class="avatar-img" mode="aspectFill" />
      </view>
      <text class="user-name">{{ userInfo?.nickname || '点击登录' }}</text>
      <text class="demo-label" v-if="isDemoMode">API 未连接，当前为体验账号</text>
      <view class="login-btn" v-if="!userInfo" @tap="login">{{ loginLoading ? '登录中...' : '微信登录' }}</view>
    </view>

    <!-- 积分/等级 -->
    <view class="stats-row" v-if="userInfo">
      <view class="stat-item">
        <text class="stat-num">{{ userInfo.points || 0 }}</text>
        <text class="stat-label">积分</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-num">{{ userInfo.level || '普通' }}</text>
        <text class="stat-label">等级</text>
      </view>
    </view>

    <!-- 菜单网格 -->
    <view class="menu-grid">
      <view class="menu-item" v-for="item in menuItems" :key="item.text" @tap="item.action()">
        <text class="menu-icon">{{ item.icon }}</text>
        <text class="menu-text">{{ item.text }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { background: #f8f8f8; min-height: 100vh; }

.user-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
  background: linear-gradient(135deg, #F5E6D3, #E8C9A8);
}
.user-avatar { width: 120rpx; height: 120rpx; border-radius: 60rpx; overflow: hidden; border: 4rpx solid #fff; }
.avatar-img { width: 100%; height: 100%; }
.user-name { font-size: 32rpx; font-weight: 500; color: #333; margin-top: 16rpx; }
.demo-label { margin-top: 8rpx; color: #8d633d; font-size: 22rpx; }
.login-btn { margin-top: 16rpx; background: #D4A574; color: #fff; padding: 10rpx 40rpx; border-radius: 30rpx; font-size: 26rpx; }

.stats-row {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 30rpx;
  margin-top: -30rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 0;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
  position: relative;
  z-index: 2;
}
.stat-item { flex: 1; text-align: center; }
.stat-num { font-size: 36rpx; font-weight: 700; color: #D4A574; display: block; }
.stat-label { font-size: 22rpx; color: #999; margin-top: 4rpx; display: block; }
.stat-divider { width: 1rpx; height: 40rpx; background: #f0f0f0; }

.menu-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  margin: 30rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  gap: 20rpx;
}
.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 0;
}
.menu-icon { font-size: 48rpx; }
.menu-text { font-size: 24rpx; color: #666; margin-top: 10rpx; }
</style>

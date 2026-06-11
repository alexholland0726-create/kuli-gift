<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api } from '@/api/index';
import { demoUser } from '@/api/mock';

const userInfo = ref<any>(demoUser);
const loginLoading = ref(false);

onShow(async () => {
  const token = uni.getStorageSync('token');
  if (!token) {
    userInfo.value = demoUser;
    return;
  }

  try {
    const res = await api.user.info();
    userInfo.value = res || demoUser;
  } catch (_) {
    userInfo.value = demoUser;
  }
});

function login() {
  if (loginLoading.value) return;
  loginLoading.value = true;
  uni.login({
    provider: 'weixin',
    success: (res) => {
      api.user.login(res.code || '', { nickname: '微信用户' }).then((r: any) => {
        uni.setStorageSync('token', r.token);
        userInfo.value = r.user;
        uni.showToast({ title: '登录成功', icon: 'success' });
      }).catch(() => {
        uni.showToast({ title: '暂用体验账号', icon: 'none' });
        userInfo.value = demoUser;
      }).finally(() => {
        loginLoading.value = false;
      });
    },
    fail: () => {
      loginLoading.value = false;
      uni.showToast({ title: '暂用体验账号', icon: 'none' });
    },
  });
}

const stats = [
  { label: '积分', key: 'points' },
  { label: '购物车', key: 'cartCount' },
  { label: '收藏', key: 'favoriteCount' },
  { label: '足迹', key: 'footprintCount' },
];

const orderItems = [
  { icon: '□', text: '待付款', url: '/pages/order/list?status=pending' },
  { icon: '◇', text: '待收货', url: '/pages/order/list?status=shipped' },
  { icon: '￥', text: '退款/售后', url: '/pages/order/list?status=refund' },
  { icon: '▤', text: '全部订单', url: '/pages/order/list' },
];

const serviceItems = [
  { icon: '☰', text: '全部方案', url: '/pages/product/list' },
  { icon: '▣', text: '制作方案', url: '/pages/share/share' },
  { icon: '☎', text: '电话客服', url: '' },
  { icon: '☷', text: '微信客服', url: '' },
  { icon: '⌖', text: '我的地址', url: '/pages/address/list' },
  { icon: '▦', text: '二维码', url: '' },
];

function openItem(url: string) {
  if (!url) {
    uni.showToast({ title: '客服入口待配置', icon: 'none' });
    return;
  }
  uni.navigateTo({ url });
}
</script>

<template>
  <view class="page">
    <view class="profile">
      <view class="title">我的</view>
      <view class="profile-row">
        <view class="avatar">
          <text class="avatar-text">礼</text>
        </view>
        <view class="profile-main" @tap="!userInfo && login()">
          <text class="user-id">ID:{{ userInfo?.id || '未登录' }}</text>
          <text class="phone">联系方式：{{ userInfo?.phone || '点击登录后完善' }}</text>
        </view>
        <view class="member-card">名片</view>
      </view>
      <view class="login-btn" v-if="!uni.getStorageSync('token')" @tap="login">
        {{ loginLoading ? '登录中...' : '微信登录' }}
      </view>
    </view>

    <view class="stats-row">
      <view class="stat-item" v-for="item in stats" :key="item.key">
        <text class="stat-num">{{ userInfo?.[item.key] || 0 }}</text>
        <text class="stat-label">{{ item.label }}</text>
      </view>
    </view>

    <view class="panel order-panel">
      <view class="grid four">
        <view class="grid-item" v-for="item in orderItems" :key="item.text" @tap="openItem(item.url)">
          <text class="grid-icon">{{ item.icon }}</text>
          <text class="grid-text">{{ item.text }}</text>
        </view>
      </view>
    </view>

    <view class="panel">
      <view class="grid four">
        <view class="grid-item" v-for="item in serviceItems" :key="item.text" @tap="openItem(item.url)">
          <text class="grid-icon">{{ item.icon }}</text>
          <text class="grid-text">{{ item.text }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 120rpx;
  background: #f5f5f5;
}

.profile {
  padding: 42rpx 34rpx 108rpx;
  background: linear-gradient(180deg, #dfcdb5 0%, #eee5d8 100%);
}

.title {
  margin-bottom: 56rpx;
  color: #333;
  font-size: 44rpx;
  font-weight: 750;
}

.profile-row {
  display: flex;
  align-items: center;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 132rpx;
  height: 132rpx;
  overflow: hidden;
  background: rgba(255, 255, 255, .85);
  border: 6rpx solid #fff;
  border-radius: 50%;
}

.avatar-text {
  color: #c8a579;
  font-size: 52rpx;
  font-weight: 700;
}

.profile-main {
  flex: 1;
  min-width: 0;
  margin-left: 28rpx;
}

.user-id {
  display: block;
  color: #333;
  font-size: 38rpx;
  font-weight: 700;
}

.phone {
  display: block;
  margin-top: 20rpx;
  color: #555;
  font-size: 26rpx;
}

.member-card {
  padding: 10rpx 16rpx;
  color: #fff;
  background: #333;
  border-radius: 8rpx;
  font-size: 22rpx;
}

.login-btn {
  display: inline-flex;
  height: 52rpx;
  align-items: center;
  margin-top: 28rpx;
  padding: 0 28rpx;
  color: #fff;
  background: #8a6a3f;
  border-radius: 26rpx;
  font-size: 24rpx;
}

.stats-row {
  display: flex;
  margin: -70rpx 28rpx 24rpx;
  padding: 26rpx 0;
  background: rgba(255, 255, 255, .82);
  border-radius: 22rpx;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-num {
  display: block;
  color: #333;
  font-size: 42rpx;
}

.stat-label {
  display: block;
  margin-top: 8rpx;
  color: #777;
  font-size: 24rpx;
}

.panel {
  margin: 24rpx 28rpx;
  padding: 34rpx 18rpx;
  background: #fff;
  border-radius: 22rpx;
}

.grid {
  display: grid;
}

.grid.four {
  grid-template-columns: repeat(4, 1fr);
  row-gap: 36rpx;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 108rpx;
}

.grid-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58rpx;
  height: 58rpx;
  color: #444;
  font-size: 34rpx;
}

.grid-text {
  margin-top: 14rpx;
  color: #666;
  font-size: 25rpx;
}
</style>

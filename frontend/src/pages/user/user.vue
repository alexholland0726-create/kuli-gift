<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api } from '@/api/index';
const userInfo = ref<any>(null);
const loginLoading = ref(false);
const notice = ref('');
const commerceEnabled = ref(false);
let refreshSequence = 0;
onShow(async () => {
  api.site.capabilities().then(value => { commerceEnabled.value = value?.commerceEnabled === true; }).catch(() => undefined);
  const sequence = ++refreshSequence;
  if (!uni.getStorageSync('token')) { userInfo.value = null; uni.removeStorageSync('userInfo'); return; }
  userInfo.value = uni.getStorageSync('userInfo') || null;
  try {
    const user = await api.user.info();
    if (sequence !== refreshSequence) return;
    userInfo.value = user;
    uni.setStorageSync('userInfo', user);
    notice.value = '';
  } catch (error: any) {
    if (sequence !== refreshSequence) return;
    if (error?.statusCode === 401) { logout(); notice.value = '登录已过期，请重新登录'; }
    else notice.value = '资料暂时未刷新，请稍后重试；仍可浏览和询价';
  }
});
function login() {
  if (loginLoading.value) return;
  ++refreshSequence;
  loginLoading.value = true;
  notice.value = '';
  uni.login({
    provider: 'weixin',
    success: async (res) => {
      try {
        const result = await api.user.login(res.code || '');
        if (!result?.token || !result?.user?.id) throw new Error('invalid login');
        uni.setStorageSync('token', result.token);
        uni.setStorageSync('userInfo', result.user);
        userInfo.value = result.user;
        uni.showToast({ title: '登录成功', icon: 'success' });
      } catch { notice.value = '微信登录暂时失败，请重试；不登录也可询价'; }
      finally { loginLoading.value = false; }
    },
    fail: () => { loginLoading.value = false; notice.value = '微信登录失败，请重试'; },
  });
}
function logout() {
  ++refreshSequence;
  uni.removeStorageSync('token'); uni.removeStorageSync('userInfo'); userInfo.value = null;
}
function browse() { uni.switchTab({ url: '/pages/library/library' }); }
function inquire() { uni.navigateTo({ url: '/pages/product/list' }); }
function openPage(path: string) { if (!userInfo.value) { notice.value = '请先登录'; return; } uni.navigateTo({ url: path }); }
</script>
<template>
  <view class="page">
    <view class="profile">
      <view class="title">我的</view>
      <view class="profile-row">
        <view class="avatar">礼</view>
        <view class="profile-main">
          <text class="name">{{ userInfo?.nickname || '欢迎来到酷礼工坊' }}</text>
          <text class="hint">{{ userInfo ? '已登录 · ID ' + userInfo.id : '浏览礼品、提交询价，无需登录' }}</text>
        </view>
      </view>
      <button v-if="!userInfo" class="login-btn" :disabled="loginLoading" @tap="login">{{ loginLoading ? '登录中…' : '微信登录' }}</button>
      <button v-else class="login-btn" @tap="logout">退出登录</button>
      <text v-if="notice" class="notice">{{ notice }}</text>
    </view>
    <view class="panel">
      <view class="service" @tap="browse"><text>浏览礼品</text><text>›</text></view>
      <view class="service" @tap="inquire"><text>选择礼品询价</text><text>›</text></view>
      <view v-if="commerceEnabled" class="service" @tap="openPage('/pages/cart/cart')"><text>购物车</text><text>›</text></view>
      <view v-if="commerceEnabled" class="service" @tap="openPage('/pages/order/list')"><text>我的订单</text><text>›</text></view>
      <view v-if="commerceEnabled" class="service" @tap="openPage('/pages/address/list')"><text>收货地址</text><text>›</text></view>
    </view>
    <view class="note">提交采购数量、预算和联系方式，我们会为您提供选品与报价。</view>
  </view>
</template>
<style scoped>
.page { min-height:100vh; background:#f5f5f5; padding-bottom:120rpx; }
.profile { padding:42rpx 34rpx; background:linear-gradient(180deg,#dfcdb5,#eee5d8); }
.title { font-size:44rpx; font-weight:700; margin-bottom:46rpx; }
.profile-row { display:flex; align-items:center; gap:24rpx; }
.avatar { width:112rpx; height:112rpx; line-height:112rpx; text-align:center; border-radius:50%; background:#fff; color:#8a6a3f; font-size:48rpx; }
.profile-main { flex:1; }.name { display:block; font-size:34rpx; font-weight:700; }
.hint,.notice { display:block; margin-top:16rpx; font-size:25rpx; color:#665a4b; }
.login-btn { margin:28rpx 0 0; padding:0 28rpx; display:inline-block; font-size:26rpx; background:#8a6a3f; color:#fff; }
.panel { margin:28rpx; padding:0 28rpx; background:#fff; border-radius:20rpx; }
.service { display:flex; justify-content:space-between; padding:32rpx 0; border-bottom:1rpx solid #eee; font-size:30rpx; }
.service:last-child { border:0; }.note { margin:28rpx; color:#777; font-size:26rpx; line-height:1.8; }
</style>

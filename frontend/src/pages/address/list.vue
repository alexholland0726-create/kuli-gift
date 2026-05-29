<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/index';

const addresses = ref<any[]>([]);

onMounted(() => loadAddresses());

async function loadAddresses() {
  try {
    const res = await uni.request({ url: '/api/addresses', method: 'GET' });
    addresses.value = (res as any).data || [];
  } catch (e) { console.error(e); }
}

function goAdd() {
  uni.navigateTo({ url: '/pages/address/edit' });
}

function goEdit(id: number) {
  uni.navigateTo({ url: `/pages/address/edit?id=${id}` });
}

async function setDefault(id: number) {
  try {
    await uni.request({ url: `/api/addresses/${id}`, method: 'PUT', data: { isDefault: true } });
    loadAddresses();
  } catch (e) {}
}

async function remove(id: number) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除该地址吗？',
    success: async (res) => {
      if (res.confirm) {
        await uni.request({ url: `/api/addresses/${id}`, method: 'DELETE' });
        loadAddresses();
      }
    },
  });
}

function selectAddress(addr: any) {
  const pages = getCurrentPages();
  const prevPage = pages[pages.length - 2];
  if (prevPage && (prevPage as any).route === 'pages/order/confirm') {
    (prevPage as any).$vm?.onAddressSelect(addr);
    uni.navigateBack();
  }
}
</script>

<template>
  <view class="page">
    <view class="addr-card" v-for="addr in addresses" :key="addr.id" @tap="selectAddress(addr)">
      <view class="addr-top">
        <text class="addr-name">{{ addr.name }}</text>
        <text class="addr-phone">{{ addr.phone }}</text>
        <text class="addr-tag" v-if="addr.isDefault">默认</text>
      </view>
      <text class="addr-detail">{{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}</text>
      <view class="addr-actions">
        <text class="action-btn" @tap.stop="setDefault(addr.id)" v-if="!addr.isDefault">设为默认</text>
        <text class="action-btn" @tap.stop="goEdit(addr.id)">编辑</text>
        <text class="action-btn danger" @tap.stop="remove(addr.id)">删除</text>
      </view>
    </view>
    <view class="empty" v-if="!addresses.length">暂无收货地址</view>
    <view class="add-btn" @tap="goAdd">+ 新增地址</view>
  </view>
</template>

<style scoped>
.page { padding: 20rpx; padding-bottom: 120rpx; }
.addr-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.addr-top { display: flex; align-items: center; margin-bottom: 10rpx; }
.addr-name { font-size: 28rpx; font-weight: 600; color: #333; }
.addr-phone { font-size: 26rpx; color: #666; margin-left: 16rpx; }
.addr-tag { background: #D4A574; color: #fff; font-size: 20rpx; padding: 2rpx 12rpx; border-radius: 6rpx; margin-left: 12rpx; }
.addr-detail { font-size: 24rpx; color: #999; line-height: 1.5; display: block; }
.addr-actions { display: flex; margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #f5f5f5; }
.action-btn { font-size: 24rpx; color: #D4A574; margin-right: 24rpx; }
.action-btn.danger { color: #e74c3c; }
.empty { text-align: center; color: #999; padding: 100rpx 0; font-size: 28rpx; }
.add-btn { position: fixed; bottom: 30rpx; left: 30rpx; right: 30rpx; background: #D4A574; color: #fff; text-align: center; height: 88rpx; line-height: 88rpx; border-radius: 44rpx; font-size: 30rpx; }
</style>

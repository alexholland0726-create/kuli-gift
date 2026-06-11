<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { api } from '@/api/index';

interface SettleItem {
  cartItemId: number;
  productId: number;
  name: string;
  coverImage: string;
  price: number;
  quantity: number;
  spec: string;
}

interface Address {
  id: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

const items = ref<SettleItem[]>([]);
const addresses = ref<Address[]>([]);
const selectedAddress = ref<Address | null>(null);
const remark = ref('');
const submitting = ref(false);

const productPlaceholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140"><rect fill="%23f5f5f5" width="140" height="140"/><text x="70" y="77" text-anchor="middle" fill="%23aaa" font-size="18">暂无图片</text></svg>';

onLoad(async (opt: any) => {
  if (opt.items) {
    try {
      items.value = JSON.parse(decodeURIComponent(opt.items));
    } catch (_) {
      items.value = [];
    }
  }
  await loadAddresses();
});

async function loadAddresses() {
  try {
    const res = await api.addresses.list();
    addresses.value = Array.isArray(res) ? res : [];
    selectedAddress.value = addresses.value.find((item) => item.isDefault) || addresses.value[0] || null;
  } catch (_) {
    selectedAddress.value = null;
  }
}

const totalAmount = computed(() => items.value.reduce((sum, item) => sum + item.price * item.quantity, 0));

function selectAddress() {
  uni.navigateTo({ url: '/pages/address/list?from=settle' });
}

async function submitOrder() {
  if (!selectedAddress.value) {
    uni.showToast({ title: '请先添加收货地址', icon: 'none' });
    return;
  }
  if (!items.value.length || submitting.value) return;
  submitting.value = true;

  try {
    const order = await api.orders.create({
      items: items.value.map((item) => ({
        productId: item.productId,
        name: item.name,
        coverImage: item.coverImage,
        price: item.price,
        quantity: item.quantity,
        spec: item.spec || '',
      })),
      totalAmount: totalAmount.value,
      payAmount: totalAmount.value,
      consignee: selectedAddress.value.name,
      phone: selectedAddress.value.phone,
      address: `${selectedAddress.value.province}${selectedAddress.value.city}${selectedAddress.value.district}${selectedAddress.value.detail}`,
      remark: remark.value,
    }) as any;

    const payParams = await api.pay.create(order.id);
    await requestPayment(payParams);

    for (const item of items.value) {
      try { await api.cart.remove(item.cartItemId); } catch (_) {}
    }
    uni.showToast({ title: '支付成功', icon: 'success' });
    setTimeout(() => uni.navigateTo({ url: '/pages/order/list' }), 1200);
  } catch (err: any) {
    uni.showToast({ title: err?.data?.message || '支付未完成', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

function requestPayment(params: any) {
  return new Promise<void>((resolve, reject) => {
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: params.timeStamp,
      nonceStr: params.nonceStr,
      package: params.package,
      signType: params.signType || 'RSA',
      paySign: params.paySign,
      success: () => resolve(),
      fail: (err) => reject(err),
    });
  });
}
</script>

<template>
  <view class="page">
    <view class="address-section" @tap="selectAddress">
      <view v-if="selectedAddress" class="address-info">
        <view class="address-top">
          <text class="address-name">{{ selectedAddress.name }}</text>
          <text class="address-phone">{{ selectedAddress.phone }}</text>
          <text class="address-tag" v-if="selectedAddress.isDefault">默认</text>
        </view>
        <text class="address-detail">{{ selectedAddress.province }}{{ selectedAddress.city }}{{ selectedAddress.district }}{{ selectedAddress.detail }}</text>
      </view>
      <view v-else class="address-empty">
        <text>添加收货地址</text>
        <text class="address-arrow">›</text>
      </view>
    </view>

    <view class="order-items">
      <view class="order-item" v-for="(item, i) in items" :key="i">
        <image :src="item.coverImage || productPlaceholder" class="item-img" mode="aspectFill" />
        <view class="item-info">
          <text class="item-name">{{ item.name }}</text>
          <text class="item-spec" v-if="item.spec">{{ item.spec }}</text>
          <view class="item-bottom">
            <text class="item-price">¥{{ item.price.toFixed(2) }}</text>
            <text class="item-qty">x{{ item.quantity }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="remark-section">
      <text class="remark-label">备注</text>
      <input v-model="remark" class="remark-input" placeholder="选填：企业名称、定制需求等" />
    </view>

    <view class="bottom-bar">
      <view class="total">
        <text class="total-label">合计</text>
        <text class="total-price">¥{{ totalAmount.toFixed(2) }}</text>
      </view>
      <view class="submit-btn" :class="{ disabled: submitting }" @tap="submitOrder">
        {{ submitting ? '提交中...' : '提交订单并支付' }}
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; background: #f6f7f4; padding-bottom: 128rpx; }
.address-section { margin: 18rpx 20rpx; padding: 28rpx; background: #fff; border-radius: 20rpx; }
.address-top { display: flex; align-items: center; gap: 16rpx; }
.address-name { color: #20251f; font-size: 30rpx; font-weight: 800; }
.address-phone { color: #626b5c; font-size: 26rpx; }
.address-tag { color: #5f9d46; background: #edf7e8; padding: 4rpx 12rpx; border-radius: 999rpx; font-size: 20rpx; }
.address-detail { display: block; color: #6d7568; font-size: 25rpx; line-height: 1.55; margin-top: 12rpx; }
.address-empty { display: flex; align-items: center; justify-content: space-between; color: #56604f; font-size: 28rpx; }
.address-arrow { color: #aab2a4; font-size: 44rpx; }
.order-items { margin: 0 20rpx 18rpx; padding: 0 24rpx; background: #fff; border-radius: 20rpx; }
.order-item { display: flex; gap: 18rpx; padding: 24rpx 0; border-bottom: 1rpx solid #edf0e8; }
.order-item:last-child { border-bottom: 0; }
.item-img { width: 146rpx; height: 146rpx; border-radius: 16rpx; background: #f5f5f5; flex-shrink: 0; }
.item-info { flex: 1; min-width: 0; }
.item-name { display: block; color: #20251f; font-size: 27rpx; line-height: 1.45; max-height: 76rpx; overflow: hidden; }
.item-spec { display: block; color: #8a9284; font-size: 22rpx; margin-top: 8rpx; }
.item-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 16rpx; }
.item-price { color: #d9553f; font-size: 30rpx; font-weight: 800; }
.item-qty { color: #8a9284; font-size: 24rpx; }
.remark-section { display: flex; align-items: center; margin: 0 20rpx; padding: 24rpx; background: #fff; border-radius: 20rpx; }
.remark-label { color: #20251f; font-size: 27rpx; margin-right: 20rpx; }
.remark-input { flex: 1; color: #20251f; font-size: 26rpx; }
.bottom-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 10; display: flex; align-items: center; gap: 20rpx; padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom)); background: #fff; box-shadow: 0 -8rpx 28rpx rgba(0,0,0,.06); }
.total { flex: 1; text-align: right; }
.total-label { color: #687260; font-size: 24rpx; margin-right: 8rpx; }
.total-price { color: #d9553f; font-size: 34rpx; font-weight: 800; }
.submit-btn { min-width: 218rpx; height: 78rpx; line-height: 78rpx; text-align: center; border-radius: 999rpx; background: #6fab54; color: #fff; font-size: 27rpx; font-weight: 800; }
.submit-btn.disabled { opacity: .6; }
</style>

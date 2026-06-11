<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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

const productPlaceholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect fill="%23f5f5f5" width="120" height="120"/><text x="60" y="66" text-anchor="middle" fill="%23ccc" font-size="18">暂无图片</text></svg>';

onLoad(async (opt: any) => {
  if (opt.items) {
    try {
      items.value = JSON.parse(decodeURIComponent(opt.items));
    } catch (_) {}
  }
  await loadAddresses();
});

async function loadAddresses() {
  try {
    const res = await api.addresses.list();
    addresses.value = Array.isArray(res) ? res : [];
    selectedAddress.value = addresses.value.find(a => a.isDefault) || addresses.value[0] || null;
  } catch (_) {}
}

const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

function selectAddress() {
  uni.navigateTo({
    url: '/pages/address/list?from=settle',
  });
}

async function submitOrder() {
  if (!selectedAddress.value) {
    uni.showToast({ title: '请选择收货地址', icon: 'none' });
    return;
  }
  if (submitting.value) return;
  submitting.value = true;

  try {
    const res = await api.orders.create({
      items: items.value.map(i => ({
        productId: i.productId,
        name: i.name,
        coverImage: i.coverImage,
        price: i.price,
        quantity: i.quantity,
        spec: i.spec || '',
      })),
      totalAmount: totalAmount.value,
      payAmount: totalAmount.value,
      consignee: selectedAddress.value.name,
      phone: selectedAddress.value.phone,
      address: `${selectedAddress.value.province}${selectedAddress.value.city}${selectedAddress.value.district}${selectedAddress.value.detail}`,
      remark: remark.value,
    });

    const payParams = await api.pay.create(res.id);
    await requestPayment(payParams);

    for (const item of items.value) {
      try { await api.cart.remove(item.cartItemId); } catch (_) {}
    }
    uni.showToast({ title: '支付成功', icon: 'success' });
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/order/list' });
    }, 1500);
  } catch (e: any) {
    uni.showToast({ title: e?.message || '支付未完成', icon: 'none' });
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
    <!-- 收货地址 -->
    <view class="address-section" @tap="selectAddress">
      <view v-if="selectedAddress" class="address-info">
        <view class="address-top">
          <text class="address-name">{{ selectedAddress.name }}</text>
          <text class="address-phone">{{ selectedAddress.phone }}</text>
          <text class="address-tag" v-if="selectedAddress.isDefault">默认</text>
        </view>
        <text class="address-detail">
          {{ selectedAddress.province }}{{ selectedAddress.city }}{{ selectedAddress.district }}{{ selectedAddress.detail }}
        </text>
      </view>
      <view v-else class="address-empty">
        <text>请添加收货地址</text>
        <text class="address-arrow">&gt;</text>
      </view>
    </view>

    <!-- 商品列表 -->
    <view class="order-items">
      <view class="order-item" v-for="(item, i) in items" :key="i">
        <image :src="item.coverImage || productPlaceholder" class="item-img" mode="aspectFill" />
        <view class="item-info">
          <text class="item-name ellipsis">{{ item.name }}</text>
          <text class="item-spec" v-if="item.spec">{{ item.spec }}</text>
          <view class="item-bottom">
            <text class="item-price">¥{{ item.price }}</text>
            <text class="item-qty">x{{ item.quantity }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 备注 -->
    <view class="remark-section">
      <text class="remark-label">备注</text>
      <input v-model="remark" class="remark-input" placeholder="选填：订单备注" />
    </view>

    <!-- 底部 -->
    <view class="bottom-bar">
      <view class="total">
        <text class="total-label">合计：</text>
        <text class="total-price">¥{{ totalAmount.toFixed(2) }}</text>
      </view>
      <view class="submit-btn" :class="{ disabled: submitting }" @tap="submitOrder">
        {{ submitting ? '提交中...' : '提交订单' }}
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { background: #f8f8f8; min-height: 100vh; padding-bottom: 120rpx; }

/* 地址 */
.address-section {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 16rpx;
}
.address-info {}
.address-top { display: flex; align-items: center; }
.address-name { font-size: 30rpx; font-weight: 500; color: #333; }
.address-phone { font-size: 26rpx; color: #666; margin-left: 20rpx; }
.address-tag { font-size: 20rpx; color: #D4A574; background: #FDF6EF; padding: 2rpx 12rpx; border-radius: 6rpx; margin-left: 12rpx; }
.address-detail { font-size: 24rpx; color: #999; margin-top: 10rpx; display: block; }
.address-empty { display: flex; justify-content: space-between; align-items: center; }
.address-empty text { font-size: 28rpx; color: #999; }
.address-arrow { font-size: 28rpx; color: #ccc; }

/* 商品列表 */
.order-items { background: #fff; padding: 0 30rpx; margin-bottom: 16rpx; }
.order-item { display: flex; padding: 24rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.order-item:last-child { border-bottom: none; }
.item-img { width: 140rpx; height: 140rpx; border-radius: 12rpx; flex-shrink: 0; background: #f5f5f5; }
.item-info { flex: 1; margin-left: 16rpx; display: flex; flex-direction: column; justify-content: center; }
.item-name { font-size: 26rpx; color: #333; }
.item-spec { font-size: 22rpx; color: #999; margin-top: 6rpx; }
.item-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; }
.item-price { font-size: 28rpx; font-weight: 600; color: #D4A574; }
.item-qty { font-size: 24rpx; color: #999; }

/* 备注 */
.remark-section { background: #fff; padding: 24rpx 30rpx; margin-bottom: 16rpx; display: flex; align-items: center; }
.remark-label { font-size: 26rpx; color: #333; margin-right: 20rpx; flex-shrink: 0; }
.remark-input { flex: 1; font-size: 26rpx; color: #333; }

/* 底部 */
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: center; background: #fff; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); border-top: 1rpx solid #f0f0f0; z-index: 100; }
.total { flex: 1; text-align: right; }
.total-label { font-size: 24rpx; color: #666; }
.total-price { font-size: 34rpx; font-weight: 700; color: #D4A574; }
.submit-btn { background: linear-gradient(135deg, #D4A574, #B8895A); color: #fff; padding: 16rpx 50rpx; border-radius: 40rpx; font-size: 28rpx; margin-left: 20rpx; min-width: 160rpx; text-align: center; }
.submit-btn.disabled { opacity: 0.6; }

.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>

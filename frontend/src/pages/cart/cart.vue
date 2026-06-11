<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api } from '@/api/index';

interface CartProduct {
  id: number;
  name: string;
  price: number | string;
  coverImage: string;
  stock: number;
}

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  spec: string;
  selected: boolean;
  product: CartProduct;
}

const cartItems = ref<CartItem[]>([]);
const loading = ref(false);
const selectedIds = ref<Set<number>>(new Set());

const productPlaceholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect fill="%23f5f5f5" width="180" height="180"/><text x="90" y="98" text-anchor="middle" fill="%23aaa" font-size="20">暂无图片</text></svg>';

onShow(loadCart);

async function loadCart() {
  loading.value = true;
  try {
    const res = await api.cart.list();
    cartItems.value = Array.isArray(res) ? res : [];
    selectedIds.value = new Set(cartItems.value.filter((item) => item.selected !== false).map((item) => item.id));
  } catch (_) {
    cartItems.value = [];
    selectedIds.value = new Set();
  } finally {
    loading.value = false;
  }
}

const selectedItems = computed(() => cartItems.value.filter((item) => selectedIds.value.has(item.id)));
const totalPrice = computed(() => selectedItems.value.reduce((sum, item) => sum + Number(item.product?.price || 0) * item.quantity, 0));
const allSelected = computed(() => cartItems.value.length > 0 && cartItems.value.every((item) => selectedIds.value.has(item.id)));

function toggleSelect(item: CartItem) {
  const next = new Set(selectedIds.value);
  if (next.has(item.id)) next.delete(item.id);
  else next.add(item.id);
  selectedIds.value = next;
}

function toggleAll() {
  selectedIds.value = allSelected.value ? new Set() : new Set(cartItems.value.map((item) => item.id));
}

async function changeQuantity(item: CartItem, delta: number) {
  const oldQty = item.quantity;
  const nextQty = Math.max(1, Math.min(99, item.quantity + delta));
  if (nextQty === oldQty) return;
  item.quantity = nextQty;
  try {
    await api.cart.updateQuantity(item.id, nextQty);
  } catch (_) {
    item.quantity = oldQty;
    uni.showToast({ title: '修改失败', icon: 'none' });
  }
}

async function removeItem(item: CartItem) {
  try {
    await api.cart.remove(item.id);
    cartItems.value = cartItems.value.filter((current) => current.id !== item.id);
    const next = new Set(selectedIds.value);
    next.delete(item.id);
    selectedIds.value = next;
    uni.showToast({ title: '已移除', icon: 'none' });
  } catch (_) {
    uni.showToast({ title: '删除失败', icon: 'none' });
  }
}

function goSettle() {
  if (!selectedItems.value.length) {
    uni.showToast({ title: '请选择商品', icon: 'none' });
    return;
  }

  const items = selectedItems.value.map((item) => ({
    cartItemId: item.id,
    productId: item.productId,
    name: item.product?.name || '',
    coverImage: item.product?.coverImage || '',
    price: Number(item.product?.price || 0),
    quantity: item.quantity,
    spec: item.spec || '',
  }));

  uni.navigateTo({
    url: `/pages/order/settle?items=${encodeURIComponent(JSON.stringify(items))}`,
  });
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` });
}
</script>

<template>
  <view class="page">
    <view class="cart-list" v-if="cartItems.length">
      <view class="cart-item" v-for="item in cartItems" :key="item.id">
        <view class="check-wrap" @tap="toggleSelect(item)">
          <text class="check-box" :class="{ checked: selectedIds.has(item.id) }">{{ selectedIds.has(item.id) ? '✓' : '' }}</text>
        </view>
        <image :src="item.product?.coverImage || productPlaceholder" class="item-img" mode="aspectFill" @tap="goDetail(item.productId)" />
        <view class="item-info">
          <text class="item-name" @tap="goDetail(item.productId)">{{ item.product?.name || '商品' }}</text>
          <text class="item-spec" v-if="item.spec">{{ item.spec }}</text>
          <view class="item-bottom">
            <text class="item-price">¥{{ Number(item.product?.price || 0).toFixed(2) }}</text>
            <view class="qty-control">
              <text class="qty-btn" @tap="changeQuantity(item, -1)">-</text>
              <text class="qty-num">{{ item.quantity }}</text>
              <text class="qty-btn" @tap="changeQuantity(item, 1)">+</text>
            </view>
          </view>
        </view>
        <text class="delete-btn" @tap="removeItem(item)">×</text>
      </view>
    </view>

    <view class="empty-cart" v-if="!loading && !cartItems.length">
      <text class="empty-title">选品池还是空的</text>
      <text class="empty-desc">先去挑几款端午商务礼，加入后再统一结算。</text>
      <view class="go-btn" @tap="uni.switchTab({url:'/pages/index/index'})">去选品</view>
    </view>

    <view class="loading" v-if="loading && !cartItems.length">加载中...</view>

    <view class="bottom-bar" v-if="cartItems.length">
      <view class="check-all" @tap="toggleAll">
        <text class="check-box" :class="{ checked: allSelected }">{{ allSelected ? '✓' : '' }}</text>
        <text class="all-text">全选</text>
      </view>
      <view class="total-info">
        <text class="total-label">合计</text>
        <text class="total-price">¥{{ totalPrice.toFixed(2) }}</text>
      </view>
      <view class="settle-btn" :class="{ disabled: !selectedItems.length }" @tap="goSettle">
        结算({{ selectedItems.length }})
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; background: #f6f7f4; padding-bottom: 128rpx; }
.cart-item { display: flex; align-items: center; gap: 18rpx; padding: 22rpx 20rpx; background: #fff; margin-bottom: 2rpx; }
.check-wrap { padding: 8rpx; }
.check-box { width: 40rpx; height: 40rpx; border: 2rpx solid #dfe5da; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22rpx; }
.check-box.checked { background: #6fab54; border-color: #6fab54; }
.item-img { width: 164rpx; height: 164rpx; border-radius: 16rpx; background: #f5f5f5; flex-shrink: 0; }
.item-info { flex: 1; min-width: 0; }
.item-name { display: block; color: #20251f; font-size: 27rpx; line-height: 1.45; max-height: 76rpx; overflow: hidden; }
.item-spec { display: block; color: #899184; font-size: 22rpx; margin-top: 8rpx; }
.item-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 16rpx; }
.item-price { color: #d9553f; font-size: 30rpx; font-weight: 800; }
.qty-control { display: flex; align-items: center; border: 1rpx solid #e1e5dc; border-radius: 999rpx; overflow: hidden; }
.qty-btn, .qty-num { width: 54rpx; height: 46rpx; line-height: 46rpx; text-align: center; color: #56604f; }
.qty-num { width: 62rpx; background: #fafbf8; font-size: 24rpx; }
.delete-btn { color: #b8bfb1; font-size: 42rpx; padding: 8rpx; }
.empty-cart { display: flex; flex-direction: column; align-items: center; padding: 220rpx 70rpx 0; text-align: center; }
.empty-title { color: #20251f; font-size: 34rpx; font-weight: 800; }
.empty-desc { color: #7e8678; font-size: 26rpx; line-height: 1.6; margin-top: 14rpx; }
.go-btn { margin-top: 34rpx; background: #6fab54; color: #fff; padding: 18rpx 62rpx; border-radius: 999rpx; font-size: 28rpx; }
.loading { text-align: center; padding: 100rpx 0; color: #8a9284; }
.bottom-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 10; display: flex; align-items: center; gap: 18rpx; padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom)); background: #fff; box-shadow: 0 -8rpx 28rpx rgba(0,0,0,.06); }
.check-all { display: flex; align-items: center; gap: 8rpx; color: #56604f; font-size: 25rpx; }
.total-info { flex: 1; text-align: right; }
.total-label { color: #687260; font-size: 24rpx; margin-right: 8rpx; }
.total-price { color: #d9553f; font-size: 34rpx; font-weight: 800; }
.settle-btn { min-width: 164rpx; height: 76rpx; line-height: 76rpx; text-align: center; border-radius: 999rpx; background: #6fab54; color: #fff; font-size: 28rpx; font-weight: 800; }
.settle-btn.disabled { opacity: .55; }
</style>

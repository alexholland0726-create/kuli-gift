<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api } from '@/api/index';

interface CartProduct {
  id: number;
  name: string;
  price: number;
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
const editing = ref(false);
const selectedIds = ref<Set<number>>(new Set());

const productPlaceholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect fill="%23f5f5f5" width="160" height="160"/><text x="80" y="86" text-anchor="middle" fill="%23ccc" font-size="20">暂无图片</text></svg>';

onShow(async () => {
  await loadCart();
});

async function loadCart() {
  loading.value = true;
  try {
    const res = await api.cart.list();
    cartItems.value = Array.isArray(res) ? res : [];
    // 恢复选中状态
    cartItems.value.forEach(item => {
      if (item.selected) selectedIds.value.add(item.id);
    });
  } catch (_) {
    cartItems.value = [];
  } finally {
    loading.value = false;
  }
}

const selectedItems = computed(() => {
  return cartItems.value.filter(item => selectedIds.value.has(item.id));
});

const totalPrice = computed(() => {
  return selectedItems.value.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0);
});

const allSelected = computed(() => {
  return cartItems.value.length > 0 && cartItems.value.every(item => selectedIds.value.has(item.id));
});

function toggleSelect(item: CartItem) {
  if (selectedIds.value.has(item.id)) {
    selectedIds.value.delete(item.id);
  } else {
    selectedIds.value.add(item.id);
  }
  selectedIds.value = new Set(selectedIds.value);
}

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(cartItems.value.map(i => i.id));
  }
}

async function changeQuantity(item: CartItem, delta: number) {
  const newQty = Math.max(1, Math.min(99, item.quantity + delta));
  if (newQty === item.quantity) return;
  item.quantity = newQty;
  try {
    await api.cart.updateQuantity(item.id, newQty);
  } catch (_) {
    uni.showToast({ title: '修改失败', icon: 'none' });
  }
}

async function removeItem(item: CartItem) {
  try {
    await api.cart.remove(item.id);
    cartItems.value = cartItems.value.filter(i => i.id !== item.id);
    selectedIds.value.delete(item.id);
    selectedIds.value = new Set(selectedIds.value);
    uni.showToast({ title: '已删除', icon: 'none' });
  } catch (_) {
    uni.showToast({ title: '删除失败', icon: 'none' });
  }
}

function goSettle() {
  if (selectedItems.value.length === 0) {
    uni.showToast({ title: '请选择商品', icon: 'none' });
    return;
  }
  // 构建选中商品参数传过去
  const items = selectedItems.value.map(i => ({
    cartItemId: i.id,
    productId: i.productId,
    name: i.product?.name || '',
    coverImage: i.product?.coverImage || '',
    price: i.product?.price || 0,
    quantity: i.quantity,
    spec: i.spec,
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
    <!-- 购物车列表 -->
    <view class="cart-list" v-if="cartItems.length > 0">
      <view class="cart-item" v-for="item in cartItems" :key="item.id">
        <view class="check-wrap" @tap="toggleSelect(item)">
          <text class="check-box" :class="{ checked: selectedIds.has(item.id) }">
            {{ selectedIds.has(item.id) ? '✓' : '' }}
          </text>
        </view>
        <image
          :src="item.product?.coverImage || productPlaceholder"
          class="item-img"
          mode="aspectFill"
          @tap="goDetail(item.productId)"
        />
        <view class="item-info">
          <text class="item-name ellipsis" @tap="goDetail(item.productId)">{{ item.product?.name || '商品' }}</text>
          <text class="item-spec" v-if="item.spec">{{ item.spec }}</text>
          <view class="item-bottom">
            <text class="item-price">¥{{ item.product?.price || 0 }}</text>
            <view class="qty-control">
              <text class="qty-btn" @tap="changeQuantity(item, -1)">−</text>
              <text class="qty-num">{{ item.quantity }}</text>
              <text class="qty-btn" @tap="changeQuantity(item, 1)">+</text>
            </view>
          </view>
        </view>
        <text class="delete-btn" @tap="removeItem(item)">✕</text>
      </view>
    </view>

    <!-- 空购物车 -->
    <view class="empty-cart" v-if="!loading && !cartItems.length">
      <text class="empty-icon">🛒</text>
      <text class="empty-text">购物车是空的</text>
      <view class="go-btn" @tap="uni.switchTab({url:'/pages/index/index'})">去逛逛</view>
    </view>

    <!-- 加载中 -->
    <view class="loading" v-if="loading && !cartItems.length">加载中...</view>

    <!-- 底部结算栏 -->
    <view class="bottom-bar" v-if="cartItems.length > 0">
      <view class="check-all" @tap="toggleAll">
        <text class="check-box" :class="{ checked: allSelected }">{{ allSelected ? '✓' : '' }}</text>
        <text class="all-text">全选</text>
      </view>
      <view class="total-info">
        <text class="total-label">合计：</text>
        <text class="total-price">¥{{ totalPrice.toFixed(2) }}</text>
      </view>
      <view class="settle-btn" :class="{ disabled: selectedItems.length === 0 }" @tap="goSettle">
        结算 ({{ selectedItems.length }})
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { background: #f8f8f8; min-height: 100vh; padding-bottom: 120rpx; }

.cart-item {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #fff;
  margin-bottom: 2rpx;
}
.check-wrap { padding: 10rpx; margin-right: 16rpx; }
.check-box {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  color: #fff;
}
.check-box.checked {
  background: #D4A574;
  border-color: #D4A574;
}
.item-img { width: 160rpx; height: 160rpx; border-radius: 12rpx; flex-shrink: 0; background: #f5f5f5; }
.item-info { flex: 1; margin-left: 16rpx; min-width: 0; }
.item-name { font-size: 26rpx; color: #333; display: block; }
.item-spec { font-size: 22rpx; color: #999; margin-top: 6rpx; display: block; }
.item-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 16rpx; }
.item-price { font-size: 28rpx; font-weight: 600; color: #D4A574; }
.qty-control { display: flex; align-items: center; }
.qty-btn { width: 48rpx; height: 48rpx; line-height: 48rpx; text-align: center; border: 1rpx solid #e0e0e0; font-size: 28rpx; color: #666; }
.qty-num { width: 60rpx; text-align: center; font-size: 24rpx; border-top: 1rpx solid #e0e0e0; border-bottom: 1rpx solid #e0e0e0; height: 48rpx; line-height: 48rpx; }
.delete-btn { font-size: 28rpx; color: #ccc; padding: 10rpx; margin-left: 10rpx; }

/* 空 */
.empty-cart { display: flex; flex-direction: column; align-items: center; padding: 200rpx 0; }
.empty-icon { font-size: 120rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-bottom: 40rpx; }
.go-btn { background: #D4A574; color: #fff; padding: 16rpx 60rpx; border-radius: 40rpx; font-size: 28rpx; }
.loading { text-align: center; padding: 100rpx 0; color: #999; }

/* 底部结算栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  background: #fff;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0f0f0;
  z-index: 100;
}
.check-all { display: flex; align-items: center; margin-right: 20rpx; }
.all-text { font-size: 26rpx; color: #333; margin-left: 8rpx; }
.total-info { flex: 1; text-align: right; }
.total-label { font-size: 24rpx; color: #666; }
.total-price { font-size: 32rpx; font-weight: 700; color: #D4A574; }
.settle-btn {
  background: #D4A574;
  color: #fff;
  padding: 16rpx 40rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  margin-left: 20rpx;
  min-width: 140rpx;
  text-align: center;
}
.settle-btn.disabled { background: #ddd; color: #999; }

.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>

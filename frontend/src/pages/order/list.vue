<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api } from '@/api/index';

const orders = ref<any[]>([]);
const loading = ref(false);
const cancellingId = ref<number | null>(null);

onShow(() => {
  loadOrders();
});

async function loadOrders() {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await api.orders.list();
    orders.value = Array.isArray(res) ? res : [];
  } catch (e) {
    orders.value = [];
  } finally {
    loading.value = false;
  }
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '待付款',
    paid: '已付款',
    shipped: '已发货',
    delivered: '已送达',
    completed: '已完成',
    cancelled: '已取消',
    refunding: '退款中',
    refunded: '已退款',
  };
  return map[status] || status;
}

function canCancel(order: any) {
  return order.status === 'pending';
}

function cancelOrder(order: any) {
  if (!canCancel(order) || cancellingId.value) return;

  uni.showModal({
    title: '取消订单',
    content: '确定要取消该订单吗？',
    confirmText: '取消订单',
    success: async (res) => {
      if (!res.confirm) return;
      cancellingId.value = order.id;
      try {
        const updated = await api.orders.cancel(order.id);
        const index = orders.value.findIndex((item) => item.id === order.id);
        if (index >= 0) orders.value[index] = updated;
        uni.showToast({ title: '已取消', icon: 'success' });
      } catch (e) {
        uni.showToast({ title: '取消失败', icon: 'none' });
      } finally {
        cancellingId.value = null;
      }
    },
  });
}
</script>

<template>
  <view class="page">
    <view class="order-card" v-for="order in orders" :key="order.id">
      <view class="order-header">
        <text class="order-no">{{ order.orderNo }}</text>
        <text class="order-status">{{ getStatusText(order.status) }}</text>
      </view>

      <view class="order-items">
        <view class="order-item" v-for="(item, i) in order.items" :key="i">
          <image :src="item.coverImage || '/static/placeholder.png'" class="item-img" mode="aspectFill" />
          <view class="item-info">
            <text class="item-name">{{ item.name }}</text>
            <text class="item-spec" v-if="item.spec">{{ item.spec }}</text>
          </view>
          <text class="item-price">￥{{ item.price }} x{{ item.quantity }}</text>
        </view>
      </view>

      <view class="order-footer">
        <text class="order-total">合计: ￥{{ order.payAmount }}</text>
        <button
          v-if="canCancel(order)"
          class="cancel-btn"
          :loading="cancellingId === order.id"
          :disabled="cancellingId === order.id"
          @click="cancelOrder(order)"
        >
          取消订单
        </button>
      </view>
    </view>

    <view class="empty" v-if="!loading && !orders.length">暂无订单</view>
    <view class="empty" v-if="loading">加载中...</view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 20rpx;
  background: #f7f8fa;
}

.order-card {
  margin-bottom: 20rpx;
  overflow: hidden;
  background: #fff;
  border-radius: 16rpx;
}

.order-header {
  display: flex;
  justify-content: space-between;
  padding: 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.order-no {
  font-size: 24rpx;
  color: #999;
}

.order-status {
  font-size: 24rpx;
  font-weight: 500;
  color: #d4a574;
}

.order-items {
  padding: 20rpx;
}

.order-item {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.item-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  background: #f2f2f2;
}

.item-info {
  flex: 1;
  min-width: 0;
  margin: 0 16rpx;
}

.item-name {
  display: block;
  overflow: hidden;
  font-size: 26rpx;
  color: #333;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-spec {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #999;
}

.item-price {
  font-size: 24rpx;
  color: #d4a574;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16rpx;
  padding: 20rpx;
  border-top: 1rpx solid #f5f5f5;
}

.order-total {
  font-size: 26rpx;
  font-weight: 500;
  color: #333;
}

.cancel-btn {
  width: 160rpx;
  height: 56rpx;
  padding: 0;
  margin: 0;
  font-size: 24rpx;
  line-height: 56rpx;
  color: #666;
  background: #fff;
  border: 1rpx solid #ddd;
  border-radius: 28rpx;
}

.empty {
  padding: 100rpx 0;
  font-size: 28rpx;
  color: #999;
  text-align: center;
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/index';

const orders = ref<any[]>([]);

onMounted(async () => {
  try {
    const res = await api.orders.list();
    orders.value = res as any[];
  } catch (e) {}
});

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '待付款', paid: '已付款', shipped: '已发货',
    delivered: '已送达', completed: '已完成', cancelled: '已取消',
  };
  return map[status] || status;
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
          <text class="item-price">¥{{ item.price }} x{{ item.quantity }}</text>
        </view>
      </view>
      <view class="order-footer">
        <text class="order-total">合计: ¥{{ order.payAmount }}</text>
      </view>
    </view>
    <view class="empty" v-if="!orders.length">暂无订单</view>
  </view>
</template>

<style scoped>
.page { padding: 20rpx; }
.order-card { background: #fff; border-radius: 16rpx; margin-bottom: 20rpx; overflow: hidden; }
.order-header { display: flex; justify-content: space-between; padding: 20rpx; border-bottom: 1rpx solid #f5f5f5; }
.order-no { font-size: 24rpx; color: #999; }
.order-status { font-size: 24rpx; color: #D4A574; font-weight: 500; }
.order-items { padding: 20rpx; }
.order-item { display: flex; align-items: center; margin-bottom: 16rpx; }
.item-img { width: 120rpx; height: 120rpx; border-radius: 12rpx; }
.item-info { flex: 1; margin: 0 16rpx; }
.item-name { font-size: 26rpx; color: #333; display: block; }
.item-spec { font-size: 22rpx; color: #999; margin-top: 4rpx; display: block; }
.item-price { font-size: 24rpx; color: #D4A574; }
.order-footer { padding: 20rpx; border-top: 1rpx solid #f5f5f5; text-align: right; }
.order-total { font-size: 26rpx; font-weight: 500; color: #333; }
.empty { text-align: center; color: #999; padding: 100rpx 0; font-size: 28rpx; }
</style>

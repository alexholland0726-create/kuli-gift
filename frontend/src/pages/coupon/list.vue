<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/index';

const availableCoupons = ref<any[]>([]);
const myCoupons = ref<any[]>([]);
const tab = ref('available');

onMounted(() => {
  loadAvailable();
  loadMine();
});

async function loadAvailable() {
  try {
    const res = await uni.request({ url: 'https://api.da-fire.com/api/coupons/available', method: 'GET' }) as any;
    availableCoupons.value = Array.isArray(res.data) ? res.data : [];
  } catch (_) {}
}

async function loadMine() {
  try {
    const res = await uni.request({ url: 'https://api.da-fire.com/api/coupons/mine', method: 'GET' }) as any;
    myCoupons.value = Array.isArray(res.data) ? res.data : [];
  } catch (_) {}
}

async function claim(couponId: number) {
  try {
    await uni.request({ url: `https://api.da-fire.com/api/coupons/${couponId}/claim`, method: 'POST' });
    uni.showToast({ title: '领取成功', icon: 'success' });
    loadAvailable();
    loadMine();
  } catch (e: any) {
    uni.showToast({ title: e?.data?.message || '领取失败', icon: 'none' });
  }
}

function getTypeText(type: string) {
  const map: Record<string, string> = {
    discount: '折扣券', full_reduce: '满减券', random: '随机券', exchange: '兑换券',
  };
  return map[type] || type;
}

function getScopeTag(scope: string) {
  const map: Record<string, string> = { newbie: '新人专享', member: '会员专享', fan: '粉丝专享', public: '通用' };
  return map[scope] || '';
}

function getStatusText(status: string) {
  const map: Record<string, string> = { unused: '未使用', used: '已使用', expired: '已过期' };
  return map[status] || status;
}
</script>

<template>
  <view class="page">
    <view class="tabs">
      <view class="tab" :class="{ active: tab === 'available' }" @tap="tab='available'">可领取</view>
      <view class="tab" :class="{ active: tab === 'mine' }" @tap="tab='mine'">我的券</view>
    </view>

    <!-- 可领取列表 -->
    <view v-if="tab === 'available'">
      <view class="coupon-card" v-for="c in availableCoupons" :key="c.id">
        <view class="coupon-left">
          <text class="coupon-value" v-if="c.type === 'full_reduce'">¥{{ c.value }}</text>
          <text class="coupon-value" v-else-if="c.type === 'discount'">{{ c.value }}折</text>
          <text class="coupon-value" v-else>券</text>
          <text class="coupon-type">{{ getTypeText(c.type) }}</text>
        </view>
        <view class="coupon-right">
          <text class="coupon-name">{{ c.name }}</text>
          <text class="coupon-condition" v-if="c.minAmount > 0">满¥{{ c.minAmount }}可用</text>
          <text class="coupon-condition" v-else>无门槛</text>
          <view class="coupon-tags">
            <text class="coupon-tag" v-if="c.scope !== 'public'">{{ getScopeTag(c.scope) }}</text>
          </view>
        </view>
        <view class="coupon-action">
          <text class="claim-btn" @tap="claim(c.id)" v-if="c.totalStock === 0 || (c.usedStock || 0) < c.totalStock">领取</text>
          <text class="claim-btn disabled" v-else>已领完</text>
        </view>
      </view>
      <view class="empty" v-if="!availableCoupons.length">暂无可用优惠券</view>
    </view>

    <!-- 我的优惠券 -->
    <view v-if="tab === 'mine'">
      <view class="coupon-card mine" v-for="uc in myCoupons" :key="uc.id" :class="uc.status">
        <view class="coupon-left">
          <text class="coupon-value" v-if="uc.coupon?.type === 'full_reduce'">¥{{ uc.coupon?.value }}</text>
          <text class="coupon-value" v-else-if="uc.coupon?.type === 'discount'">{{ uc.coupon?.value }}折</text>
          <text class="coupon-value" v-else>券</text>
        </view>
        <view class="coupon-right">
          <text class="coupon-name">{{ uc.coupon?.name || '优惠券' }}</text>
          <text class="coupon-condition" v-if="uc.coupon?.endTime">截止: {{ String(uc.coupon.endTime).split('T')[0] }}</text>
        </view>
        <view class="coupon-status-tag">
          <text>{{ getStatusText(uc.status) }}</text>
        </view>
      </view>
      <view class="empty" v-if="!myCoupons.length">暂无优惠券</view>
    </view>
  </view>
</template>

<style scoped>
.page { padding: 20rpx; }
.tabs { display: flex; background: #fff; border-radius: 12rpx; margin-bottom: 20rpx; }
.tab { flex: 1; text-align: center; padding: 24rpx 0; font-size: 28rpx; color: #999; position: relative; }
.tab.active { color: #D4A574; font-weight: 600; }
.tab.active::after { content: ''; position: absolute; bottom: 0; left: 30%; right: 30%; height: 4rpx; background: #D4A574; border-radius: 2rpx; }
.coupon-card { display: flex; background: #fff; border-radius: 16rpx; margin-bottom: 16rpx; overflow: hidden; position: relative; }
.coupon-left { width: 160rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #F5E6D3, #E8C9A8); padding: 20rpx; }
.coupon-value { font-size: 36rpx; font-weight: 700; color: #D4A574; }
.coupon-type { font-size: 20rpx; color: #B8895A; margin-top: 4rpx; }
.coupon-right { flex: 1; padding: 20rpx; }
.coupon-name { font-size: 26rpx; color: #333; font-weight: 500; display: block; }
.coupon-condition { font-size: 22rpx; color: #999; margin-top: 8rpx; display: block; }
.coupon-tags { display: flex; gap: 8rpx; margin-top: 8rpx; }
.coupon-tag { background: #F5E6D3; color: #B8895A; font-size: 20rpx; padding: 2rpx 12rpx; border-radius: 6rpx; }
.coupon-action { display: flex; align-items: center; padding-right: 20rpx; }
.claim-btn { background: #D4A574; color: #fff; font-size: 24rpx; padding: 8rpx 24rpx; border-radius: 24rpx; }
.claim-btn.disabled { background: #ddd; color: #999; }
.coupon-card.mine .coupon-left { background: linear-gradient(135deg, #f0f0f0, #e8e8e8); }
.coupon-card.mine .coupon-value { color: #999; }
.coupon-card.expired .coupon-right { opacity: 0.5; }
.coupon-status-tag { display: flex; align-items: center; padding-right: 20rpx; font-size: 22rpx; color: #999; }
.empty { text-align: center; color: #999; padding: 100rpx 0; font-size: 28rpx; }
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/index';

const stats = ref<{ totalShares: number; points: number }>({ totalShares: 0, points: 0 });

onMounted(async () => {
  try {
    const res = await api.share.stats();
    const data = res as any;
    stats.value = { totalShares: data?.totalShares || 0, points: data?.points || 0 };
  } catch (_) {}
});
</script>

<template>
  <view class="page">
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-num">{{ stats.totalShares }}</text>
        <text class="stat-label">分享次数</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-num">{{ stats.points }}</text>
        <text class="stat-label">累计积分</text>
      </view>
    </view>
    <view class="tip">
      <text>分享商品给好友，每次可获得 10 积分</text>
    </view>
  </view>
</template>

<style scoped>
.page { padding: 40rpx; }
.stats-card { display: flex; background: #fff; border-radius: 16rpx; padding: 40rpx; }
.stat-item { flex: 1; text-align: center; }
.stat-num { font-size: 48rpx; font-weight: 700; color: #D4A574; display: block; }
.stat-label { font-size: 24rpx; color: #999; margin-top: 10rpx; display: block; }
.stat-divider { width: 1rpx; background: #f0f0f0; }
.tip { text-align: center; color: #ccc; font-size: 24rpx; margin-top: 40rpx; }
</style>

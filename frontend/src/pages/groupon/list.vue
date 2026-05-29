<script setup lang="ts">
import { ref, onMounted } from 'vue';

const activities = ref<any[]>([]);

onMounted(() => loadActivities());

async function loadActivities() {
  try {
    const res: any = await uni.request({ url: '/api/groupon/activities', method: 'GET' });
    activities.value = res.data || [];
  } catch (e) {}
}

function goDetail(activityId: number) {
  uni.navigateTo({ url: `/pages/groupon/detail?activityId=${activityId}` });
}
</script>

<template>
  <view class="page">
    <view class="banner-section">
      <text class="banner-title">🔥 限时拼团</text>
      <text class="banner-sub">好友一起买，价格更优惠</text>
    </view>
    <view class="activity-card" v-for="act in activities" :key="act.id" @tap="goDetail(act.id)">
      <view class="act-top">
        <text class="act-name">拼团活动 #{{ act.id }}</text>
        <text class="act-tag">已拼{{ act.currentGroups }}团</text>
      </view>
      <view class="act-info">
        <view class="act-price">
          <text class="price-label">拼团价</text>
          <text class="price">¥{{ act.groupPrice }}</text>
        </view>
        <view class="act-detail">
          <text>{{ act.targetNum }}人成团</text>
          <text style="margin-left: 16rpx;">{{ act.type === 'newbie' ? '老带新' : act.type === 'ladder' ? '阶梯团' : '普通拼团' }}</text>
        </view>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: '60%' }"></view>
      </view>
      <text class="time-remaining">截止: {{ act.endTime?.split('T')[0] || '即将结束' }}</text>
    </view>
    <view class="empty" v-if="!activities.length">暂无进行中的拼团</view>
  </view>
</template>

<style scoped>
.page { padding: 20rpx; }
.banner-section { background: linear-gradient(135deg, #D4A574, #B8895A); border-radius: 16rpx; padding: 40rpx; margin-bottom: 30rpx; text-align: center; }
.banner-title { font-size: 40rpx; font-weight: 700; color: #fff; display: block; }
.banner-sub { font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 10rpx; display: block; }
.activity-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.act-top { display: flex; justify-content: space-between; align-items: center; }
.act-name { font-size: 28rpx; font-weight: 600; color: #333; }
.act-tag { background: #F5E6D3; color: #D4A574; font-size: 20rpx; padding: 4rpx 16rpx; border-radius: 20rpx; }
.act-info { display: flex; align-items: center; margin-top: 16rpx; }
.act-price { flex: 1; }
.price-label { font-size: 22rpx; color: #999; }
.price { font-size: 36rpx; font-weight: 700; color: #D4A574; margin-left: 8rpx; }
.act-detail { font-size: 24rpx; color: #999; }
.progress-bar { height: 8rpx; background: #f0f0f0; border-radius: 4rpx; margin-top: 16rpx; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #D4A574, #B8895A); border-radius: 4rpx; }
.time-remaining { font-size: 22rpx; color: #ccc; margin-top: 12rpx; display: block; }
.empty { text-align: center; color: #999; padding: 100rpx 0; font-size: 28rpx; }
</style>

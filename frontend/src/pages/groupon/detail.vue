<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const activityId = ref(0);
const groupId = ref(0);
const progress = ref<any>(null);
const createdGroupId = ref(0);

onLoad((opt: any) => {
  if (opt.activityId) activityId.value = Number(opt.activityId);
  if (opt.groupId) groupId.value = Number(opt.groupId);
  if (groupId.value) loadProgress();
});

async function loadProgress() {
  try {
    const res: any = await uni.request({
      url: `/api/groupon/${activityId.value}/progress/${groupId.value}`,
      method: 'GET',
    });
    progress.value = res.data;
  } catch (e) {}
}

async function createGroup() {
  try {
    const res: any = await uni.request({
      url: `/api/groupon/${activityId.value}/create`,
      method: 'POST',
    });
    createdGroupId.value = (res.data as any)?.id || 0;
    groupId.value = createdGroupId.value;
    uni.showToast({ title: '开团成功，快去支付', icon: 'success' });
  } catch (e: any) {
    const data = (e as any).data || {};
    uni.showToast({ title: data.message || '开团失败', icon: 'none' });
  }
}

async function joinGroup() {
  if (!groupId.value) return;
  try {
    await uni.request({
      url: `/api/groupon/${activityId.value}/join/${groupId.value}`,
      method: 'POST',
    });
    uni.showToast({ title: '参团成功', icon: 'success' });
    loadProgress();
  } catch (e: any) {
    const data = (e as any).data || {};
    uni.showToast({ title: data.message || '参团失败', icon: 'none' });
  }
}
</script>

<template>
  <view class="page">
    <view class="info-card" v-if="progress">
      <text class="title">拼团进度</text>
      <view class="countdown">
        <text class="num">{{ progress.remaining }}</text>
        <text class="label">人还差</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: (progress.currentNum / progress.targetNum * 100) + '%' }"></view>
      </view>
      <text class="detail">已拼 {{ progress.currentNum }} / {{ progress.targetNum }} 人</text>
    </view>

    <view class="actions">
      <view class="action-btn primary" @tap="createGroup">
        ￥ 开团
      </view>
      <view class="action-btn" @tap="joinGroup" v-if="groupId">
        参团
      </view>
    </view>

    <view class="tip" v-if="!groupId">
      <text>开团后分享给好友，邀请好友参团</text>
    </view>
  </view>
</template>

<style scoped>
.page { padding: 30rpx; }
.info-card { background: #fff; border-radius: 16rpx; padding: 40rpx; text-align: center; }
.title { font-size: 28rpx; color: #666; display: block; margin-bottom: 20rpx; }
.countdown { margin: 20rpx 0; }
.num { font-size: 72rpx; font-weight: 700; color: #D4A574; }
.label { font-size: 24rpx; color: #999; margin-left: 8rpx; }
.progress-bar { height: 12rpx; background: #f0f0f0; border-radius: 6rpx; margin: 20rpx 0; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #D4A574, #B8895A); border-radius: 6rpx; }
.detail { font-size: 24rpx; color: #999; }
.actions { display: flex; gap: 20rpx; margin-top: 40rpx; }
.action-btn { flex: 1; text-align: center; height: 88rpx; line-height: 88rpx; border: 2rpx solid #D4A574; color: #D4A574; border-radius: 44rpx; font-size: 30rpx; }
.action-btn.primary { background: #D4A574; color: #fff; border: none; }
.tip { text-align: center; color: #ccc; font-size: 24rpx; margin-top: 40rpx; }
</style>

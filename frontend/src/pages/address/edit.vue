<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const id = ref(0);
const form = ref({ name: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false });

onLoad((opt: any) => {
  if (opt.id) {
    id.value = Number(opt.id);
    loadAddress();
  }
});

async function loadAddress() {
  try {
    const res: any = await uni.request({ url: `/api/addresses`, method: 'GET' });
    const list = res.data || [];
    const addr = list.find((a: any) => a.id === id.value);
    if (addr) form.value = addr;
  } catch (e) {}
}

async function save() {
  if (!form.value.name || !form.value.phone || !form.value.detail) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' });
    return;
  }
  try {
    if (id.value) {
      await uni.request({ url: `/api/addresses/${id.value}`, method: 'PUT', data: form.value });
    } else {
      await uni.request({ url: '/api/addresses', method: 'POST', data: form.value });
    }
    uni.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 500);
  } catch (e) { uni.showToast({ title: '保存失败', icon: 'none' }); }
}

function selectRegion() {
  uni.chooseLocation({
    success: (res) => {
      const parts = (res.address || res.name || '').split('');
      // 简化处理，实际用省市区picker
      form.value.province = res.address || '';
    },
  });
}
</script>

<template>
  <view class="page">
    <view class="form-group">
      <text class="label">收货人</text>
      <input v-model="form.name" class="input" placeholder="请输入收货人姓名" />
    </view>
    <view class="form-group">
      <text class="label">手机号</text>
      <input v-model="form.phone" class="input" placeholder="请输入手机号" type="number" maxlength="11" />
    </view>
    <view class="form-group">
      <text class="label">省市区</text>
      <view class="picker-trigger" @tap="selectRegion">
        <text class="picker-text" v-if="form.province">{{ form.province }}{{ form.city }}{{ form.district }}</text>
        <text class="placeholder" v-else>请选择省市区</text>
      </view>
    </view>
    <view class="form-group">
      <text class="label">详细地址</text>
      <input v-model="form.detail" class="input" placeholder="街道、门牌号、楼层" />
    </view>
    <view class="form-group switch-row">
      <text class="label">设为默认地址</text>
      <switch :checked="form.isDefault" color="#D4A574" @change="form.isDefault = !form.isDefault" />
    </view>
    <view class="save-btn" @tap="save">保存</view>
  </view>
</template>

<style scoped>
.page { padding: 30rpx; }
.form-group { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.label { font-size: 26rpx; color: #333; font-weight: 500; display: block; margin-bottom: 12rpx; }
.input { height: 72rpx; font-size: 26rpx; border-bottom: 1rpx solid #f5f5f5; }
.picker-trigger { height: 72rpx; display: flex; align-items: center; }
.picker-text { font-size: 26rpx; color: #333; }
.placeholder { font-size: 26rpx; color: #ccc; }
.switch-row { display: flex; justify-content: space-between; align-items: center; }
.save-btn { background: #D4A574; color: #fff; text-align: center; height: 88rpx; line-height: 88rpx; border-radius: 44rpx; font-size: 30rpx; margin-top: 40rpx; }
</style>

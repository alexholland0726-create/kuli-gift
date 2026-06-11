<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { api } from '@/api/index';

const id = ref(0);
const form = ref({ name: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false });
const loading = ref(false);

const regionText = ref('');
const showRegionPicker = ref(false);
const regionData = ref([
  { label: '上海市', value: '上海市', children: [{ label: '黄浦区', value: '黄浦区' }, { label: '徐汇区', value: '徐汇区' }, { label: '浦东新区', value: '浦东新区' }, { label: '静安区', value: '静安区' }, { label: '长宁区', value: '长宁区' }, { label: '普陀区', value: '普陀区' }] },
  { label: '北京市', value: '北京市', children: [{ label: '东城区', value: '东城区' }, { label: '西城区', value: '西城区' }, { label: '朝阳区', value: '朝阳区' }, { label: '海淀区', value: '海淀区' }] },
  { label: '广东省', value: '广东省', children: [{ label: '广州市', value: '广州市' }, { label: '深圳市', value: '深圳市' }, { label: '东莞市', value: '东莞市' }] },
  { label: '浙江省', value: '浙江省', children: [{ label: '杭州市', value: '杭州市' }, { label: '宁波市', value: '宁波市' }, { label: '温州市', value: '温州市' }] },
  { label: '江苏省', value: '江苏省', children: [{ label: '南京市', value: '南京市' }, { label: '苏州市', value: '苏州市' }, { label: '无锡市', value: '无锡市' }] },
]);

onLoad(async (opt: any) => {
  if (opt.id) {
    id.value = Number(opt.id);
    await loadAddress();
  }
});

async function loadAddress() {
  try {
    const list = await api.addresses.list() as any[];
    const addr = (Array.isArray(list) ? list : []).find((a: any) => a.id === id.value);
    if (addr) {
      form.value = { name: addr.name, phone: addr.phone, province: addr.province, city: addr.city, district: addr.district, detail: addr.detail, isDefault: addr.isDefault };
      updateRegionText();
    }
  } catch (_) {}
}

function onRegionChange(e: any) {
  const vals = e.detail.value as number[];
  if (regionData.value[vals[0]]) {
    form.value.province = regionData.value[vals[0]].label;
    const children = regionData.value[vals[0]].children;
    if (children && children[vals[1]]) {
      form.value.city = children[vals[1]].label;
    }
    form.value.district = '';
  }
  updateRegionText();
}

function updateRegionText() {
  regionText.value = [form.value.province, form.value.city, form.value.district].filter(Boolean).join(' ');
}

async function save() {
  if (!form.value.name || !form.value.phone || !form.value.province || !form.value.detail) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' });
    return;
  }
  if (!/^1\d{10}$/.test(form.value.phone)) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' });
    return;
  }
  if (loading.value) return;
  loading.value = true;
  try {
    if (id.value) {
      await api.addresses.update(id.value, form.value);
    } else {
      await api.addresses.create(form.value);
    }
    uni.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 500);
  } catch (_) {
    uni.showToast({ title: '保存失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
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
      <picker
        mode="multiSelector"
        :range="regionData.map(p => [p.label, ...p.children.map(c => c.label)])"
        :value="[0, 0]"
        @change="onRegionChange"
      >
        <view class="picker-trigger">
          <text class="picker-text" v-if="form.province">{{ regionText }}</text>
          <text class="placeholder" v-else>请选择省市区</text>
        </view>
      </picker>
    </view>
    <view class="form-group">
      <text class="label">详细地址</text>
      <input v-model="form.detail" class="input" placeholder="街道、门牌号、楼层" />
    </view>
    <view class="form-group switch-row">
      <text class="label">设为默认地址</text>
      <switch :checked="form.isDefault" color="#D4A574" @change="form.isDefault = !form.isDefault" />
    </view>
    <view class="save-btn" :class="{ disabled: loading }" @tap="save">
      {{ loading ? '保存中...' : '保存' }}
    </view>
  </view>
</template>

<style scoped>
.page { padding: 30rpx; }
.form-group { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.label { font-size: 26rpx; color: #333; font-weight: 500; display: block; margin-bottom: 12rpx; }
.input { height: 72rpx; font-size: 26rpx; border-bottom: 1rpx solid #f5f5f5; width: 100%; }
.picker-trigger { height: 72rpx; display: flex; align-items: center; }
.picker-text { font-size: 26rpx; color: #333; }
.placeholder { font-size: 26rpx; color: #ccc; }
.switch-row { display: flex; justify-content: space-between; align-items: center; }
.save-btn { background: #D4A574; color: #fff; text-align: center; height: 88rpx; line-height: 88rpx; border-radius: 44rpx; font-size: 30rpx; margin-top: 40rpx; }
.save-btn.disabled { opacity: 0.6; }
</style>

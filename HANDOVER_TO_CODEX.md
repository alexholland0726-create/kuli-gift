# 酷礼工坊小程序 — 项目交接文档

> 从 Hermes 交接给 Codex
> 日期：2026-06-06

---

## 一、项目概览

酷礼工坊电商小程序，上海贝羽智能科技有限公司旗下礼品定制电商平台。

- 后端：NestJS + TypeORM + MySQL，独立 API 服务
- 前端：uni-app (Vue3) + uview-plus + pinia，编译为微信小程序
- 域名：api.da-fire.com → 端口 3001
- 仓库：`git@github.com:alexholland0726-create/kuli-gift.git`

---

## 二、项目结构

```
/root/kuli-gift/
├── HANDOVER_TO_CODEX.md          ← 本文件
├── SERVER_CONVENTION.md          ← 服务器公约（双人共管规则）
├── 有赞功能对照实现方案.md       ← 有赞对标功能规划
├── server/                       ← NestJS 后端
│   ├── src/
│   │   ├── main.ts               ← 入口，端口 3001
│   │   ├── app.module.ts         ← 主模块，TypeORM 连接配置
│   │   ├── config/database.config.ts
│   │   ├── auth/                 ← JWT 微信登录认证
│   │   ├── user/                 ← 用户模块
│   │   ├── product/              ← 商品模块
│   │   ├── category/             ← 分类模块
│   │   ├── cart/                 ← 购物车
│   │   ├── order/                ← 订单
│   │   ├── address/              ← 收货地址
│   │   ├── pay/                  ← 支付（待完善）
│   │   ├── coupon/               ← 优惠券
│   │   ├── groupon/              ← 拼团
│   │   ├── share/                ← 分享裂变
│   │   └── upload/               ← 文件上传
│   ├── nginx/kuli-api.conf       ← Nginx 反代配置（部署时复制到 /etc/nginx/conf.d/）
│   ├── .env                      ← 数据库/Redis/JWT/微信凭证
│   └── dist/                     ← 编译产物
├── frontend/                     ← uni-app 前端
│   └── src/
│       ├── api/
│       │   ├── http.ts           ← HTTP 客户端，BASE_URL = https://api.da-fire.com
│       │   └── index.ts          ← API 接口封装
│       ├── stores/cart.ts        ← Pinia 购物车状态
│       ├── pages/
│       │   ├── index/index.vue       ← 首页
│       │   ├── category/category.vue ← 分类
│       │   ├── product/list.vue      ← 商品列表
│       │   ├── product/detail.vue    ← 商品详情
│       │   ├── cart/cart.vue         ← 购物车
│       │   ├── order/settle.vue      ← 结算
│       │   ├── order/list.vue        ← 订单列表
│       │   ├── address/list.vue      ← 地址列表
│       │   ├── address/edit.vue      ← 地址编辑
│       │   ├── coupon/list.vue       ← 优惠券
│       │   ├── groupon/list.vue      ← 拼团列表
│       │   ├── groupon/detail.vue    ← 拼团详情
│       │   ├── search/search.vue     ← 搜索
│       │   ├── share/share.vue       ← 分享
│       │   └── user/user.vue         ← 我的
│       └── main.ts               ← 前端入口
```

---

## 三、服务器部署信息

### 连接
- IP：116.62.231.113
- 用户：root
- 后端当前未在服务器上运行（从未部署过生产进程）

### 端口与域名
| 项目 | 值 |
|------|-----|
| API 域名 | api.da-fire.com |
| 后端端口 | 3001 |
| Nginx 配置 | /etc/nginx/conf.d/kuli-api.conf（已配置 SSL） |
| SSL 证书 | /etc/ssl/da-fire-api/ |

### 数据库
- MySQL 容器名：kuli-mysql
- 端口：3307
- 数据库名：kuli_gift
- 密码：保存在 /root/kuli-gift/server/.env 中

### Redis
- 端口：6379（注意：.env 里配的是 6380，需确认）
- 密码：保存在 .env 中

### 部署步骤（从未做过，待 Codex 完成）
1. `cd /root/kuli-gift/server && npm run build`
2. 配置 PM2 进程守护：`pm2 start dist/main.js --name kuli-api`
3. 确认 nginx 反代到 localhost:3001 正常
4. 前端 build 为微信小程序：`cd /root/kuli-gift/frontend && npm run build:mp-weixin`
5. 用微信开发者工具上传

---

## 四、服务器公约（双人共管规则）

详见 `/root/kuli-gift/SERVER_CONVENTION.md`，核心要点：

| 管辖方 | 内容 |
|--------|------|
| **Codex** | /www/diang-fire-platform/、/etc/nginx/conf.d/da-fire.conf |
| **Hermes** | 不再管辖小程序代码（已交接给你） |
| **共享** | MySQL、Redis、Nginx 全局 |
| **禁止** | 双方不得修改对方目录，除非用户明确确认 |

**小程序完全移交给 Codex 后，Hermes 不再动 /root/kuli-gift/ 和 /www/kuli/ 下任何文件。** 但 Hermes 仍可配合提供辅助信息、飞书看板更新、运营工具等。

---

## 五、微信小程序配置

- AppID：wx9194755d087b4120
- 微信公众平台已配置：
  - request 合法域名：https://api.da-fire.com
  - uploadFile 合法域名：https://api.da-fire.com
  - downloadFile 合法域名：https://api.da-fire.com

---

## 六、有赞功能对标

详情见 `/root/kuli-gift/有赞功能对照实现方案.md`。

已经实现的基础模块：
- [x] 商品管理（分类 + 商品详情）
- [x] 购物车
- [x] 订单（创建、列表、状态流转）
- [x] 微信登录（JWT）
- [x] 收货地址
- [x] 文件上传
- [x] 优惠券

待开发/完善模块：
- [ ] 微信支付对接
- [ ] 拼团完整流程
- [ ] 分享裂变数据统计
- [ ] 运营后台（目前没有管理端，只有 API）
- [ ] 跨境海淘（公司有进出口资质）

---

## 七、飞书看板

项目进度看板已通过飞书多维表格建立：
- App ID：cli_aa917d3fdefbdcd2
- 表格已创建并写入 24 条任务数据
- 可通过 API 自动更新

---

## 八、注意事项

1. **前端图片占位图**：不要用 /static/placeholder.png，用 data URI inline SVG（编译后文件可能不存在）
2. **.env 文件**：直接读取 `/root/kuli-gift/server/.env` 获取凭证（敏感信息如需查看，通过终端 cat）
3. **数据库同步**：TypeORM 配置了 `synchronize: true`，生产环境建议改为 false 并手动迁移
4. **CORS**：后端已配置 `origin: '*'`，方便开发调试
5. **Hermes 后续角色**：交接后不再动代码，但可以继续：
   - 更新飞书看板状态
   - 提供运营数据分析
   - 辅助排查问题（通过共享文件/截图让 Codex 帮忙看图）
   - 处理服务器基础设施相关配置

---

*以上是全部项目资料，交给 Codex 后请继续推进。有问题随时通过用户联系我。*

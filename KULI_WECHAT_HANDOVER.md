# 酷礼工坊微信小程序 — 完整交接资料

> 编写：Hermes | 日期：2026-06-06
> 用途：供 Codex 全面接手小程序开发

---

## 1. 代码路径与仓库

### 本地代码（WSL）
```
/root/kuli-gift/
├── server/       ← NestJS 后端源码
├── frontend/     ← uni-app 前端源码
└── 有赞功能对照实现方案.md
```

### 部署目录（服务器 ECS 116.62.231.113）
暂未部署到服务器上，需 Codex 完成首次部署。

### Git 仓库
- 地址：`git@github.com:alexholland0726-create/kuli-gift.git`
- 当前分支：`main`
- 远程分支：`origin/main`

---

## 2. 已完成页面和功能

### 前端页面（共 15 个）

| 页面 | 路径 | 状态 |
|------|------|------|
| 首页 | `pages/index/index.vue` | ✅ 基本完成：轮播Banner、分类快捷入口、热门推荐商品列表 |
| 分类页 | `pages/category/category.vue` | ✅ 基本完成：两栏布局（左分类列表+右商品网格） |
| 商品列表 | `pages/product/list.vue` | ✅ 基本完成：支持按分类筛选、关键词搜索 |
| 商品详情 | `pages/product/detail.vue` | ✅ 基本完成：轮播图、价格、规格选择、加购、分享 |
| 购物车 | `pages/cart/cart.vue` | ✅ 基本完成：商品列表、数量加减、选中/全选、删除、结算跳转 |
| 结算页 | `pages/order/settle.vue` | ✅ 已创建：地址选择、商品预览、优惠券选择、支付提交 |
| 订单列表 | `pages/order/list.vue` | ✅ 已创建：按状态筛选 |
| 我的 | `pages/user/user.vue` | ✅ 基本完成：用户信息、订单入口、收货地址、优惠券、分享记录 |
| 收货地址列表 | `pages/address/list.vue` | ✅ 已完成 |
| 编辑地址 | `pages/address/edit.vue` | ✅ 已完成 |
| 优惠券列表 | `pages/coupon/list.vue` | ✅ 已完成 |
| 拼团列表 | `pages/groupon/list.vue` | ✅ 已创建 |
| 拼团详情 | `pages/groupon/detail.vue` | ✅ 已创建 |
| 搜索页 | `pages/search/search.vue` | ✅ 已创建 |
| 分享记录 | `pages/share/share.vue` | ✅ 已完成 |

### 后端模块（共 14 个）

| 模块 | 路径 | 核心能力 |
|------|------|---------|
| auth | `src/auth/` | ✅ JWT 微信登录（通过 openid 注册/登录） |
| user | `src/user/` | ✅ 用户 CRUD、积分、分享记录 |
| product | `src/product/` | ✅ 商品 CRUD、分类筛选、关键词搜索、推荐标记 |
| category | `src/category/` | ✅ 分类 CRUD、排序 |
| cart | `src/cart/` | ✅ 购物车增删改查、数量调整、选中状态 |
| order | `src/order/` | ✅ 订单创建、列表、状态流转（pending→paid→shipped→delivered→completed） |
| address | `src/address/` | ✅ 地址 CRUD、默认地址 |
| coupon | `src/coupon/` | ✅ 优惠券 CRUD、领取、核销、新人专享券、定时过期清理 |
| groupon | `src/groupon/` | ✅ 拼团活动、开团/参团、成团检测、超时自动退款标记 |
| share | `src/share/` | ✅ 分享记录、积分奖励 |
| pay | `src/pay/` | ⚠️ 已实现微信支付 V3 统一下单/回调/查单框架，但缺商户号配置 |
| upload | `src/upload/` | ✅ 文件上传 |
| config | `src/config/` | ✅ 数据库配置 |

---

## 3. 未完成事项、已知问题、下一步计划

### 未完成的核心功能

| 功能 | 现状 | 优先级 |
|------|------|--------|
| **微信支付对接** | PayService 已写完整 V3 JSAPI 代码，但 .env 中缺少商户号（`WX_MCHID`）、APIv3 密钥、商户证书 | 🔴 最高 |
| **运营管理后台** | 完全没有，目前只能通过数据库直接操作商品/分类/优惠券 | 🔴 高 |
| **用户注销/退出登录** | 未实现 | 🟡 中 |
| **订单取消功能** | API 有 updateStatus，但前端未对接"取消订单"按钮 | 🟡 中 |
| **拼团完整前端流程** | 后端逻辑已写完，但前端页面未完全调通 | 🟡 中 |
| **跨境海淘** | 公司有进出口资质，但代码层面未实现海关三单对碰、实名认证等 | 🟢 低 |
| **分销员系统** | 未开始 | 🟢 低 |
| **积分商城** | 已有积分但没有积分兑换功能 | 🟢 低 |

### 已知 Bug 和风险点

| # | 问题 | 严重程度 |
|---|------|---------|
| 1 | **支付流程缺真实商户号**：PayService 完整但 `WX_MCHID`/`WX_API_V3_KEY`/`WX_CERT_PATH` 均未配置。测试环境走 `mock_signature_for_dev` 跳过签名，无法真实调起支付 | 🔴 |
| 2 | **购物车选中状态批量更新 bug**：`CartService.updateSelected()` 中 `ids.map(...)` 传入 `update()` 的 where 条件格式不正确，TypeORM 不支持数组对象作为 where | 🟡 |
| 3 | **优惠券过期 cron 不准确**：`CouponService.expireCoupons()` 直接更新所有 `unused` 券为 `expired`，没有 join coupon 表检查真正的 endTime | 🟡 |
| 4 | **拼团超时退款未对接真实支付**：`checkTimeoutGroups` 只改了状态为 `timeout`，注释写了"这里应该触发退款逻辑"但未实现 | 🟡 |
| 5 | **JWT 默认密钥硬编码**：`jwt.strategy.ts` 中 `secretOrKey` 的 fallback 是硬编码的 `'kuli-gift-secret-2026'`，生产必须改 | 🟡 |
| 6 | **synchronize: true**：TypeORM 配置了 `synchronize: true`，开发方便但生产环境有风险（可能误删数据） | 🟡 |
| 7 | **前端 tabBar 图标缺失**：`pages.json` 引用了 `static/tab/*.png`，但这些图标文件可能不存在 | 🟡 |
| 8 | **首页 Banner 数据写死**：Banner 列表目前在 Vue 组件中硬编码，没有接口 | 🟢 |
| 9 | **后端未部署到服务器**：`dist/` 目录存在但从未在生产环境运行过 | 🟢 |

### 下一步计划（建议）

```
Phase 1 — 上线核心交易闭环
  □ 申请微信商户号，配置支付参数
  □ 修复购物车选中 bug
  □ 部署后端到 ECS（PM2 + Nginx）
  □ 修复已知 bug #2 #3 #5 #6
  □ 完善订单取消、用户注销

Phase 2 — 增长工具
  □ 拼团完整前端流程调试
  □ 优惠券+新人专享券前端对接
  □ 小程序提交审核并发布

Phase 3 — 运营后台
  □ 开发简易管理后台（商品管理、订单管理、优惠券管理）
  □ 数据统计看板
```

---

## 4. 本地运行、构建、上传、发布流程

### 后端启动（本地开发）

```bash
cd /root/kuli-gift/server

# 安装依赖（首次）
npm install

# 开发模式（热重载）
npm run start:dev

# 生产编译
npm run build

# 生产运行
npm start:prod
```

### 前端启动（本地开发）

```bash
cd /root/kuli-gift/frontend

# 安装依赖（首次）
npm install

# H5 开发（浏览器预览）
npm run dev:h5

# 编译微信小程序
npm run build:mp-weixin
```

### 微信开发者工具打开

1. 运行 `npm run build:mp-weixin`
2. 编译产物在 `frontend/dist/build/mp-weixin/`
3. 打开微信开发者工具 → 导入项目 → 选择该目录
4. AppID 填入 `wx9194755d087b4120`
5. 点击"编译"即可在模拟器中预览

### 上传与发布

1. 在微信开发者工具中 → 工具栏"上传" → 填写版本号和说明
2. 登录 [微信公众平台](https://mp.weixin.qq.com/) → 版本管理 → 提交审核
3. 审核通过后点击"发布"

---

## 5. 依赖安装与环境变量

### 后端依赖（server/package.json）

核心依赖：
- `@nestjs/common/core/platform-express` — NestJS 框架 v11
- `@nestjs/typeorm` + `typeorm` + `mysql2` — 数据库 ORM
- `@nestjs/jwt` + `passport` + `passport-jwt` — JWT 认证
- `@nestjs/config` — 环境变量配置
- `@nestjs/schedule` — 定时任务（优惠券过期、拼团超时）
- `@nestjs/serve-static` — 静态文件服务（上传目录）
- `bcrypt` — 密码加密
- `class-validator` + `class-transformer` — 请求校验

### 前端依赖（frontend/package.json）

核心依赖：
- `@dcloudio/uni-app` + 各平台插件 — uni-app 框架 v3
- `uview-plus` — UI 组件库
- `pinia` — 状态管理
- `vue-i18n` — 国际化（未实际使用）

### 环境变量文件

路径：`/root/kuli-gift/server/.env`

```
# Database
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USERNAME=root
DB_PASSWORD=<存在于文件中>

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6380    # 注意：服务器 Redis 实际端口是 6379，需要确认
REDIS_PASSWORD=<存在于文件中>

# JWT
JWT_SECRET=<存在于文件中>

# App
APP_PORT=3001
APP_NAME=酷礼工坊

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# WeChat
WECHAT_APPID=wx9194755d087b4120
WECHAT_SECRET=<存在于文件中>

# WeChat Pay（未配置）
# WX_MCHID=
# WX_API_V3_KEY=
# WX_CERT_PATH=
# WX_CERT_SERIAL=
# WX_PRIVATE_KEY=
# WX_NOTIFY_URL=https://api.da-fire.com/api/pay/notify
```

**密钥和密码均已在文件中，通过 `cat /root/kuli-gift/server/.env` 查看。**

---

## 6. 小程序配置

### AppID
`wx9194755d087b4120`

配置位置：
- `frontend/src/manifest.json` — `"mp-weixin"."appid"`
- 微信开发者工具导入项目时填写

### API Base URL
`https://api.da-fire.com`

配置位置：
- `frontend/src/api/http.ts` — 第 1 行 `const BASE_URL = 'https://api.da-fire.com'`

所有 API 请求均拼接此前缀，如 `https://api.da-fire.com/api/products`。

### 合法域名（微信公众平台已配置）

| 类型 | 域名 |
|------|------|
| request 合法域名 | `https://api.da-fire.com` |
| uploadFile 合法域名 | `https://api.da-fire.com` |
| downloadFile 合法域名 | `https://api.da-fire.com` |

---

## 7. 接口清单

所有接口前缀：`https://api.da-fire.com`

### 7.1 认证

**POST /api/auth/login** — 微信登录
```
请求参数: { openid: string, nickname?: string, avatar?: string }
返回示例: {
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "openid": "xxx", "nickname": "微信用户", "avatar": "", "points": 0 }
}
```

**GET /api/auth/user** — 获取用户信息（需 Bearer token）
```
返回示例: { "id": 1, "openid": "xxx", "nickname": "微信用户", "avatar": "", "points": 10 }
```

### 7.2 分类

**GET /api/categories** — 获取所有分类
```
返回示例: [{ "id": 1, "name": "商务礼品", "icon": "", "sort": 0, "isActive": true }]
```

**GET /api/categories/:id** — 获取单个分类（含商品列表）
```
返回示例: { "id": 1, "name": "商务礼品", "products": [ ... ] }
```

### 7.3 商品

**GET /api/products** — 商品列表
```
请求参数（query）:
  categoryId?: number    — 按分类筛选
  keyword?: string       — 关键词搜索
  recommended?: boolean  — 仅推荐商品
  page?: number          — 页码（默认1）
  limit?: number         — 每页条数（默认20）
返回示例: {
  "items": [{ "id": 1, "name": "定制保温杯", "price": 99.00, "originalPrice": 129.00, "coverImage": "", "sales": 128, "tags": ["热销"], "category": {...} }],
  "total": 5
}
```

**GET /api/products/:id** — 商品详情
```
返回示例: {
  "id": 1, "name": "定制保温杯", "description": "...", "price": 99.00,
  "originalPrice": 129.00, "images": [], "coverImage": "", "stock": 500,
  "sales": 128, "specs": [{"name":"颜色","values":["红色","蓝色"]}],
  "tags": ["热销"], "category": {...}, "shareTitle": "", "shareDesc": ""
}
```

### 7.4 购物车

**GET /api/cart** — 获取购物车列表
```
返回示例: [{ "id": 1, "userId": 1, "productId": 1, "spec": "红色", "quantity": 2, "selected": true, "product": {...} }]
```

**POST /api/cart** — 添加到购物车
```
请求参数: { productId: number, quantity: number, spec?: string }
```

**PUT /api/cart/:id/quantity** — 修改数量
```
请求参数: { quantity: number }
```

**PUT /api/cart/select** — 批量选中/取消（有bug）
```
请求参数: { ids: number[], selected: boolean }
```

**DELETE /api/cart/:id** — 删除购物车项
**DELETE /api/cart** — 清空购物车

### 7.5 订单

**POST /api/orders** — 创建订单
```
请求参数: {
  items: [{ productId, name, coverImage, price, quantity, spec }],
  totalAmount: number,
  payAmount: number,
  consignee?: string, phone?: string, address?: string,
  remark?: string
}
返回示例: { "id": 1, "orderNo": "KL20260606120000A1B2C3", "status": "pending", ... }
```

**GET /api/orders** — 获取用户订单列表
```
返回示例: [{ "id": 1, "orderNo": "KL20260606...", "status": "pending", "payAmount": 99.00, ... }]
```

**GET /api/orders/:id** — 订单详情

**PUT /api/orders/:id/status** — 更新订单状态
```
请求参数: { status: "paid" | "shipped" | "delivered" | "completed" | "cancelled" }
```

### 7.6 地址

**GET /api/addresses** — 地址列表
**POST /api/addresses** — 新增地址
```
请求参数: { name, phone, province, city, district, detail, isDefault? }
```
**PUT /api/addresses/:id** — 编辑地址
**DELETE /api/addresses/:id** — 删除地址

### 7.7 优惠券

**GET /api/coupons/available** — 可领取优惠券列表
**GET /api/coupons/user** — 用户已领优惠券

**POST /api/coupons/claim/:couponId** — 领取优惠券
**POST /api/coupons/use** — 使用优惠券
```
请求参数: { userCouponId: number, orderId: number }
```

### 7.8 拼团

**GET /api/groupon/activities** — 进行中的拼团活动
**POST /api/groupon/create/:activityId** — 开团
**POST /api/groupon/join/:activityId/:groupId** — 参团
**GET /api/groupon/progress/:activityId/:groupId** — 拼团进度

### 7.9 分享

**POST /api/share/record** — 记录分享（每次分享+10积分）
```
请求参数: { productId: number }
返回示例: { "points": 10 }
```

**GET /api/share/stats** — 分享统计

### 7.10 上传

**POST /api/upload** — 文件上传（multipart/form-data）

### 7.11 支付

**POST /api/pay/create/:orderId** — 发起支付
```
请求参数（需登录）: 无额外body
返回示例: { "timeStamp": "1717660800", "nonceStr": "abc...", "package": "prepay_id=...", "signType": "RSA", "paySign": "..." }
```
⚠️ 当前返回 mock 签名，需配置商户号后才可真实调起支付

**POST /api/pay/notify** — 微信支付回调（需外网可达）

---

## 8. 数据库表结构

数据库名：`kuli_gift`（MySQL 容器 kuli-mysql:3307）

### 8.1 users（用户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | |
| openid | varchar(100) | 微信 openid |
| nickname | varchar(100) | 微信昵称 |
| avatar | varchar(500) | 头像 URL |
| phone | varchar(20) | 手机号 |
| points | int | 积分 |
| isActive | bool | |
| shareHistory | JSON | 分享记录数组 |
| createdAt/updatedAt | datetime | |

### 8.2 categories（分类表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | |
| name | varchar(100) | 分类名称 |
| icon | varchar(500) | 图标 URL |
| sort | int | 排序号 |
| isActive | bool | |

### 8.3 products（商品表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | |
| name | varchar(200) | 商品名 |
| description | text | 商品描述 |
| price | decimal(10,2) | 售价 |
| originalPrice | decimal(10,2) | 原价 |
| images | simple-array | 图片列表 |
| coverImage | varchar(500) | 封面图 |
| stock | int | 库存 |
| sales | int | 销量 |
| isActive | bool | 上下架 |
| isRecommended | bool | 推荐标记 |
| specs | JSON | 规格定义 [{name, values}] |
| tags | simple-array | 标签 |
| categoryId | int FK | |
| shareTitle/Desc | text | 分享文案 |

### 8.4 orders（订单表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | |
| orderNo | varchar(50) | 订单号（KL+时间+随机串） |
| userId | int FK | |
| items | JSON | 商品快照 |
| totalAmount | decimal(10,2) | 总金额 |
| discountAmount | decimal(10,2) | 优惠金额 |
| payAmount | decimal(10,2) | 实付金额 |
| status | varchar(50) | pending/paid/shipped/delivered/completed/cancelled |
| consignee/phone/address | | 收货信息 |
| paidAt/shippedAt/completedAt | datetime | 时间戳 |

### 8.5 cart_items（购物车表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | |
| userId | int FK | |
| productId | int FK | |
| spec | varchar(100) | 所选规格 |
| quantity | int | 数量 |
| selected | bool | 是否选中 |

### 8.6 addresses（地址表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | |
| userId | int FK | |
| name/phone | varchar | 收件人 |
| province/city/district/detail | varchar | 地址 |
| isDefault | bool | 默认地址 |

### 8.7 coupons（优惠券定义表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | |
| name | varchar(100) | 券名称 |
| type | varchar(20) | discount/full_reduce/random/exchange |
| value | decimal(10,2) | 折扣值 |
| minAmount | decimal(10,2) | 满减门槛 |
| totalStock/usedStock | int | 库存/已发 |
| startTime/endTime | datetime | 有效期 |
| scope | varchar(50) | public/newbie/member/fan |
| perUserLimit | int | 每人限领 |
| applicableProducts | JSON | 适用商品ID |

### 8.8 user_coupons（用户优惠券表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | |
| userId | int FK | |
| couponId | int FK | |
| status | varchar(20) | unused/used/expired |
| orderId | int | 核销订单ID |

### 8.9 groupon_activities（拼团活动表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | |
| productId | int | 商品ID |
| groupPrice | decimal | 团购价 |
| targetNum | int | 成团人数 |
| startTime/endTime | datetime | 活动时间 |
| type | varchar(20) | normal/newbie/ladder/multi |
| ladderPrices | JSON | 阶梯价 |

### 8.10 groupon_orders（拼团订单表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | |
| activityId | int FK | |
| groupId | int | 团ID |
| userId | int | |
| payAmount | decimal | |
| status | varchar(20) | paying/paid/success/refunded/timeout |
| orderId | int | 关联商城订单 |
| isLeader | bool | 是否团长 |

### 数据关系图
```
users ──hasMany──> orders
users ──hasMany──> cart_items
users ──hasMany──> addresses
users ──hasMany──> user_coupons
users ──hasMany──> groupon_orders

categories ──hasMany──> products
products ──hasMany──> cart_items
products ──hasMany──> groupon_activities

coupons ──hasMany──> user_coupons
groupon_activities ──hasMany──> groupon_orders
```

### 是否复用官网后台数据
酷礼工坊小程序与帝昂官网（www.da-fire.com）**完全独立**，二者不共享任何数据库或表。官网由 Codex 另一个项目维护，数据库不同。

---

## 9. 服务器部署

### 连接信息
- IP：116.62.231.113
- 用户：root

### 域名
| 域名 | 用途 | 归属 |
|------|------|------|
| api.da-fire.com | 小程序 API 服务 | Codex（原 Hermes，已交接） |
| www.da-fire.com | 帝昂官网 | Codex |
| da-fire.com | 跳转到 www | Codex |

### 部署目录
- 小程序代码：`/root/kuli-gift/`（源码）
- 后端部署目标：`/www/kuli/server/`（待部署）
- 前端部署目标：`/www/kuli/mp-weixin/`（待部署）

### Nginx 反代配置

文件：`/root/kuli-gift/server/nginx/kuli-api.conf`
部署目标：`/etc/nginx/conf.d/kuli-api.conf`

配置内容：
```
server {
    listen 443 ssl http2;
    server_name api.da-fire.com;
    ssl_certificate /etc/ssl/da-fire-api/fullchain.cer;
    ssl_certificate_key /etc/ssl/da-fire-api/api.da-fire.com.key;
    client_max_body_size 50m;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Nginx 配置已就绪，SSL 证书已配置。后端服务启动后 Nginx 会自动把 api.da-fire.com 反代到 localhost:3001。

### 部署步骤（首次）
```bash
# 1. 编译后端
cd /root/kuli-gift/server && npm run build

# 2. 复制到部署目录
mkdir -p /www/kuli/server
cp -r dist/ package.json node_modules/ .env /www/kuli/server/

# 3. PM2 启动
pm2 start /www/kuli/server/dist/main.js --name kuli-api

# 4. 编译前端小程序
cd /root/kuli-gift/frontend && npm run build:mp-weixin

# 5. 复制前端产物
mkdir -p /www/kuli/mp-weixin
cp -r dist/build/mp-weixin/* /www/kuli/mp-weixin/
```

---

## 10. 页面状态、设计稿与视觉效果

### 页面完成状态说明

> ⚠️ 本小程序**从未在真机上运行过**，所有页面仅在开发环境 H5 浏览器和微信开发者工具模拟器中测试过。**无设计稿、无页面截图**。

| 页面 | 完成度 | UI 问题 | 视觉要求 |
|------|--------|---------|---------|
| **首页** | 约 70% | Banner 数据硬编码；图片占位符是 SVG 文字；分类图标无真实图片；推荐商品无真实数据 | 主题色 #D4A574 暖色系 |
| **分类页** | 约 70% | 左列表右商品的两栏布局已实现，但无真实分类数据 | 同上 |
| **商品列表** | 约 70% | 网格布局已完成，依赖后端真实数据 | 图片占位符待替换 |
| **商品详情** | 约 80% | 轮播图、价格、规格选择、加购弹窗已实现，规格选择交互逻辑完整 | 需真实商品图片 |
| **购物车** | 约 80% | 列表展示、数量加减、勾选/全选、删除、去结算跳转，功能完整 | 同上 |
| **结算页** | 约 60% | 地址选择、商品预览、优惠券选择框架已建，但支付确认按钮点了走 setTimeout 伪支付 | 无设计稿 |
| **我的** | 约 70% | 用户信息卡片、订单入口、功能列表已实现 | 需品牌个人中心升级 |
| **拼团列表/详情** | 约 40% | 页面框架已建但未联调后端 | — |
| **搜索页** | 约 50% | 基本框架已建 | — |

### 设计规范
- 主题色：#D4A574（暖色/金色系）
- 导航栏背景色：#FFFFFF
- 页面背景色：#F8F8F8
- tabBar 选中颜色：#D4A574
- tabBar 未选中颜色：#999999
- 无品牌 Logo 设计（用户拒绝 SVG/Canvas 手写 Logo，建议用 AI 生图工具或专业设计师）

### 待补充
- [ ] 品牌设计稿 / Figma / Sketch 源文件
- [ ] UI 设计师确认的最终效果图
- [ ] 小程序真机截图（需先在微信开发者工具编译并在真机预览）
- [ ] 已验收页面和需修改页面的标注

---

## 11. 不能随便改的地方、TODO、风险点

### 不准改的地方（硬约束）

| # | 内容 | 原因 |
|---|------|------|
| 1 | `frontend/src/api/http.ts` 中的 BASE_URL | 已配置为 https://api.da-fire.com，微信合法域名白名单绑定此域名 |
| 2 | `frontend/src/manifest.json` 的 AppID `wx9194755d087b4120` | 微信小程序唯一标识，改了就废 |
| 3 | 图片占位图用 data URI inline SVG 的方式 | 因 `static/placeholder.png` 编译后可能不存在 |
| 4 | `server/nginx/kuli-api.conf` 的 proxy_pass http://127.0.0.1:3001 | 与 Nginx 已部署的 SSL 配置配套 |
| 5 | 服务器公约（SERVER_CONVENTION.md）端口分配 | 80/443 公共、3000 官网、3001 小程序，不能冲突 |
| 6 | .env 中的数据库密码和微信 Secret | 可改但必须同步更新 MySQL 容器和微信公众平台 |

### TODO 标记（代码中的临时写法）

| 位置 | 内容 | 说明 |
|------|------|------|
| `server/src/pay/pay.service.ts:255` | `return 'mock_signature_for_dev'` | 微信支付开发阶段的 mock，上线前必须替换 |
| `server/src/auth/jwt.strategy.ts:16` | `'kuli-gift-secret-2026'` | JWT 默认密钥，生产环境必须从 .env 读取强密钥 |
| `server/src/coupon/coupon.service.ts:117` | `// 实际需要 join coupon 表查 endTime，简化处理` | 优惠券过期 cron 不准确，需要修复 |
| `server/src/groupon/groupon.service.ts:136` | `// 这里应该触发退款逻辑` | 拼团超时退款未实现 |
| `server/src/app.module.ts:36` | `synchronize: true` | 生产应改为 false |
| `frontend/src/pages/order/settle.vue` | `setTimeout(() => { ... uni.requestPayment ... })` | 临时模拟支付流程 |

### 风险点

1. **服务器 116.62.231.113 目前 WSL 无法直连 SSH**（可能是网络或防火墙原因），部署可能需要通过用户中转
2. **前端编译依赖 node 版本**，WSL 当前是 v22.22.3，与 uni-app 的兼容性需要确认
3. **微信小程序审核**：第一次提交审核如果代码不完整（如支付未实现）可能被拒
4. **数据库密码泄露风险**：.env 文件包含数据库密码，注意不要提交到公开仓库

---

## 12. Git 分支与未提交改动

### 当前分支
```
* main（当前分支）
  remotes/origin/main
```

### 最近关键提交
```
eebce42 Merge branch 'main' of github.com:alexholland0726-create/kuli-gift
8ec6282 init
07a6855 init: 酷礼工坊电商小程序 - NestJS后端 + uni-app前端
```

只有 3 次提交，仓库还比较新。

### 未提交改动（共 30 个文件）

**前端改动（16 个文件）：**
```
frontend/src/api/http.ts          — BASE_URL 改为 https://api.da-fire.com
frontend/src/api/index.ts         — 新增所有 API 封装
frontend/src/manifest.json        — 填入 AppID
frontend/src/pages.json           — tabBar 配置 + 新页面注册
frontend/src/pages/address/*.vue  — 地址管理完整实现
frontend/src/pages/cart/cart.vue  — 购物车完整实现
frontend/src/pages/category/category.vue — 分类页实现
frontend/src/pages/coupon/list.vue — 优惠券列表
frontend/src/pages/index/index.vue — 首页完整实现
frontend/src/pages/product/*.vue  — 列表+详情完整实现
frontend/src/pages/share/share.vue — 分享记录
frontend/src/pages/user/user.vue  — 个人中心
```

**新增未跟踪文件（8 个）：**
```
HANDOVER_TO_CODEX.md              — 本交接文档
SERVER_CONVENTION.md              — 服务器公约
frontend/src/pages/order/settle.vue — 结算页
frontend/src/pages/search/         — 搜索页
frontend/src/stores/cart.ts        — 购物车状态管理
server/nginx/kuli-api.conf         — Nginx 配置
server/src/cart/                   — 购物车后端模块（完整）
```

**后端改动（14 个文件）：**
```
server/src/app.module.ts           — 注册所有新模块
server/src/auth/auth.module.ts     — JWT 策略注册
server/src/category/*.ts           — 分类模块完善
server/src/coupon/*.ts             — 优惠券模块
server/src/groupon/*.ts            — 拼团模块
server/src/main.ts                 — CORS + 端口配置
server/src/order/*.ts              — 订单模块
server/src/product/*.ts            — 商品模块（含规格）
server/src/share/*.ts              — 分享模块
server/src/user/*.ts               — 用户模块（含积分）
```

### 建议
交接后 Codex 可以先 commit 并 push 当前所有改动，确保远程仓库代码是最新的。

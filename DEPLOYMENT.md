# 酷礼工坊首版上线说明

首版范围：产品展示、产品详情、客户询价、员工产品管理、管理员账号授权。在线支付、订单和会员功能暂不开放。

## 上线前准备

1. 将 `api.da-fire.com` 加入微信公众平台的 request、uploadFile 和 downloadFile 合法域名。
2. API 服务器设置强随机环境变量：

   - `NODE_ENV=production`
   - `TYPEORM_SYNC=false`
   - `JWT_SECRET`（至少 32 位，保留给微信用户模块）
   - `STAFF_JWT_SECRET`（至少 32 位，与 JWT_SECRET 不同）
   - `STAFF_BOOTSTRAP_USERNAME`（首次管理员账号）
   - `STAFF_BOOTSTRAP_PASSWORD`（首次管理员密码，至少 12 位）
   - 数据库连接变量 `DB_HOST`、`DB_PORT`、`DB_USERNAME`、`DB_PASSWORD`、`DB_DATABASE`

3. 备份数据库，执行 `server/migrations/20260914-staff-inquiries.sql`。
4. 在 `server` 目录运行 `npm ci && npm run build`，使用进程管理器运行 `node dist/main.js`。
5. Nginx 将 `/api`、`/uploads` 和 `/admin` 代理到 API 服务，并只开放 HTTPS。
6. 管理后台地址为 `https://api.da-fire.com/admin/`。管理员首次登录后创建同事账号；同事只有产品上传、编辑和询价处理权限。
7. 在 `frontend` 目录运行 `npm ci && npm run build:mp-weixin`，用微信开发者工具导入 `frontend/dist/build/mp-weixin`，完成真机测试后提交审核。

首次管理员只会在员工表为空时自动创建。完成首次登录后，应从服务器环境中移除 `STAFF_BOOTSTRAP_PASSWORD`。不要把密码、数据库口令或微信密钥提交到 Git。

## 上线验收

- 未登录不能新增、修改、下架产品或上传文件。
- 产品编辑可以新增、编辑、上架产品和查看询价，不能管理同事账号或下架产品。
- 管理员可以创建、停用同事账号；账号停用后已有登录立即失效。
- 客户能浏览已上架产品、提交联系人和采购需求；后台能看到并标记处理状态。
- 图片伪装成其他文件、超大图片和非白名单格式会被拒绝。
- 小程序中没有在线支付入口，所有成交由工作人员线下确认。

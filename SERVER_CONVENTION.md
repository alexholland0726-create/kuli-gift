# 帝昂服务器资源公约

服务器：116.62.231.113

---

## 一、项目目录

**Codex 管辖：**
- /www/diang-fire-platform/    帝昂官网与后台
- /etc/nginx/conf.d/da-fire.conf    帝昂官网 Nginx 配置

**Codex 管辖（2026-06-06 小程序从 Hermes 移交至 Codex）：**
- /root/kuli-gift/             酷礼工坊完整项目（后端 + 前端源码）
- /www/kuli/server/            酷礼工坊后端 API
- /www/kuli/mp-weixin/         酷礼工坊小程序前端（编译产物）

**Hermes 管辖（暂无）：**
- Hermes 不再管辖小程序代码，保留辅助角色

双方不得修改对方目录，除非用户明确确认。

---

## 二、端口

| 端口 | 用途 | 归属 |
|------|------|------|
| 80 / 443 | 统一由系统 Nginx 对外提供网站访问 | 公共 |
| 3000 | 帝昂官网 | Codex |
| 3001 | 酷礼工坊 API（建议） | Hermes |
| 3306 | MySQL | 公共 |
| 6379 | Redis | 公共 |

任何新服务不得占用 80、443、3000。新增端口需登记并告知对方。

---

## 三、域名

| 域名 | 用途 | 归属 |
|------|------|------|
| www.da-fire.com | 帝昂官网 | Codex |
| da-fire.com | 跳转到 www.da-fire.com | Codex |
| api.da-fire.com | 酷礼工坊小程序 API（建议） | Hermes |

---

## 四、Nginx 规则

**Codex 管理：**
- /etc/nginx/conf.d/da-fire.conf

**Hermes 新建：**
- /etc/nginx/conf.d/kuli-api.conf（API 反代配置）

禁止 Hermes 覆盖或修改 da-fire.conf。

---

## 五、操作原则

- 修改 Nginx、重启服务、安装系统软件、调整端口前，必须先告知用户。
- 紧急恢复网站可先修复，修复后说明原因和改动。

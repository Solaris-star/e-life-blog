# E-Life Blog 安全审查报告

生成时间：2025-06-09
审查范围：前后端代码、认证授权、API 安全、数据库访问、配置管理

---

## 🔴 高危问题（需立即修复）

### 1. Host 头注入 + 本地 Admin 绕过
**文件**: `src/lib/cloudflare-access.ts:92-94`  
**问题**: 非生产环境下，`isLocalAdminHost()` 允许 `localhost/127.0.0.1/192.168.110.48` 绕过 Cloudflare Access 验证。攻击者如果能控制 Host 头，可直接访问管理后台。

**当前缓解**: 容器只绑定 `127.0.0.1:3003`，未暴露到公网。

**攻击场景**:
- 如果容器端口映射改为 `0.0.0.0:3003`，任何人都能通过修改 Host 头访问 admin
- 本地开发时，局域网内其他设备可伪造 Host 头访问

**修复建议**:
```typescript
export function isLocalAdminHost(host: string) {
  // 只在开发环境且真实来源 IP 在白名单时才允许
  if (process.env.NODE_ENV !== "production") {
    const allowedIps = ["127.0.0.1", "::1"];
    const clientIp = getTrustedClientIp(headers);
    return allowedIps.includes(clientIp) && 
           (host === "localhost" || host === "127.0.0.1");
  }
  return false;
}
```

---

### 2. Cloudflare Access 邮箱头可伪造
**文件**: `src/lib/cloudflare-access.ts:79-90`  
**问题**: `getCloudflareAccessIdentity()` 会在 JWT 验证失败后，直接信任 `cf-access-authenticated-user-email` 头，无任何签名验证。

**代码片段**:
```typescript
export async function getCloudflareAccessIdentity(headers: Headers) {
  const verifiedJwt = await verifyCloudflareAccessJwt(headers.get("cf-access-jwt-assertion"));
  if (verifiedJwt) return verifiedJwt;
  
  // ⚠️ 直接信任邮箱头，无验证
  const authenticatedEmail = headers.get("cf-access-authenticated-user-email")?.trim();
  if (!authenticatedEmail) return null;
  return { email: authenticatedEmail, claims: { email: authenticatedEmail } };
}
```

**攻击场景**:
- 本地开发时，任何人都能伪造 `cf-access-authenticated-user-email: admin@example.com` 获得 admin 权限
- 如果生产环境 CF Access 配置错误（没发 JWT），攻击者也能绕过

**修复建议**:
```typescript
export async function getCloudflareAccessIdentity(headers: Headers) {
  const verifiedJwt = await verifyCloudflareAccessJwt(headers.get("cf-access-jwt-assertion"));
  if (verifiedJwt) return verifiedJwt;
  
  // 生产环境必须有 JWT
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  
  // 开发环境才允许裸邮箱头，且需验证来源 IP
  const authenticatedEmail = headers.get("cf-access-authenticated-user-email")?.trim();
  if (!authenticatedEmail) return null;
  
  const clientIp = getTrustedClientIp(headers);
  if (!["127.0.0.1", "::1"].includes(clientIp)) return null;
  
  return { email: authenticatedEmail, claims: { email: authenticatedEmail } };
}
```

---

### 3. 邮箱域名白名单过严 + IP 限流失效
**文件**: `src/lib/member-registration-security.ts:26-31`  
**问题**: 
1. 只允许 `163.com/qq.com/hotmail.com/outlook.com` 注册
2. IP 提取不准确（记录到 Docker 网关 IP `172.30.0.1`），导致 IP 限流完全失效

**攻击场景**:
- 攻击者可批量注册这 4 个域名的邮箱（hotmail 可无限注册），绕过限流
- IP 限流失效后，单个攻击者可在短时间内注册数百个账号

**修复建议**:
1. 修复 IP 提取逻辑，正确读取 `CF-Connecting-IP` 或 `X-Forwarded-For`
2. 放宽邮箱域名限制，改为黑名单 + 一次性邮箱检测
3. 增强 Turnstile 人机验证，提高注册门槛

---

## 🟡 中危问题

### 4. Session 固定攻击风险
**文件**: `src/lib/member-store.ts:292-306`, `src/lib/member-auth.ts:57-67`  
**问题**: 登录成功后未轮换 session ID，存在 session 固定风险。

**攻击场景**:
- 攻击者诱导受害者访问含有预设 session cookie 的链接
- 受害者用该 session 登录后，攻击者可用同一 session ID 劫持会话

**修复建议**:
```typescript
export async function createMemberSession(userId: string, oldSessionId?: string) {
  if (oldSessionId) {
    await deleteStoredSession(oldSessionId);
  }
  const session = await createStoredSession(userId);
  // ... 设置 cookie
}
```

---

### 5. IP 地址提取不准确
**文件**: 已知问题，影响多个模块  
**问题**: `TRUST_PROXY_HEADERS=true` 但实际记录到的是 Docker 网关 IP `172.30.0.1`，导致：
- IP 限流完全失效
- 审计日志无法追溯真实来源
- 地理位置统计不准确

**修复建议**:
- 检查代理链路：EdgeOne → Caddy/frp → Docker
- 确保 `CF-Connecting-IP` 或 `X-Forwarded-For` 头正确传递
- 在 `getTrustedClientIp()` 中优先读取 `CF-Connecting-IP`

---

### 6. CSRF 保护依赖现代浏览器
**文件**: `src/lib/request-security.ts:19-48`  
**问题**: 依赖 `Sec-Fetch-Site` 头检测跨站请求，旧浏览器（IE、旧版 Safari）不支持。

**当前缓解**: Next.js Server Actions 自带 CSRF token。

**建议**: 保持现状，但在文档中明确不支持旧浏览器。

---

### 7. 邮箱验证可能被滥用发送垃圾邮件
**文件**: `src/lib/member-service.ts:318-330`  
**问题**: 没有发现对邮箱验证邮件的速率限制，攻击者可能滥用注册功能向任意邮箱发送垃圾邮件。

**修复建议**:
- 对同一邮箱/IP 的验证邮件发送增加速率限制（1 小时 3 次）
- 记录发送历史，检测异常模式

---

## 🟢 低危问题

### 8. OAuth 错误信息过于详细
**文件**: `src/app/api/member/oauth/[provider]/callback/route.ts:29-63`  
**问题**: 返回具体错误类型（`oauth_state`/`oauth_failed`/`oauth_email`），可能帮助攻击者定位攻击点。

**建议**: 统一返回 "登录失败，请重试"，具体错误只记录日志。

---

### 9. Session 清理依赖被动触发
**文件**: `src/lib/member-store.ts:295`  
**问题**: 过期 session 只在创建新 session 时清理，如果长时间没人登录，会堆积在数据库。

**建议**: 添加定时任务（每日凌晨）清理过期 session 和 token。

---

### 10. 密码重置链接有效期较长
**文件**: `src/lib/member-account-tokens.ts:11`  
**问题**: 密码重置 token 有效期 30 分钟，如果用户邮箱被入侵，攻击窗口较大。

**建议**: 缩短到 15 分钟，或增加二次验证（发送验证码到手机）。

---

## ✅ 已有的良好实践

1. **Prisma ORM** - 防止 SQL 注入，未发现原始查询
2. **密码哈希** - 使用 bcrypt/scrypt，强度足够
3. **Token 哈希存储** - account token 用 SHA256 哈希 + 单次消费
4. **CSRF 防护** - Server Actions 自带 token + `Sec-Fetch-Site` 检查
5. **OAuth State 验证** - 随机 state + HMAC 签名
6. **开放重定向防护** - `normalizeNextPath()` 限制只允许内部路径
7. **XSS 防护** - React 自动转义，未发现 `dangerouslySetInnerHTML`
8. **敏感信息保护** - 环境变量不暴露到客户端（`NEXT_PUBLIC_` 只有 `SITE_URL`）
9. **容器安全** - 只监听 `127.0.0.1`，不暴露到公网
10. **审计日志** - 管理员操作记录 before/after 状态

---

## 修复优先级

| 优先级 | 问题 | 影响 | 修复难度 |
|-------|-----|------|---------|
| P0 | Host 头注入 + 本地 Admin 绕过 | 管理后台可被绕过 | 简单 |
| P0 | CF Access 邮箱头可伪造 | 管理后台可被绕过 | 简单 |
| P0 | IP 提取不准确 + IP 限流失效 | 批量注册攻击 | 中等 |
| P1 | Session 固定攻击 | 会话劫持 | 简单 |
| P1 | 邮箱验证滥用 | 垃圾邮件 | 简单 |
| P2 | 密码重置有效期 | 邮箱被入侵时风险 | 简单 |
| P2 | Session 清理被动触发 | 数据库堆积 | 简单 |
| P3 | OAuth 错误信息详细 | 信息泄露 | 简单 |

---

## 下一步行动

1. **立即修复 P0 问题** - Host 头验证、CF Access 强制 JWT、IP 提取修复
2. **部署后验证** - 真实环境测试 IP 提取和限流
3. **添加监控** - 注册速率、失败登录、异常 IP
4. **定期审查** - 每季度重新审查认证授权逻辑

# 安全修复记录

修复时间：2025-06-09
修复人：艾蕾

---

## ✅ 已修复的高危问题

### 1. Cloudflare Access 邮箱头伪造漏洞
**文件**: `src/lib/cloudflare-access.ts`  
**修复内容**:
- 生产环境强制验证 JWT，拒绝裸邮箱头
- 开发环境才允许 `cf-access-authenticated-user-email` 头（用于本地测试）

**修复前**:
```typescript
export async function getCloudflareAccessIdentity(headers: Headers) {
  const verifiedJwt = await verifyCloudflareAccessJwt(headers.get("cf-access-jwt-assertion"));
  if (verifiedJwt) return verifiedJwt;
  
  // ⚠️ 直接信任邮箱头
  const authenticatedEmail = headers.get("cf-access-authenticated-user-email")?.trim();
  if (!authenticatedEmail) return null;
  return { email: authenticatedEmail, claims: { email: authenticatedEmail } };
}
```

**修复后**:
```typescript
export async function getCloudflareAccessIdentity(headers: Headers) {
  const verifiedJwt = await verifyCloudflareAccessJwt(headers.get("cf-access-jwt-assertion"));
  if (verifiedJwt) return verifiedJwt;

  // ✅ 生产环境必须验证 JWT
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  // 开发环境才允许裸邮箱头
  const authenticatedEmail = headers.get("cf-access-authenticated-user-email")?.trim();
  if (!authenticatedEmail) return null;
  return { email: authenticatedEmail, claims: { email: authenticatedEmail } };
}
```

---

### 2. Host 头注入漏洞
**文件**: `src/lib/cloudflare-access.ts`  
**修复内容**:
- 移除局域网 IP (`192.168.110.48`) 白名单
- 生产环境完全禁止本地 Host 绕过
- 开发环境只允许 `localhost` 和 `127.0.0.1`

**修复前**:
```typescript
export function isLocalAdminHost(host: string) {
  return process.env.NODE_ENV !== "production" && 
         (host === "localhost" || host === "127.0.0.1" || host === "192.168.110.48");
}
```

**修复后**:
```typescript
export function isLocalAdminHost(host: string) {
  // 生产环境不允许本地访问
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  
  // 开发环境只允许本机回环地址
  return host === "localhost" || host === "127.0.0.1";
}
```

---

### 3. Session 固定攻击漏洞
**文件**: `src/lib/member-auth.ts`  
**修复内容**:
- 登录时删除旧 session，强制轮换 session ID
- 防止攻击者预设 session cookie 劫持会话

**修复前**:
```typescript
export async function createMemberSession(userId: string) {
  const session = await createStoredSession(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, session.id, { /* ... */ });
}
```

**修复后**:
```typescript
export async function createMemberSession(userId: string) {
  // ✅ 登录时删除该用户的旧 session，防止 session 固定攻击
  const cookieStore = await cookies();
  const oldSessionId = cookieStore.get(COOKIE_NAME)?.value;
  if (oldSessionId) {
    await deleteStoredSession(oldSessionId);
  }
  
  const session = await createStoredSession(userId);
  cookieStore.set(COOKIE_NAME, session.id, { /* ... */ });
}
```

---

## ⚠️ 待修复的问题

### P0 - IP 提取不准确
**状态**: 代码逻辑正确，但链路配置问题  
**现象**: 记录到 Docker 网关 IP `172.30.0.1` 而非真实访客 IP  
**原因**: EdgeOne → Caddy/frp → Docker 链路中，`CF-Connecting-IP` 头未正确传递  
**影响**: IP 限流完全失效，攻击者可绕过注册速率限制  

**排查步骤**:
1. 检查 Caddy/frp 配置，确认是否转发 `CF-Connecting-IP` 头
2. 在容器内打印请求头，验证 `CF-Connecting-IP` 是否到达
3. 如果 EdgeOne 不发送 `CF-Connecting-IP`，改用 `X-Forwarded-For` 或 `X-Real-IP`

**临时缓解**:
- Turnstile 人机验证仍生效
- 邮箱域名白名单仍生效
- 指纹限流仍生效（基于 IP + User-Agent hash）

---

### P1 - 邮箱验证邮件无速率限制
**状态**: 未修复  
**风险**: 攻击者可滥用注册功能向任意邮箱发送垃圾邮件  
**建议修复**:
- 对同一邮箱：1 小时最多 3 次验证邮件
- 对同一 IP：1 小时最多 20 次验证邮件
- 记录发送历史到 `MemberEmailLog` 表

---

### P2 - 密码重置链接有效期较长
**状态**: 未修复  
**当前值**: 30 分钟  
**建议**: 缩短到 15 分钟，或增加二次验证

---

### P2 - Session 清理依赖被动触发
**状态**: 未修复  
**建议**: 添加定时任务（每日凌晨）清理过期 session 和 token

---

### P3 - OAuth 错误信息过于详细
**状态**: 未修复  
**建议**: 统一返回 "登录失败，请重试"，具体错误只记录日志

---

## 验证清单

部署后需验证以下场景：

### 生产环境
- [ ] 不带 JWT 访问 admin，应返回 404
- [ ] 带有效 JWT 访问 admin，应返回 200
- [ ] 伪造 `cf-access-authenticated-user-email` 头，应返回 404
- [ ] 修改 Host 头为 `localhost`，应返回 404

### 开发环境
- [ ] 本机 `http://127.0.0.1:3003/admin` + 邮箱头，应返回 200
- [ ] 本机 `http://localhost:3003/admin` + 邮箱头，应返回 200
- [ ] 局域网 `http://192.168.x.x:3003/admin` + 邮箱头，应返回 404

### Session 安全
- [ ] 登录前设置预设 session cookie，登录后应被轮换
- [ ] 同一用户在多设备登录，旧设备 session 应失效

### IP 提取
- [ ] 检查审计日志，确认记录的是真实访客 IP 而非 `172.30.0.1`
- [ ] 测试注册限流，确认 IP 限流生效

---

## 部署步骤

1. 提交代码到 Git
2. 重新构建 Docker 镜像
3. 重启容器（使用保存的环境变量）
4. 验证上述清单
5. 监控审计日志，观察 1-2 天

---

## 回滚方案

如果修复导致生产问题：

1. 回滚到上一个版本的镜像：
```bash
docker stop e-life-blog
docker rm e-life-blog
docker tag ai-blog:backup ai-blog:latest
docker run -d --name e-life-blog --restart unless-stopped \
  --network ai_default -p 127.0.0.1:3003:3001 \
  -v /Users/solaris/AI/e-life-blog/member-private:/app/member-private \
  --env-file /tmp/e-life-blog-env.txt ai-blog
```

2. 临时放宽验证（仅紧急情况）：
```typescript
// cloudflare-access.ts
export async function getCloudflareAccessIdentity(headers: Headers) {
  const verifiedJwt = await verifyCloudflareAccessJwt(headers.get("cf-access-jwt-assertion"));
  if (verifiedJwt) return verifiedJwt;
  
  // ⚠️ 紧急回滚：暂时接受裸邮箱头
  const authenticatedEmail = headers.get("cf-access-authenticated-user-email")?.trim();
  if (!authenticatedEmail) return null;
  return { email: authenticatedEmail, claims: { email: authenticatedEmail } };
}
```

---

## 后续工作

1. **完善 IP 提取** - 修复代理链路配置
2. **添加邮件速率限制** - 防止垃圾邮件滥用
3. **定时任务清理** - 清理过期 session/token/log
4. **监控告警** - 异常注册/登录/IP 行为
5. **安全审计定期化** - 每季度重新审查一次

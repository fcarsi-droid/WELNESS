# 🔒 Recomendações de Segurança - WELNESS

**Data:** 02/07/2026  
**Versão:** 1.0  
**Criticalidade:** Alta

---

## 📊 Sumário Executivo

Este documento detalha os achados de segurança identificados no repositório `fcarsi-droid/WELNESS` e apresenta recomendações para mitigação dos riscos.

| Severidade | Quantidade | Status |
|-----------|-----------|--------|
| 🔴 Crítico | 3 | Requer ação imediata |
| 🟡 Alto | 2 | Requer ação em breve |
| 🟠 Médio | 3 | Requer planejamento |
| 🟢 Baixo | 2 | Recomendado |

---

## 🔴 Problemas Críticos

### 1. Parsing Inseguro de JSON com `as any`

**Arquivo:** `src/server/routers/auth.ts` (linhas 62, 68)

**Código problemático:**
```typescript
const tokens = await tokenRes.json() as any;
const googleUser = await userRes.json() as any;
```

**Risco:**
- Desabilita type safety do TypeScript
- Dados malformados podem causar comportamento indefinido
- Sem validação, injeção de dados maliciosos é possível
- Dificulta detecção de bugs em tempo de compilação

**Recomendação:** Validar com Zod
```typescript
import { z } from "zod";

const tokenSchema = z.object({
  access_token: z.string(),
  expires_in: z.number().optional(),
  refresh_token: z.string().nullable().optional(),
  token_type: z.string().optional(),
  scope: z.string().optional(),
});

const googleUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().url().optional(),
});

// No handler
const tokens = tokenSchema.parse(await tokenRes.json());
const googleUser = googleUserSchema.parse(await userRes.json());
```

**Prioridade:** 🔴 CRÍTICO  
**Esforço:** 1-2 horas

---

### 2. Cookie Parsing Manual sem Sanitização

**Arquivo:** `src/server/trpc.ts` (linhas 9-14)

**Código problemático:**
```typescript
const cookieHeader = req.headers.get("cookie") || "";
const cookies = Object.fromEntries(
  cookieHeader.split(";").map(c => {
    const [k, ...v] = c.trim().split("=");
    return [k, v.join("=")];
  })
);
const sessionId = cookies["session_id"];
```

**Risco:**
- Parser manual é propenso a erros
- Sem decodificação URL, valores especiais podem causar problemas
- Sem validação de sessionId
- Vulnerável a injeção de valores especiais

**Recomendação:** Usar biblioteca `cookie`
```typescript
import { parse } from "cookie";

export async function createContext({ req }: FetchCreateContextFnOptions) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  const sessionId = cookies.session_id;

  // Validar formato do sessionId (UUID)
  if (sessionId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
    return { db, user: null, session: null, req };
  }

  // resto do código...
}
```

**Instalação:**
```bash
npm install cookie
npm install --save-dev @types/cookie
```

**Prioridade:** 🔴 CRÍTICO  
**Esforço:** 1-2 horas

---

### 3. Falta de Validação em Dados Críticos do OAuth

**Arquivo:** `src/server/routers/auth.ts` (linhas 49-111)

**Risco:**
- Sem verificação de erro HTTP na resposta do token
- Sem validação se `access_token` foi retornado
- Sem timeout nas requisições
- Sem tratamento de redirects maliciosos

**Recomendação:** Adicionar validações robustas
```typescript
export async function handleGoogleCallback(code: string): Promise<{ sessionId: string; expiresAt: Date }> {
  // Validar código
  if (!code || typeof code !== 'string' || code.length > 500) {
    throw new Error("Invalid authorization code");
  }

  // Requisitar token com timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${APP_URL}/api/auth/callback`,
        grant_type: "authorization_code",
      }),
      signal: controller.signal,
    });

    if (!tokenRes.ok) {
      throw new Error(`Token request failed: ${tokenRes.status}`);
    }

    const tokenSchema = z.object({
      access_token: z.string(),
      expires_in: z.number().optional(),
      refresh_token: z.string().nullable().optional(),
      token_type: z.literal("Bearer"),
    });

    const tokens = tokenSchema.parse(await tokenRes.json());

    // Requisitar dados do usuário
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      signal: controller.signal,
    });

    if (!userRes.ok) {
      throw new Error(`User info request failed: ${userRes.status}`);
    }

    const googleUserSchema = z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string().min(1),
      picture: z.string().url().optional(),
    });

    const googleUser = googleUserSchema.parse(await userRes.json());

    // resto do código...
  } finally {
    clearTimeout(timeoutId);
  }
}
```

**Prioridade:** 🔴 CRÍTICO  
**Esforço:** 2-3 horas

---

## 🟡 Problemas Altos

### 4. Sem Rate Limiting na Autenticação

**Arquivo:** `api/auth/callback.ts`

**Risco:**
- Brute force na troca de código por token
- DDoS na autenticação
- Spam de tentativas OAuth

**Recomendação:** Implementar rate limiting
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 tentativas por hora por IP
});

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const APP_URL = process.env.APP_URL || "http://localhost:5173";
  
  // Extrair IP do cliente
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  
  // Aplicar rate limit
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response(null, { 
      status: 429, 
      headers: { Location: `${APP_URL}/?error=rate_limited` } 
    });
  }

  if (!code) {
    return new Response(null, { status: 302, headers: { Location: `${APP_URL}/?error=oauth_failed` } });
  }

  try {
    const { sessionId, expiresAt } = await handleGoogleCallback(code);
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${APP_URL}/`,
        "Set-Cookie": `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}; Secure;`,
      },
    });
  } catch (err) {
    console.error("OAuth error:", err);
    return new Response(null, { status: 302, headers: { Location: `${APP_URL}/?error=oauth_failed` } });
  }
}
```

**Instalação:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Configurar variáveis de ambiente:**
```env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

**Prioridade:** 🟡 ALTO  
**Esforço:** 2-3 horas

---

### 5. Primeiro Usuário Automático é Admin

**Arquivo:** `src/server/routers/auth.ts` (linhas 84-92)

**Código problemático:**
```typescript
const allUsers = await db.select().from(users);
const isFirst = allUsers.length === 0;

await db.insert(users).values({
  id: userId,
  name: googleUser.name,
  email: googleUser.email,
  image: googleUser.picture,
  role: isFirst ? "admin" : "user",      // ⚠️ Problema
  status: isFirst ? "active" : "pending", // ⚠️ Problema
});
```

**Risco:**
- Em caso de reset do banco de dados, próximo usuário vira admin
- Durante migração de dados, usuário aleatório pode ganhar privilégios
- Difícil de auditoria e validação

**Recomendação:** Usar variável de ambiente
```typescript
const isFirstUser = allUsers.length === 0;
const shouldBeAdmin = isFirstUser && process.env.FIRST_USER_EMAIL === googleUser.email;

// Ou melhor: sempre criar com status pending, exceto se explicitamente aprovado
await db.insert(users).values({
  id: userId,
  name: googleUser.name,
  email: googleUser.email,
  image: googleUser.picture,
  role: "user", // Sempre user inicialmente
  status: "pending", // Sempre pending, admin aprova
});

// Log para auditoria
console.log(`New user created: ${googleUser.email} (requires admin approval)`);
```

**Alternativa com controle:**
```env
# .env
ADMIN_EMAILS=seu-email@example.com,outro-admin@example.com
```

```typescript
const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim());
const shouldBeAdmin = adminEmails.includes(googleUser.email);

await db.insert(users).values({
  id: userId,
  name: googleUser.name,
  email: googleUser.email,
  image: googleUser.picture,
  role: shouldBeAdmin ? "admin" : "user",
  status: shouldBeAdmin ? "active" : "pending",
});
```

**Prioridade:** 🟡 ALTO  
**Esforço:** 1-2 horas

---

## 🟠 Problemas Médios

### 6. Falta de Proteção CSRF

**Arquivo:** Aplicação toda (tRPC)

**Risco:**
- Requisições cruzadas podem modificar dados
- Embora tRPC + cookie SameSite ofereça alguma proteção, não é explícita

**Recomendação:** Implementar CSRF token
```typescript
// src/server/trpc.ts
import { generateIdFromEntropySize } from "lucia";

export async function createContext({ req }: FetchCreateContextFnOptions) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  
  // Gerar CSRF token se não existir
  let csrfToken = cookies.csrf_token;
  if (!csrfToken) {
    csrfToken = generateIdFromEntropySize(16);
  }
  
  // ... resto do código
  
  return { db, user, session, req, csrfToken };
}

// Middleware para validar CSRF
export const protectedProcedure = t.procedure
  .use(({ ctx, next }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return next({ ctx });
  })
  .use(({ ctx, next }) => {
    const csrfToken = ctx.req.headers.get("x-csrf-token");
    if (!csrfToken || csrfToken !== ctx.csrfToken) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Invalid CSRF token" });
    }
    return next({ ctx });
  });
```

**Prioridade:** 🟠 MÉDIO  
**Esforço:** 2-3 horas

---

### 7. Sem Validação de URLs em Recursos

**Arquivo:** `src/server/routers/admin.ts` e outros routers

**Risco:**
- URLs maliciosas podem ser injetadas
- XSS via URL (javascript:, data:)
- Malware links

**Recomendação:** Validar URLs com Zod
```typescript
import { z } from "zod";

const urlSchema = z.string().url().refine(
  (url) => {
    try {
      const parsed = new URL(url);
      // Apenas permitir http e https
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  },
  { message: "Invalid URL protocol" }
);

// Em routers que criam recursos com URLs:
export const wellnessRouter = router({
  createResource: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      url: urlSchema,
      type: z.enum(["article", "video", "tool"]),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validação automática via Zod
      return ctx.db.insert(wellnessResources).values({
        id: generateId(),
        userId: ctx.user.id,
        title: input.title,
        url: input.url,
        type: input.type,
        createdAt: new Date(),
      });
    }),
});
```

**Prioridade:** 🟠 MÉDIO  
**Esforço:** 1-2 horas

---

### 8. Exposição de Informações em Logs de Erro

**Arquivo:** `api/auth/callback.ts` (linha 24)

**Código problemático:**
```typescript
console.error("OAuth error:", err);
```

**Risco:**
- Detalhes técnicos expostos em logs
- Possível exposição de segredos
- Informações sensíveis em registros

**Recomendação:** Sanitizar erros
```typescript
export default async function handler(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const APP_URL = process.env.APP_URL || "http://localhost:5173";

  if (!code) {
    return new Response(null, { status: 302, headers: { Location: `${APP_URL}/?error=oauth_failed` } });
  }

  try {
    const { sessionId, expiresAt } = await handleGoogleCallback(code);
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${APP_URL}/`,
        "Set-Cookie": `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}; Secure;`,
      },
    });
  } catch (err) {
    // Log apenas informação segura
    const errorId = generateIdFromEntropySize(8);
    console.error(`OAuth error [${errorId}]:`, 
      err instanceof Error ? err.message : "Unknown error"
    );
    // Não expor detalhes ao usuário
    return new Response(null, { 
      status: 302, 
      headers: { Location: `${APP_URL}/?error=oauth_failed&id=${errorId}` } 
    });
  }
}
```

**Prioridade:** 🟠 MÉDIO  
**Esforço:** 1 hora

---

## 🟢 Recomendações Adicionais (Baixa Prioridade)

### 9. Ativar GitHub Security Features

- ✅ Dependabot Alerts
- ✅ Code Scanning (GitHub Actions)
- ✅ Branch Protection Rules
- ✅ Require signed commits

**Passos:**
1. Ir em Settings → Security and analysis
2. Ativar "Dependabot alerts"
3. Ativar "Code scanning"
4. Em Branch protection, exigir assinatura de commits

**Prioridade:** 🟢 BAIXO  
**Esforço:** 15 minutos

---

### 10. Adicionar Helmet.js para Headers de Segurança

**Para ambiente Edge Runtime (Vercel):**
```typescript
// api/trpc/[trpc].ts
export async function middleware(req: Request) {
  const headers = new Headers(req.headers);
  
  // Adicionar security headers
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  return new Response(req.body, { headers });
}
```

**Prioridade:** 🟢 BAIXO  
**Esforço:** 1 hora

---

## 📅 Plano de Ação

### Sprint 1 (Imediato - próxima semana)
- [ ] Problema #1: Validar JSON com Zod
- [ ] Problema #2: Cookie parsing seguro
- [ ] Problema #3: Validação OAuth robusta

### Sprint 2 (1-2 semanas)
- [ ] Problema #4: Rate limiting
- [ ] Problema #5: Controle de admin
- [ ] Problema #6: CSRF protection

### Sprint 3 (2-4 semanas)
- [ ] Problema #7: Validação de URLs
- [ ] Problema #8: Sanitização de logs
- [ ] Problema #9: GitHub security features
- [ ] Problema #10: Security headers

---

## 🔍 Checklist de Verificação

Antes de fazer deploy:

- [ ] Todas as entradas validadas com Zod
- [ ] Sem `as any` em código crítico
- [ ] Rate limiting implementado
- [ ] CSRF protection ativada
- [ ] URLs validadas
- [ ] Logs sanitizados
- [ ] Testes de segurança executados
- [ ] Revisão de código por outro desenvolvedor
- [ ] Security headers configurados
- [ ] Dependabot ativado

---

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Zod Validation](https://zod.dev/)
- [tRPC Security](https://trpc.io/docs/server/auth)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Cookie Security](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

---

## 👥 Responsáveis

- **Arquitetura:** @fcarsi-droid
- **Implementação:** @fcarsi-droid
- **Revisão:** Revisor externo (recomendado)
- **Atualização:** Quarterly security audit

---

**Documento criado em:** 02/07/2026  
**Próxima revisão:** 02/10/2026

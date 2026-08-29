# Nuxt Admin

[中文](README.md) · [English](README.en.md)

A production-grade, extensible admin application framework on **Nuxt 4 + Vue 3.5 + TypeScript**, inspired by Laravel Filament and Strapi.
Not a template — a framework: declare resources, and full CRUD panels are generated for you.

> **Status**: framework + security mechanisms are production-ready (four quality gates green, zero scan findings in project source).
> To deploy as a live application, complete the three swap items in the [production audit](docs/工程审计报告.md) (real DB, real auth, HTTPS hardening).

## Features

- **Declarative resources** — one TS file per resource generates List / Create / View / Edit pages, REST API and permissions
- **Content Type builder** — model content visually; collections, admin pages and REST endpoints (`ct_*`) are generated at runtime, no restart
- **RBAC** — roles with a visual permission matrix, wildcard matching, enforced on both client and server
- **Media library** — multipart upload (≤10MB), fs storage, byte streaming, purge-on-delete, thumbnails
- **Content lifecycle** — draft → review → scheduled → published → archived, with a scheduler that auto-publishes and broadcasts events
- **Revisions** — automatic snapshots before update/delete, version list, one-click restore
- **Webhooks** — event subscription, HMAC-SHA256 signatures, exponential-backoff retry queue, SSRF-guarded dispatch
- **Event bus** — `content.before*/after*` lifecycle hooks for plugins
- **Taxonomy** — unlimited-depth category/tag tree with cascade-delete protection
- **Menus** — nested navigation structures editable via recursive repeater
- **Settings** — grouped visual forms, public/private isolation, `/api/public-settings`
- **SEO** — per-entry meta fields, `/sitemap.xml`, `/rss.xml`, noindex filtering
- **Draft preview** — 15-minute token URLs to standalone noindex preview pages
- **Rich text** — full Tiptap editor (tables, images, task lists, align, colors, sub/superscript) with server-side HTML sanitization
- **Autosave** — debounced per-user drafts with restore banner
- **Mail** — SMTP / Aliyun DirectMail / Resend drivers with test sending
- **i18n** — zh-CN / English, zero mixed-language UI

## Tech Stack

Nuxt 4 · Nitro · Vue 3.5 · TypeScript · Tailwind CSS v4 · shadcn-style components · Reka UI · TanStack Table Vue · VeeValidate + Zod · Pinia · Tiptap · Vitest

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000
```

Demo accounts (password: `password`):

| Account | Role | Capabilities |
|---|---|---|
| `admin@demo.dev` | Administrator | Full access |
| `editor@demo.dev` | Editor | Content/media/content-types management; read-only users & orders |
| `viewer@demo.dev` | Viewer | Read-only everywhere |

## Quality Baseline

| Gate | Result |
|---|---|
| ESLint / vue-tsc | 0 / 0 |
| Vitest | 54/54 (form validation, permissions, query engine, XSS sanitization, SSRF, HMAC, XML, compiler) |
| Production build | ✅ Nitro node-server |
| CI | Lint → Typecheck → Test → Build |
| Deep security scan | 0 findings in project source |

## Documentation

| Doc | Audience | Content |
|---|---|---|
| [介绍文档](docs/介绍文档.md) (zh) | Everyone | Positioning, features, Strapi comparison, architecture |
| [规划文档](docs/规划文档.md) (zh) | Maintainers | V0.1→V0.4 roadmap with per-batch status |
| [开发指南](docs/开发指南.md) (zh) | Developers | Concepts, auto-import inventory, component list, module walkthrough, API reference |
| [工程审计报告](docs/工程审计报告.md) (zh) | Maintainers | Audit findings, verification matrix, production-readiness verdict |

## License

Private project — all rights reserved by the owner.

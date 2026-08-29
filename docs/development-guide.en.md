# Nuxt Admin · Development Guide (EN)

> For developers and integrators of this project.
> Design background: [开发文档.md](./开发文档.md) (original blueprint, zh) · Project overview: [介绍文档.md](./介绍文档.md) (zh) · Chinese counterpart of this guide: [开发指南.md](./开发指南.md)

---

## 1. Environment

| Requirement | Version |
|---|---|
| Node.js | ≥ 20 (CI uses 24) |
| Package manager | npm (package-lock.json committed) |

```bash
npm install          # installs and runs nuxt prepare
npm run dev          # dev server
npm run lint         # ESLint
npm run typecheck    # vue-tsc
npm test             # Vitest unit tests
npm run build        # production build → .output/
```

All four quality gates (lint / typecheck / test / build) are currently at zero-errors / passing — **keep them that way**; CI enforces each one.

---

## 2. Directory Structure & Ownership Boundaries

```
app/
├── admin/                  ★ Framework layer — framework code only, never business logic
│   ├── core/               Types (types.ts) · Registry (registry.ts) · Event bus (events.ts) · defineResource
│   ├── panel/              definePanel helper
│   ├── panels/             Concrete panel configs (admin.panel.ts)
│   ├── navigation/         buildNavigation: registry + permissions → nav tree
│   ├── permissions/        can() wildcard matcher + useCan()
│   ├── schemas/builders/   DSL builders: fields (fields) · layouts (layouts) · columns (columns)
│   ├── infolists/          Detail-entry builders (builders)
│   ├── forms/              schemaToZod compiler · useFormSchema engine
│   ├── tables/             useResourceTable server-driven table state machine
│   ├── actions/            defineAction
│   ├── notifications/      notify / notifyError / useToasts
│   ├── widgets/            Dashboard widget registration
│   ├── i18n/               Lightweight i18n (zh-CN / en, cookie-persisted)
│   ├── modules/            defineModule
│   ├── framework/          ★ Shared render components (DataTable, Resource*Page, ActionHost…)
│   └── ui/                 ★ UI primitives (Ui* prefix)
├── modules/                ★ Business modules (users/posts/orders/dashboard/media/roles/content-types/taxonomy/menus/settings/revisions/webhooks)
├── pages/admin/[...path].vue  Resource route dispatcher (Filament-style)
├── plugins/admin.ts        Composition root: registers panel, static modules, runtime content types
├── layouts/default.vue     Admin shell (sidebar/header/ActionHost/ToastHost)
└── stores/                 Pinia: auth (session) · ui (theme/sidebar prefs)

server/
├── api/auth/               login / me / logout
├── api/admin/[resource]/   Generic REST: list/create/read/update/delete + bulk-delete
│   └── [id]/{upload,raw,restore,test,…}  Parametric sub-actions
├── api/admin/stats.get.ts  Dashboard aggregates
├── api/public-settings.get.ts  Public settings endpoint (public, non-secret)
├── routes/                 sitemap.xml · rss.xml · preview/:resource/:id
├── plugins/scheduler.ts    15s scheduler (auto-publish + webhook retries)
└── utils/                  db (collection store) · crud (shared pipeline) · auth (sessions)
                            · resourceConfigs (static + dynamic validation) · mail (3 drivers)
                            · webhook (SSRF guard + HMAC + retries) · events · revisions
                            · autosave · sanitize · preview · xml

shared/types/api.ts         Shared client/server contracts (Paginated/AuthUser/ListQuery…)
tests/unit/                 Vitest unit tests
```

**Iron rules**

1. Business code lives only in `app/modules/**` — never modify `app/admin/core|framework|ui` to "make a business case work".
2. Dependency direction inside the framework: `framework → core/engines`, never backwards.
3. All server data access goes through the functions exposed by `server/utils/db.ts` (swapping to a real database touches only that layer, plus `crud.ts`).

---

## 3. Auto-imports (usable without an import statement)

The framework exposes its DSL globally via `nuxt.config.ts → imports.dirs`, Filament-style:

| Category | Available names |
|---|---|
| Resource / module / panel | `defineResource` `defineModule` `definePanel` |
| Registry | `setPanel` `registerModule` `registerResource` `registerWidget` `getPanel` `getResource` `getResources` `getWidgets` `getNavGroups` |
| Field builders | `textInput` `emailInput` `passwordInput` `numberInput` `textarea` `selectInput` `switchInput` `checkboxInput` `dateInput` `relationInput` `fileInput` `repeaterInput` `permissionsInput` `richTextInput` |
| Layout builders | `section` `grid` |
| Column builders | `textColumn` `numberColumn` `moneyColumn` `dateColumn` `badgeColumn` `booleanColumn` `actionsColumn` `imageColumn` `tagsColumn` `treeColumn` |
| Detail-entry builders | `textEntry` `badgeEntry` `booleanEntry` `moneyEntry` `dateEntry` `datetimeEntry` `linkEntry` `tagsEntry` |
| Actions / notifications | `defineAction` `notify(title, desc?)` `notifyError(title, desc?)` |
| Engine composables | `useFormSchema` `useResourceTable` `useActionRunner` `useCan` `useAuthStore` `useUiStore` `useToasts` |
| i18n | `useI18n()` → `{ locale, t }` (plus the `LOCALES` constant for switchers) |
| Event bus | `onAdminEvent` `emitAdminEvent` |

Components are auto-registered the same way: `Ui*` (ui dir) and the render components in the framework dir.

> Types do NOT auto-import — import them explicitly: `import type { ActionDef } from '~/admin/core/types'`.

### UI Component Inventory (`app/admin/ui`, shadcn-style · Reka UI powered)

| Group | Components |
|---|---|
| Base | UiButton · UiInput · UiTextarea · UiSelect · UiCheckbox · UiSwitch · UiLabel |
| Display | UiBadge · UiCard · UiAvatar/UiAvatarFallback · UiSkeleton · UiSeparator · UiSpinner · UiEmpty · UiAlert |
| Overlay | UiTabs · UiSheet (side panel); Dialog/DropdownMenu are composed directly via reka-ui inside the framework (ActionHost, DataTable) |

`components.json` follows the shadcn-vue schema (aliases point at `~/admin/ui` and `~/admin/utils/cn`), so downstream projects can add official components with `npx shadcn-vue@latest add <component>`; framework-owned `Ui*` components upgrade with the framework and never conflict.

---

## 4. Core Concepts

### 4.1 Registry

`app/admin/core/registry.ts` is the framework's service container. Flow:

```
plugins/admin.ts (composition root)
  └─ registerModule(module)        // once per module; accepts a plain ModuleDef
       ├─ registerResource(r)      //   OR a factory (t) => ModuleDef for locale-aware labels
       └─ registerWidget(w)
Read side:
  getResource(slug) / getNavGroups() / getWidgets() / getPanel()
```

Duplicate resource names are ignored with a warning; group ordering comes from the `sort` declared in `navGroups` (default 100).

### 4.2 Resource

`ResolvedResource` guarantees `labelPlural` and `permissionPrefix` at runtime (the latter defaults to `name`). Fields:

| Field | Purpose |
|---|---|
| `name` | URL slug + API segment, e.g. `users` |
| `label` / `labelPlural` | Singular/plural display names |
| `icon` | Icon key, see `app/admin/utils/iconMap.ts` (falls back to a circle) |
| `group` / `sort` | Navigation grouping and ordering |
| `permissionPrefix` | Permission prefix (defaults to `name`) |
| `searchable` | Server-side search fields (keep in sync with resourceConfigs) |
| `endpoints` | Endpoint overrides, e.g. multipart upload for media |
| `pages` | Page overrides, e.g. `pages.list` (admin extension point) |
| `table()` / `form()` / `infolist()` | The three schemas, lazily evaluated |
| `rowActions` / `bulkActions` | Custom actions, merged with framework defaults |

### 4.3 Schema System

Schemas are **pure data nodes**; rendering belongs to the engines:

- `FieldNode`: `{ type:'field', kind, name, label, ...options }`
- Layouts: `section(titleOrOptions, children)` / `grid(columns, children)`, arbitrarily nestable; `colSpan` controls width inside a grid
- Columns: `ColumnMeta.kind ∈ text|number|money|date|badge|boolean|actions|image|tags|tree`
- Detail entries: `EntryNode.kind ∈ text|badge|boolean|money|date|datetime|link|tags`

**Adding a new field kind — fixed steps:**

1. `core/types.ts` → extend the `FieldType` union;
2. `forms/schemaToZod.ts` → base rule in `baseRuleFor()`; if the kind supports `required`, add a branch in `compileField()` (never mix non-string bases into `STRING_BASE_KINDS`);
3. `framework/FormField.vue` → render branch;
4. `schemas/builders/fields.ts` → provide the `xxxInput()` builder;
5. `tests/unit/schema-to-zod.test.ts` → add cases.

### 4.4 Form Engine

```
schema() ──schemaToZod──▶ ZodObject ──toTypedSchema──▶ vee-validate useForm
FormField binds via useField(name); errors render inline
```

- Edit pages hydrate via `form.setValues(record)` once the record arrives;
- Submission goes through `submit = handleSubmit(onSubmit)`; `submitting` drives button state;
- `useFormSchema` also returns `setValues` for external hydration.

### 4.5 Table Engine

`useResourceTable(resource)` is the single state source for list pages: `q/page/perPage/sortBy/sortDir/items/loading/selection…`. Search is debounced (300ms); paging/sorting/page-size changes refetch automatically.

**Convention**: components must not write prop refs directly (vue/no-mutating-props) — call the mutation API instead: `setQuery / setPage / nextPage / prevPage / setPerPage / refresh / toggleSort …`

### 4.6 Action Pipeline

`useActionRunner.run(action, ctx)` runs in a fixed order:

```
permission check (can) → form? open form modal → confirm? open confirm dialog → execute(handler)
handler throwing → notifyError; success → close dialogs (success toasts are the handler's job)
ctx: { resource (always), record? (row), ids? (bulk), values? (modal form values) }
```

Action forms receive the context: `form: (ctx) => SchemaNode[]` — used by settings for type-aware edit forms.

**Refresh convention**: after mutating data, custom actions emit `emitAdminEvent('{resource}:refresh')`; list pages listen and refetch. See posts `publish` and orders `mark-shipped`.

### 4.7 Permissions

- Naming: `{permissionPrefix}.{view|create|edit|delete}`; modules may add extras (e.g. `content.publish` reuses edit on the server side).
- Wildcards: `*` grants everything; `posts.*` grants all post actions.
- **Dual enforcement**: the frontend `useCan()` filters nav/buttons/routes (403 page on direct access); every server handler calls `requirePermission(event, 'xxx.yyy')`. Write both — the first is UX, the second is security.

### 4.8 Modules & Panels

```ts
// app/modules/orders/module.ts — plain form
export default defineModule({
  name: 'orders',
  resources: [OrderResource],
  navGroups: [{ label: 'Sales', sort: 30 }],
})

// locale-aware factory form (demo modules use this)
export default defineModule(t => ({
  name: 'users',
  resources: [UserResource(t)],
  navGroups: [{ label: t('res.users.group'), sort: 10 }],
}))
```

Register new modules once in `app/plugins/admin.ts`. `definePanel({ id, path, branding, perPage })` currently registers `/admin`; multiple panels get one config plus route-level selection each.

### 4.9 Dynamic Content Types (Content Type Builder)

Model content visually under `System → Content Types` (name + field repeater). On save:

- `resourceConfigs.dynamicConfig()` compiles the stored definition into validation config; the generic REST layer serves `ct_{slug}` collections automatically (type coercion, enum checks, permission prefix `content`);
- the async composition-root plugin pulls all definitions at boot and registers full resources via `app/modules/content-types/dynamic.ts → buildContentModule()` (columns/forms/entries mapped from field types), including lifecycle columns, publish/unpublish/schedule actions and an SEO section.

Conventions: dynamic resource names always start with `ct_`; slugs are server-generated and immutable; after modeling changes use the inline "Reload Registry" action (`reloadNuxtApp()`).

### 4.10 Media Library & Uploads

- Storage: Nitro `useStorage('media')`, fs driver mounted at `./.data/media` (nuxt.config → nitro.storage);
- Upload: `POST /api/admin/media/upload` (multipart, field `file`, ≤10MB) → bytes on disk + `media` record;
- Read: `GET /api/admin/media/:id/raw` (streams with the stored mime);
- Delete: `DELETE /api/admin/media/:id` also purges the stored file.

Client-side, `MediaResource` points its create form at the upload endpoint via `endpoints.create`; a `fileInput` field makes `ResourceFormPage` submit multipart automatically (when any value is a File).

### 4.11 Roles & Permission Matrix

- A role is a `roles` record (name/key/permissions[]); `key` is immutable after create (`immutableFields`);
- Session permissions resolve live via `findRoleByKey` — after editing roles, reload the session (inline action provided);
- `permissionsInput` renders the permission matrix: every registered resource × `view|create|edit|delete`, plus a global `*` toggle.

### 4.12 Event Bus / Webhooks / Revisions / Scheduled Publishing

**Events** (`server/utils/events.ts`), emitted by the shared pipeline in `server/utils/crud.ts`:
`content.beforeCreate/afterCreate/beforeUpdate/afterUpdate/beforeDelete/afterDelete/published/unpublished/restored`.
Payload: `{ resource, record?, id?, patch? }`. A `before*` handler that throws vetoes the operation.
Local subscription: `onCmsEvent(name, fn)` (returns an unsubscribe fn); the same events fan out to webhooks.

**Webhooks** (`server/utils/webhook.ts`): a `webhooks` record is `{url, events (csv or *), enabled, secret}`.
Dispatch sends `x-webhook-event`, `x-webhook-secret` and `x-webhook-signature: sha256=HMAC(secret, exact body)`, 5s timeout; failures (network/timeout/HTTP≥400) enter the retry queue with backoff 1m/5m/15m/60m (4 attempts, then dropped with a log line).
**SSRF guard**: `parseWebhookTarget` (sync policy: scheme/localhost/private literals) + `resolveSafeWebhookUrl` (DNS resolve, every IP re-checked).
Test: `POST /api/admin/webhooks/:id/test` fires a ping directly; failures return 502 with the reason.

**Revisions** (`server/utils/revisions.ts`): `snapshotRevision` runs before every update/delete (versions increment per `resource:id`); `POST /api/admin/revisions/:id/restore` re-applies a snapshot (current state snapshotted first; requires `.edit` on the target resource).

**Scheduled publishing** (`server/plugins/scheduler.ts`): a Nitro plugin polls `ct_*` collections every 15s; `scheduled && scheduledAt<=now` → published + `content.published` event. Swap for a queue/cron in production.

### 4.13 Routing Pattern: Parametric Sub-actions

Special operations live at `[resource]/[id]/{action}.post.ts` (upload/raw/restore/test) and validate the `resource` name inside. **Never** create a static directory named like a resource (e.g. `media/index.get.ts`) — Nitro static segments shadow the `[resource]` parametric routes causing 404s; shared logic lives in `server/utils/crud.ts`.

⚠️ **Server pitfall**: always **explicitly import** exports from `server/utils/*` across files (e.g. db's `getCollection/listCollectionNames`). Relying on Nitro auto-imports can create a second module instance — symptoms: data written by one handler is invisible to another.

### 4.14 Resource Config Hooks & Page Overrides

Optional hooks on `ServerResourceConfig` (`server/utils/resourceConfigs.ts`):

- `enrichList(items)`: decorate list rows — tree depth/path/childCount (taxonomy), recursive counts (menus), secret masking (settings)
- `beforeDelete(record)`: return an error message to veto deletion (409), e.g. taxonomy cascade protection
- `validateRecord(data)`: record-level policy checks (webhook SSRF rules)

**Page overrides**: `AdminResource.pages.list` replaces the default list page with a custom component (the admin extension point) — the settings grouped editor is implemented this way.

### 4.15 Settings: Public/Private Isolation

- A `settings` record is `{key, value, type(string|text|number|boolean|secret), group, public}`;
- admin lists mask `secret` values (enrichList); the grouped editor renders per-type controls; empty secret input = keep current;
- "New setting" is a smart form: human name → auto UPPER_SNAKE key (uniqueness-checked), live value-type detection, public/private choice cards;
- `GET /api/public-settings` (no auth) returns only `public===true && type!=='secret'` pairs — the frontend/theme reads site config from here.

### 4.16 SEO / Sitemap / RSS / Draft Preview

- **SEO meta**: `ct_*` types auto-inject `seoTitle / seoDescription / canonical / robots(index|noindex)` plus a form section; `robots=noindex` entries are excluded from the sitemap;
- **`GET /sitemap.xml`**: home + published posts (`/blog/{slug}`) + published dynamic entries (`/{type-slug}/{id}` — placeholder until the theme defines real routes); origin from the `SITE_URL` setting;
- **`GET /rss.xml`**: latest 50 published posts; channel metadata from public settings;
- **Draft Preview**: inline Preview action (posts/dynamic types, unpublished only) → `POST /api/admin/preview` mints a 15-minute token URL → `/preview/{resource}/{id}?t=…` renders a standalone noindex HTML page. Tokens are in-memory; use signed JWTs in production.

### 4.17 Rich Text / Autosave / Webhook Signing & Retries

- **`richtext` field**: `richTextInput(name, label)` → Tiptap v3 (StarterKit + Image/TaskList/TextAlign/Highlight/TextStyle+Color/Sub/Superscript/CharacterCount/Placeholder/Table family); stores standard HTML; empty content normalizes to `''` (so `<p></p>` cannot bypass required checks); SSR-safe; toolbar buttons use `@mousedown.prevent` to preserve selection; insert dialogs are controlled components (never `window.prompt`). See 4.20 for extending.
- **Autosave**: edit forms debounce 1.5s → `POST /api/admin/autosave` `{resource,id,values}` (isolated per user × resource × record, `.edit` permission); `GET ?resource=&id=[&discard=1]`; edit pages show an unsaved-draft banner with restore/discard; drafts clear on successful submit. In-memory.
- **Webhook signing**: hooks with a `secret` send `x-webhook-signature: sha256=HMAC_SHA256(secret, exact body)`; receivers recompute over the raw body (prefer constant-time compare).
- **Retry queue**: failed deliveries enter a backoff queue 1m/5m/15m/60m, dropped after 4 attempts; the scheduler drains it every 15s. In-memory.

### 4.18 Mail Service (SMTP / Aliyun / Resend)

- **Driver contract**: `server/utils/mail.ts → sendMail(to, subject, html)` dispatches on the `EMAIL_PROVIDER` setting (smtp|aliyun|resend); credentials live in settings (secret type) with `MAIL_*` environment overrides taking precedence — zero credential literals in source/tests.
- **Aliyun DirectMail**: region-preset SMTP endpoints (cn-hangzhou/ap-southeast-1/us-east-1/eu-central-1, port 465 SSL); credentials are the console sender address + SMTP password; region whitelist validated before any write.
- **Resend**: HTTP API `POST https://api.resend.com/emails`, Bearer key server-side only.
- **Config panel**: Settings → Email renders a dedicated panel (provider cards / region select / test send); endpoints `GET|POST /api/admin/mail/config` (secrets echoed only as hasPass/hasKey) and `POST /api/admin/mail/test` (missing config → 502 with reason, invalid recipient → 422).
- **Adding a driver**: add a branch in `mail.ts` returning `MailResult` → extend `getMailConfig` (read credentials via `secret()`, env first) → add a provider card + fields in `EmailSettingsPanel.vue` → sync endpoint validation.

### 4.19 Bilingual Consistency (i18n Architecture)

- `defineModule` accepts a factory `(t) => ModuleDef`: demo modules resolve labels/groups/columns/form texts at registration in the active locale; business modules should follow suit;
- the locale switcher (Globe in the header) writes the cookie then calls `reloadNuxtApp()` — registration-time labels re-resolve;
- engine-injected texts (lifecycle actions/badges/validation errors) use render-time `t()` and follow the locale without a reload;
- every new string goes into the `app/admin/i18n/index.ts` dictionary in both languages (key prefixes: common/table/auth/editor/draft/widget/settings/mail/dialog/status/res.*).

### 4.20 Rich Text Editor (Tiptap) Extension Guide

`richtext` is rendered by `admin/framework/RichTextEditor.vue` (Tiptap v3 + StarterKit + Image/TaskList/TextAlign/Highlight/TextStyle+Color/Sub/Superscript/CharacterCount/Placeholder/Table family) and stores standard HTML.

**Security pipeline (do not bypass)**: editor HTML passes through `server/utils/sanitize.ts` (`sanitizeRichText`, sanitize-html whitelist) inside the CRUD pipeline before storage; preview pages sanitize again before rendering. Tune only `OPTIONS` (allowedTags/allowedAttributes/allowedStyles/allowedSchemes) — 5 unit tests lock the behavior.

**Adding toolbar capabilities**: add the extension to `useEditor`'s `extensions` → add `{ label: t('editor.xxx'), icon, active, run }` to the matching group in the `groups` computed → add the `editor.xxx` dictionary pair (both locales). Toolbar buttons already carry `@mousedown.prevent` (keeps selection); prompts that need input use the in-component controlled dialog (never `window.prompt`).

**Link semantics**: a collapsed caret without a link inserts the URL as linked text; a selection (or active link) extends the mark range.

---

## 5. Walkthrough: a New `products` Module From Scratch

1. **Client resource**: `app/modules/products/admin/ProductResource.ts` (see the example in the intro doc).
2. **Module entry**: `app/modules/products/module.ts`:

```ts
import ProductResource from './admin/ProductResource'
export default defineModule({
  name: 'products',
  resources: [ProductResource],
  navGroups: [{ label: 'Catalog', sort: 40 }],
})
```

3. **Server validation config** (critical — writes are rejected without it): `server/utils/resourceConfigs.ts`:

```ts
products: {
  label: 'Product',
  searchable: ['name'],
  permissionPrefix: 'products',
  fields: {
    name: { type: 'string', required: true },
    price: { type: 'number', required: true },
    status: { type: 'string', enum: ['active', 'archived'] },
  },
},
```

4. **Register the module** in `plugins/admin.ts`.
5. **Verify**: sign in and visit the four pages; confirm a viewer is blocked; run `npm test && npm run lint && npm run typecheck && npm run build`.

---

## 6. Server API Reference

Auth: httpOnly cookie `admin_session` (sent automatically after login). 401 unauthenticated · 403 forbidden · 422 validation.

| Method & path | Purpose | Permission |
|---|---|---|
| `POST /api/auth/login` | `{email,password}` → sets session cookie | public |
| `GET /api/auth/me` | current user `{id,name,email,role,permissions[]}` | signed in |
| `POST /api/auth/logout` | sign out | signed in |
| `GET /api/admin/:resource` | list. Query `q,page,perPage(≤200),sortBy,sortDir` → `Paginated<T>` | `{prefix}.view` |
| `POST /api/admin/:resource` | create, validated against fields (required enforced) | `{prefix}.create` |
| `GET /api/admin/:resource/:id` | detail | `{prefix}.view` |
| `PUT /api/admin/:resource/:id` | partial update (known fields only) | `{prefix}.edit` |
| `DELETE /api/admin/:resource/:id` | single delete (snapshots a revision) | `{prefix}.delete` |
| `POST /api/admin/:resource/bulk-delete` | `{ids:number[]}` → `{removed}` | `{prefix}.delete` |
| `GET /api/admin/stats` | dashboard aggregates | signed in |
| `POST /api/admin/media/upload` | multipart upload (field `file`, ≤10MB) → media record | `media.create` |
| `GET /api/admin/media/:id/raw` | stream stored bytes | `media.view` |
| `POST /api/admin/webhooks/:id/test` | fire a test ping (failures → 502 with reason) | `webhooks.edit` |
| `POST /api/admin/revisions/:id/restore` | restore a snapshot (current state snapshotted first) | target `.edit` |
| `POST /api/admin/preview` | `{resource,id}` → 15-min token URL | target `.edit` |
| `GET /preview/:resource/:id?t=` | standalone noindex preview page | token |
| `POST` `GET /api/admin/autosave` | form draft snapshots (per user×resource×record; GET `discard=1` reads-and-deletes) | `.edit` |
| `GET` `POST /api/admin/mail/config` | mail driver config (secrets echoed as hasPass/hasKey) | `settings.edit` |
| `POST /api/admin/mail/test` | send a test email via the active driver | `settings.edit` |
| `GET /api/public-settings` | public settings key/values (public, non-secret) | public |
| `GET /sitemap.xml` `GET /rss.xml` | SEO sitemap / RSS feed (noindex filtered) | public |
| `POST /api/admin/ct_{slug}` etc. | dynamic content-type REST (same generic endpoints, prefix `content`) | `content.*` |

Success responses return data directly; failures return the Nitro error object `{error,url,statusCode,statusMessage}`.

Webhook `events` values (csv, subscribable): `content.afterCreate` `content.afterUpdate` `content.beforeDelete` `content.afterDelete` `content.published` `content.restored` `webhook.test` (`beforeCreate/beforeUpdate/beforeDelete` are local veto hooks only and are not dispatched).

---

## 7. Testing Strategy

```bash
npx vitest run              # or npm test
```

- Location: `tests/unit/*.test.ts` (vitest.config.ts maps the `~` and `#shared` aliases).
- **Pure functions first**: the compiler (schemaToZod), the matcher (can), the query engine (applyQuery), sanitization, webhook policy and XML builders are the highest-regression-value spots — 54 cases lock them, including one real compiler defect and one sanitizer gap caught by tests.
- Add cases whenever engine capabilities change; UI component tests and E2E are on the roadmap.
- Note: db seeds use relative timestamps — assert relative ordering/counts, never absolute dates.

---

## 8. Coding Conventions

- Style is enforced by ESLint (@stylistic): 1tbs braces, no trailing commas, no parens on single arrow params — `npx eslint . --fix` resolves most of it.
- Component naming: UI primitives `Ui*.vue` (admin/ui); framework composites get semantic names (admin/framework).
- Server util functions type their event as `type H3Evt = Parameters<typeof getCookie>[0]` — do **not** `import { H3Event } from 'h3'` (dual h3 copies cause type conflicts, see the audit report).
- Never put casts inside `v-model` in Vue templates (`v-model="expr as T"` breaks production builds) — wrap in a computed.
- Always explicitly import `server/utils/*` exports across files (auto-imports can create duplicate module instances).
- Commit messages follow `feat|fix|refactor|docs|test|chore(scope): summary`.

## 9. Build & Deploy

```bash
npm run build                       # output .output/ (Nitro node-server preset)
node .output/server/index.mjs       # verify the artifact locally
```

- No environment variables required (demo data is built in); mail credentials optionally come from `MAIL_*` env vars.
- The production pre-flight list (real database / real auth / HTTPS + secure cookies / rate limiting) is in the [audit report](./工程审计报告.md), section 5 and 11.

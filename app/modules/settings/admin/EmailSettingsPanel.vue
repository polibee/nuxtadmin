<script setup lang="ts">
import {
  AtSignIcon,
  CheckCircle2Icon,
  MailIcon,
  SendIcon,
  ServerIcon
} from 'lucide-vue-next'
import { cn } from '~/admin/utils/cn'

interface MailConfig {
  provider: 'smtp' | 'aliyun' | 'resend'
  fromName: string
  fromAddress: string
  smtp: { host: string, port: number, secure: boolean, user: string, hasPass: boolean }
  aliyun: { region: string, user: string, hasPass: boolean }
  resend: { hasKey: boolean }
}

const emit = defineEmits<{ change: [] }>()

const { t } = useI18n()

const providers = [
  { value: 'smtp', label: t('mail.provider.smtp'), icon: ServerIcon, hint: t('mail.provider.smtpHint') },
  { value: 'aliyun', label: t('mail.provider.aliyun'), icon: MailIcon, hint: t('mail.provider.aliyunHint') },
  { value: 'resend', label: t('mail.provider.resend'), icon: AtSignIcon, hint: t('mail.provider.resendHint') }
] as const

const regions = [
  { value: 'cn-hangzhou', label: '华东 1（杭州）· smtpdm.aliyun.com' },
  { value: 'ap-southeast-1', label: '新加坡 · smtpdm-ap-southeast-1.aliyuncs.com' },
  { value: 'us-east-1', label: '美国（弗吉尼亚）· smtpdm-us-east-1.aliyuncs.com' },
  { value: 'eu-central-1', label: '德国（法兰克福）· smtpdm-eu-central-1.aliyuncs.com' }
]

const config = ref<MailConfig | null>(null)
const pass = ref({ smtp: '', aliyun: '', resend: '' })
const testTo = ref('')
const testResult = ref<{ ok: boolean, message: string } | null>(null)
const saving = ref(false)
const testing = ref(false)
const loading = ref(true)

onMounted(async () => {
  try {
    config.value = await $fetch<MailConfig>('/api/admin/mail/config')
  } catch (e: unknown) {
    notifyError(t('mail.loadFailed'), (e as Error).message)
  } finally {
    loading.value = false
  }
})

async function save(): Promise<void> {
  if (!config.value) return
  saving.value = true
  try {
    await $fetch('/api/admin/mail/config', {
      method: 'POST',
      body: {
        provider: config.value.provider,
        fromName: config.value.fromName,
        fromAddress: config.value.fromAddress,
        smtp: {
          host: config.value.smtp.host,
          port: config.value.smtp.port,
          secure: config.value.smtp.secure,
          user: config.value.smtp.user,
          pass: pass.value.smtp
        },
        aliyun: {
          region: config.value.aliyun.region,
          user: config.value.aliyun.user,
          pass: pass.value.aliyun
        },
        resend: { apiKey: pass.value.resend }
      }
    })
    notify(t('common.saveChanges'))
    emit('change')
  } catch (e: unknown) {
    notifyError(t('mail.saveFailed'), (e as Error).message)
  } finally {
    saving.value = false
  }
}

async function sendTest(): Promise<void> {
  if (!testTo.value.trim()) return
  testing.value = true
  testResult.value = null
  try {
    const res = await $fetch<{ provider: string }>('/api/admin/mail/test', {
      method: 'POST',
      body: { to: testTo.value.trim() }
    })
    testResult.value = { ok: true, message: t('mail.sentVia', { provider: res.provider }) }
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    testResult.value = { ok: false, message: err?.data?.statusMessage ?? (e as Error).message }
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <div
    v-if="loading"
    class="space-y-3 py-2"
  >
    <UiSkeleton class="h-20 w-full" />
    <UiSkeleton class="h-32 w-full" />
  </div>

  <form
    v-else-if="config"
    class="space-y-5"
    @submit.prevent="save"
  >
    <!-- provider selection cards -->
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <button
        v-for="p in providers"
        :key="p.value"
        type="button"
        :class="cn(
          'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
          config.provider === p.value ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'hover:bg-accent/40'
        )"
        @click="config!.provider = p.value"
      >
        <component
          :is="p.icon"
          class="mt-0.5 h-5 w-5 shrink-0"
          :class="config.provider === p.value ? 'text-primary' : 'text-muted-foreground'"
        />
        <span class="min-w-0">
          <span class="block text-sm font-semibold">{{ p.label }}</span>
          <span class="mt-0.5 block text-xs text-muted-foreground">{{ p.hint }}</span>
        </span>
        <CheckCircle2Icon
          v-if="config.provider === p.value"
          class="ml-auto h-4 w-4 shrink-0 text-primary"
        />
      </button>
    </div>

    <!-- common sender identity -->
    <div class="rounded-xl border p-4">
      <h3 class="mb-3 text-sm font-semibold">
        {{ t('mail.senderIdentity') }}
      </h3>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div class="space-y-1.5">
          <UiLabel>{{ t('mail.fromName') }}</UiLabel>
          <UiInput
            v-model="config.fromName"
            :placeholder="t('settings.namePlaceholder')"
          />
        </div>
        <div class="space-y-1.5">
          <UiLabel>{{ t('mail.fromAddress') }}</UiLabel>
          <UiInput
            v-model="config.fromAddress"
            placeholder="noreply@example.com"
          />
        </div>
      </div>
    </div>

    <!-- SMTP fields -->
    <div
      v-if="config.provider === 'smtp'"
      class="rounded-xl border p-4"
    >
      <h3 class="mb-3 text-sm font-semibold">
        {{ t('mail.smtpServer') }}
      </h3>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div class="space-y-1.5">
          <UiLabel>{{ t('mail.host') }}</UiLabel>
          <UiInput
            v-model="config.smtp.host"
            placeholder="smtp.example.com"
          />
        </div>
        <div class="space-y-1.5">
          <UiLabel>{{ t('mail.port') }}</UiLabel>
          <UiInput
            v-model="config.smtp.port as unknown as string"
            type="number"
            placeholder="465"
          />
        </div>
        <div class="space-y-1.5">
          <UiLabel>{{ t('mail.username') }}</UiLabel>
          <UiInput
            v-model="config.smtp.user"
            placeholder="user@example.com"
          />
        </div>
        <div class="space-y-1.5">
          <UiLabel>{{ t('mail.password') }}</UiLabel>
          <UiInput
            v-model="pass.smtp"
            type="password"
            :placeholder="config.smtp.hasPass ? '•••••••• (leave empty to keep)' : 'Password'"
          />
        </div>
        <div class="flex items-center md:col-span-2">
          <UiSwitch v-model="config.smtp.secure">
            <span class="text-sm">{{ t('mail.useTls') }}</span>
          </UiSwitch>
        </div>
      </div>
    </div>

    <!-- Aliyun DirectMail fields -->
    <div
      v-if="config.provider === 'aliyun'"
      class="rounded-xl border p-4"
    >
      <h3 class="mb-1 text-sm font-semibold">
        {{ t('mail.aliyunTitle') }}
      </h3>
      <p class="mb-3 text-xs text-muted-foreground">
        {{ t('mail.aliyunHint') }}
      </p>
      <div class="grid grid-cols-1 gap-3">
        <div class="space-y-1.5">
          <UiLabel>{{ t('mail.region') }}</UiLabel>
          <UiSelect
            v-model="config.aliyun.region as unknown as string"
            :options="regions"
          />
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="space-y-1.5">
            <UiLabel>{{ t('mail.aliyunUser') }}</UiLabel>
            <UiInput
              v-model="config.aliyun.user"
              placeholder="sender@mail.example.com"
            />
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('mail.aliyunPass') }}</UiLabel>
            <UiInput
              v-model="pass.aliyun"
              type="password"
              :placeholder="config.aliyun.hasPass ? '•••••••• (leave empty to keep)' : '在控制台设置的 SMTP 密码'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Resend fields -->
    <div
      v-if="config.provider === 'resend'"
      class="rounded-xl border p-4"
    >
      <h3 class="mb-1 text-sm font-semibold">
        {{ t('mail.provider.resend') }}
      </h3>
      <p class="mb-3 text-xs text-muted-foreground">
        {{ t('mail.resendHint') }}
      </p>
      <div class="space-y-1.5">
        <UiLabel>{{ t('mail.resendKey') }}</UiLabel>
        <UiInput
          v-model="pass.resend"
          type="password"
          :placeholder="config.resend.hasKey ? '•••••••• (leave empty to keep)' : 're_…'"
        />
      </div>
    </div>

    <!-- test + save -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <div class="flex items-center gap-2">
        <UiInput
          v-model="testTo"
          :placeholder="t('mail.testTo')"
          class="w-64"
        />
        <UiButton
          type="button"
          variant="outline"
          size="sm"
          :disabled="testing"
          @click="sendTest"
        >
          <SendIcon /> {{ testing ? t('mail.sending') : t('mail.sendTest') }}
        </UiButton>
        <span
          v-if="testResult"
          class="text-xs"
          :class="testResult.ok ? 'text-[var(--success)]' : 'text-destructive'"
        >
          {{ testResult.message }}
        </span>
      </div>
      <UiButton
        type="submit"
        :disabled="saving"
      >
        {{ saving ? t('common.saving') : t('common.saveChanges') }}
      </UiButton>
    </div>
  </form>
</template>

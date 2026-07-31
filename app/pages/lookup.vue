<script setup lang="ts">
import type { PlayerProfile } from '#shared/types/player'

definePageMeta({ middleware: 'guest' })

const route = useRoute()
const { fetch: refreshSession } = useUserSession()

const fargorateId = ref('')
// 'input' はID入力、'confirm' は本人確認のステップ。
const step = ref<'input' | 'confirm'>('input')
const candidate = ref<PlayerProfile | null>(null)
const pending = ref(false)
const errorMessage = ref('')

function toErrorMessage(error: unknown, notFoundMessage: string) {
  const statusCode = (error as { statusCode?: number }).statusCode

  if (statusCode === 404) {
    return notFoundMessage
  }
  if (statusCode === 400) {
    return 'FargoRate IDは13桁の数字で入力してください。'
  }
  return '通信に失敗しました。しばらくしてからもう一度お試しください。'
}

async function lookup() {
  if (!isValidFargorateId(fargorateId.value)) {
    errorMessage.value = 'FargoRate IDは13桁の数字で入力してください。'
    return
  }

  pending.value = true
  errorMessage.value = ''

  try {
    candidate.value = await $fetch<PlayerProfile>('/api/lookup', {
      method: 'POST',
      body: { fargorateId: fargorateId.value },
    })
    step.value = 'confirm'
  } catch (error) {
    errorMessage.value = toErrorMessage(
      error,
      'そのFargoRate IDのプレイヤーは見つかりませんでした。',
    )
  } finally {
    pending.value = false
  }
}

// 本人だと確認できたので認証を確定し、元々開こうとしていたページへ移動する。
async function confirm() {
  pending.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/session', {
      method: 'POST',
      body: { fargorateId: fargorateId.value },
    })
    await refreshSession()
    await navigateTo(resolveRedirectPath(route.query.redirect))
  } catch (error) {
    errorMessage.value = toErrorMessage(
      error,
      'そのFargoRate IDのプレイヤーは見つかりませんでした。',
    )
  } finally {
    pending.value = false
  }
}

// 本人ではなかったので、ID入力からやり直す。
function reject() {
  candidate.value = null
  step.value = 'input'
  errorMessage.value = ''
}
</script>

<template>
  <div class="mx-auto max-w-md">
    <h1 class="mb-4 text-xl font-bold">ルックアップ</h1>

    <div v-if="errorMessage" role="alert" class="alert alert-error mb-4">
      {{ errorMessage }}
    </div>

    <form
      v-if="step === 'input'"
      class="flex flex-col gap-4"
      @submit.prevent="lookup"
    >
      <p class="text-sm">FargoRate ID（13桁の数字）を入力してください。</p>

      <input
        v-model.trim="fargorateId"
        class="input input-bordered w-full"
        type="text"
        inputmode="numeric"
        maxlength="13"
        placeholder="9900006315553"
        required
      />

      <button class="btn btn-primary" type="submit" :disabled="pending">
        <span v-if="pending" class="loading loading-spinner" />
        検索する
      </button>
    </form>

    <div v-else-if="candidate" class="flex flex-col gap-4">
      <p class="text-sm">このプレイヤーはあなたですか？</p>

      <PlayerProfileTable :player="candidate" />

      <div class="flex gap-2">
        <button
          class="btn btn-primary flex-1"
          type="button"
          :disabled="pending"
          @click="confirm"
        >
          <span v-if="pending" class="loading loading-spinner" />
          はい、これは私です
        </button>
        <button
          class="btn flex-1"
          type="button"
          :disabled="pending"
          @click="reject"
        >
          いいえ
        </button>
      </div>
    </div>
  </div>
</template>

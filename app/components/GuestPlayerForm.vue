<script setup lang="ts">
import type { GuestPlayer } from '#shared/types/player'

const { submitLabel, pending = false } = defineProps<{
  /** 送信ボタンの文言。ゲスト認証と対戦相手の登録で呼び出し元が変わる。 */
  submitLabel: string
  pending?: boolean
}>()

// 入力の検証までがこのフォームの責務。組み立てたゲストをセッションに入れる
// のか対戦相手にするのかは、呼び出し側が決める。
const emit = defineEmits<{
  submit: [player: GuestPlayer]
  invalid: [message: string]
}>()

const { t } = useI18n()

const name = ref('')
// 空欄と 0 を区別する必要があるため、数値ではなく入力された文字列のまま持つ。
const rating = ref('')

function submit() {
  const parsedRating = Number(rating.value)

  // `Number('')` は 0 になるため、空欄は別に見る。
  if (rating.value === '' || !isValidGuestRating(parsedRating)) {
    emit(
      'invalid',
      t('guest.errors.invalidRating', {
        min: GUEST_RATING_MIN,
        max: GUEST_RATING_MAX,
      }),
    )
    return
  }

  const trimmedName = name.value.trim()

  if (!isValidGuestName(trimmedName)) {
    emit(
      'invalid',
      t('guest.errors.invalidName', { max: GUEST_NAME_MAX_LENGTH }),
    )
    return
  }

  // 未入力は null にし、既定名は表示側の言語で補わせる。
  emit('submit', {
    kind: 'guest',
    name: trimmedName || null,
    rating: parsedRating,
  })
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <label class="floating-label">
      <span>{{ $t('guest.nameLabel') }}</span>
      <input
        v-model="name"
        class="input input-bordered w-full"
        type="text"
        :maxlength="GUEST_NAME_MAX_LENGTH"
        :placeholder="$t('player.guestName')"
      />
    </label>

    <label class="floating-label">
      <span>{{ $t('guest.ratingLabel') }}</span>
      <input
        v-model="rating"
        class="input input-bordered w-full"
        type="number"
        :min="GUEST_RATING_MIN"
        :max="GUEST_RATING_MAX"
        step="1"
        placeholder="450"
        required
      />
    </label>

    <p class="text-base-content/60 text-xs">
      {{
        $t('guest.ratingHint', {
          min: GUEST_RATING_MIN,
          max: GUEST_RATING_MAX,
        })
      }}
    </p>

    <button class="btn btn-primary" type="submit" :disabled="pending">
      <span v-if="pending" class="loading loading-spinner" />
      {{ submitLabel }}
    </button>
  </form>
</template>

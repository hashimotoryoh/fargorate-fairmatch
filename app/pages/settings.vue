<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'authenticated' })

const { t } = useI18n()
const localePath = useLocalePath()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({ title: () => t('seo.settings.title') })

const { user, clear } = useUserSession()
const signingOut = ref(false)

async function signOut() {
  signingOut.value = true

  try {
    await clear()
    await navigateTo(localePath('/'))
  } finally {
    signingOut.value = false
  }
}

const { clearRecentOpponents } = useRecentOpponents()
const { clearRecentAccounts } = useRecentAccounts()
const { clearGameSetup } = useGameSetup()
const { resetMatch } = useFairSingleRace()

const localDataCleared = ref(false)

// 消すのはこの端末に保存したデータだけ。サーバー側のAPIキャッシュは
// 全ユーザー共有なので、個人の設定からは触らない。
function clearLocalData() {
  clearRecentOpponents()
  clearRecentAccounts()
  clearGameSetup()
  resetMatch()
  localDataCleared.value = true
}
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-8 pb-4">
    <h1 class="px-1 text-xl font-bold">{{ $t('settings.heading') }}</h1>

    <!-- アカウント。iOSの設定アプリのApple ID行に倣い、見出しなしの単独グループにする。 -->
    <div class="bg-base-200 rounded-box">
      <ul class="list">
        <li class="list-row items-center">
          <div class="avatar avatar-placeholder">
            <div class="bg-neutral text-neutral-content size-9 rounded-full">
              <Icon name="heroicons:user-solid" class="size-6" />
            </div>
          </div>
          <div class="list-col-grow min-w-0">
            <p class="truncate font-medium">
              {{ user?.name ?? $t('player.guestName') }}
            </p>
            <!--
              名前とIDの並び順は言語で変わるため、文の組み立てごと翻訳に任せる。
              ゲストは見せるIDが無いので、文そのものを別のキーに分ける。
            -->
            <p v-if="user" class="text-base-content/60 text-sm">
              {{
                isFargoRatePlayer(user)
                  ? $t('settings.playingAs', {
                      name: user.name,
                      membershipId: user.membershipId,
                    })
                  : $t('settings.playingAsGuest', {
                      name: user.name ?? $t('player.guestName'),
                    })
              }}
            </p>
          </div>
        </li>
      </ul>
    </div>

    <!-- 表示（テーマ・言語）。 -->
    <div>
      <h2
        class="text-base-content/50 px-3 pb-1.5 text-xs font-semibold tracking-wide uppercase"
      >
        {{ $t('settings.appearanceSection') }}
      </h2>
      <div class="bg-base-200 rounded-box">
        <ul class="list">
          <li class="list-row items-center">
            <div
              class="bg-primary text-primary-content flex size-9 shrink-0 items-center justify-center rounded-lg"
            >
              <Icon name="mdi:theme-light-dark" class="size-5" />
            </div>
            <div class="list-col-grow min-w-0">
              <p class="font-medium">{{ $t('settings.theme') }}</p>
              <p class="text-base-content/60 text-sm">
                {{ $t('settings.themeDescription') }}
              </p>
            </div>
            <label class="max-sm:toggle max-sm:text-base-content sm:flex sm:cursor-pointer sm:gap-2">
              <input type="checkbox" value="synthwave" class="sm:toggle theme-controller" />
              <Icon name="heroicons:sun" class="size-4 sm:size-5 sm:order-first" />
              <Icon name="heroicons:moon" class="size-4 sm:size-5 sm:order-last" />
            </label>
          </li>

          <li class="list-row items-center">
            <div
              class="bg-secondary text-secondary-content flex size-9 shrink-0 items-center justify-center rounded-lg"
            >
              <Icon name="heroicons:language" class="size-5" />
            </div>
            <div class="list-col-grow min-w-0">
              <p class="font-medium">{{ $t('settings.language') }}</p>
              <p class="text-base-content/60 text-sm">
                {{ $t('settings.languageDescription') }}
              </p>
            </div>
            <LocaleSwitcher />
          </li>
        </ul>
      </div>
    </div>

    <!-- ヘルプ（ブログ・FAQ）。 -->
    <div>
      <h2
        class="text-base-content/50 px-3 pb-1.5 text-xs font-semibold tracking-wide uppercase"
      >
        {{ $t('settings.helpSection') }}
      </h2>
      <div class="bg-base-200 rounded-box">
        <ul class="list">
          <li>
            <NuxtLink
              :to="localePath('/blog')"
              class="list-row rounded-b-none hover:bg-base-300 items-center transition-colors"
              target="_blank"
            >
              <div
                class="bg-info text-info-content flex size-9 shrink-0 items-center justify-center rounded-lg"
              >
                <Icon name="heroicons:newspaper" class="size-5" />
              </div>
              <div class="list-col-grow min-w-0">
                <p class="font-medium">{{ $t('document.blog') }}</p>
                <p class="text-base-content/60 text-sm">
                  {{ $t('settings.blogDescription') }}
                </p>
              </div>
              <Icon
                name="heroicons:chevron-right"
                class="text-base-content/30 size-5"
              />
            </NuxtLink>
          </li>

          <li>
            <NuxtLink
              :to="localePath('/faq')"
              class="list-row rounded-t-none hover:bg-base-300 items-center transition-colors"
              target="_blank"
            >
              <div
                class="bg-info text-info-content flex size-9 shrink-0 items-center justify-center rounded-lg"
              >
                <Icon name="heroicons:question-mark-circle" class="size-5" />
              </div>
              <div class="list-col-grow min-w-0">
                <p class="font-medium">{{ $t('document.faq') }}</p>
                <p class="text-base-content/60 text-sm">
                  {{ $t('settings.faqDescription') }}
                </p>
              </div>
              <Icon
                name="heroicons:chevron-right"
                class="text-base-content/30 size-5"
              />
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <!-- 端末に保存したデータ。 -->
    <div>
      <h2
        class="text-base-content/50 px-3 pb-1.5 text-xs font-semibold tracking-wide uppercase"
      >
        {{ $t('settings.localData.heading') }}
      </h2>
      <div class="bg-base-200 rounded-box">
        <ul class="list">
          <li>
            <button
              type="button"
              class="list-row hover:bg-base-300 w-full items-center text-left transition-colors cursor-pointer"
              @click="clearLocalData"
            >
              <div
                class="bg-error/15 text-error flex size-9 shrink-0 items-center justify-center rounded-lg"
              >
                <Icon name="heroicons:trash" class="size-5" />
              </div>
              <span class="text-error list-col-grow font-medium">
                {{ $t('settings.localData.clear') }}
              </span>
            </button>
          </li>
        </ul>
      </div>
      <p class="text-base-content/50 px-3 pt-1.5 text-xs">
        {{ $t('settings.localData.description') }}
        <span v-if="localDataCleared" class="text-success block">
          {{ $t('settings.localData.cleared') }}
        </span>
      </p>
    </div>

    <!-- サインアウト。iOSの設定アプリに倣い、独立したグループで中央揃えの赤文字にする。 -->
    <button
      type="button"
      class="btn btn-error btn-soft rounded-box h-12"
      :disabled="signingOut"
      @click="signOut"
    >
      <span v-if="signingOut" class="loading loading-spinner" />
      {{ $t('settings.signOut') }}
    </button>
  </div>
</template>

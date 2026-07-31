<script setup lang="ts">
import type { ScreenshotRect } from './ScreenshotFigure.vue'

type GuideStep = {
  title: string
  src: string
  alt: string
  crop: ScreenshotRect
  highlight: ScreenshotRect
}

/** 案内に使うスクリーンショットの原寸の幅。3枚とも同じ。 */
const SCREENSHOT_WIDTH = 1260

/**
 * 座標は元画像の原寸ピクセル。
 *
 * クロップ範囲は本人以外の顔が写り込まない位置に取ってある。00と01は右上に、
 * 02は上半分にプロフィール写真があるため、範囲を変える場合は写り込まないことを
 * 必ず確認すること。ぼかしで隠す方法は採っていない。backdrop-filter は祖先の
 * opacity の影響を受け、モーダルはまさに opacity を遷移させるため、環境に
 * よっては素通しになりうる。
 */
const steps: GuideStep[] = [
  {
    title: '左上のメニューを開く',
    src: '/img/fargorate-id-00.png',
    alt: 'FargoRateアプリのホーム画面。左上にハンバーガーメニューがある。',
    crop: { x: 0, y: 170, width: 960, height: 420 },
    highlight: { x: 76, y: 279, width: 100, height: 90 },
  },
  {
    title: '「プレイヤーカード」を開く',
    src: '/img/fargorate-id-01.png',
    alt: 'FargoRateアプリのメニュー。先頭にプレイヤーカードの項目がある。',
    crop: { x: 0, y: 620, width: 960, height: 500 },
    highlight: { x: 8, y: 710, width: 944, height: 168 },
  },
  {
    title: '一番下の13桁の数字を読む',
    src: '/img/fargorate-id-02.png',
    alt: 'FargoRateアプリのプレイヤーカード。バーコードの下に13桁の数字がある。',
    crop: { x: 0, y: 1860, width: 1260, height: 660 },
    highlight: { x: 340, y: 2360, width: 575, height: 110 },
  },
]

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
</script>

<template>
  <button
    class="link link-primary text-sm"
    type="button"
    @click="dialog?.showModal()"
  >
    FargoRate IDの確認方法
  </button>

  <dialog ref="dialog" class="modal">
    <div class="modal-box max-w-2xl">
      <h2 class="text-lg font-bold">FargoRate IDの確認方法</h2>
      <p class="text-base-content/70 mt-2 text-sm">
        FargoRateアプリで次の手順をたどると、13桁のFargoRate IDを確認できます。
      </p>

      <!--
        手順は縦に並べる。ユーザーは片手にFargoRateアプリを開いたスマホを持って
        この画面を見るため、3手順を一望して行き来できることを優先する。
        画像は閉じている間は描画されないため、lazy 読み込みで初期表示に響かない。
      -->
      <ol class="mt-6 flex flex-col gap-8">
        <li v-for="(step, index) in steps" :key="step.src">
          <p class="mb-2 flex items-center gap-2 font-medium">
            <span class="badge badge-primary badge-sm">{{ index + 1 }}</span>
            {{ step.title }}
          </p>
          <ScreenshotFigure
            :src="step.src"
            :alt="step.alt"
            :natural-width="SCREENSHOT_WIDTH"
            :crop="step.crop"
            :highlight="step.highlight"
          />
        </li>
      </ol>

      <div class="modal-action">
        <form method="dialog">
          <button class="btn">閉じる</button>
        </form>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button>閉じる</button>
    </form>
  </dialog>
</template>

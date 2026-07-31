<script lang="ts">
// 呼び出し側が座標を組み立てるための型。`<script setup>` からは export できない
// ため、通常の script ブロックに置く。
/** 元画像の原寸ピクセルで表す矩形。 */
export type ScreenshotRect = {
  x: number
  y: number
  width: number
  height: number
}
</script>

<script setup lang="ts">
const {
  src,
  alt,
  naturalWidth,
  crop,
  highlight = undefined,
  badge = undefined,
} = defineProps<{
  src: string
  alt: string
  /** 元画像の原寸の幅。クロップ倍率の算出に使う。 */
  naturalWidth: number
  /** 切り出す範囲。 */
  crop: ScreenshotRect
  /** 注目させたい範囲。枠で囲う。 */
  highlight?: ScreenshotRect
  /** 手順の番号。 */
  badge?: string
}>()

/**
 * 画像を絶対配置し、幅と位置をすべてクロップ枠に対する割合で与える。
 *
 * object-fit と object-position でも切り出せるが、object-position の割合は
 * 「はみ出した量に対する割合」で定義されるため原寸座標からの逆算が非線形になり、
 * 重ねる枠の座標と揃えられない。また縦横を独立に切れないため、写り込みを
 * 確実に画面外へ追い出す用途には使えない。
 */
const imageStyle = computed(() => ({
  width: `${(naturalWidth / crop.width) * 100}%`,
  left: `${(-crop.x / crop.width) * 100}%`,
  top: `${(-crop.y / crop.height) * 100}%`,
}))

/** 原寸座標の矩形を、クロップ枠に対する割合の位置とサイズへ変換する。 */
function toOverlayStyle(rect: ScreenshotRect) {
  return {
    left: `${((rect.x - crop.x) / crop.width) * 100}%`,
    top: `${((rect.y - crop.y) / crop.height) * 100}%`,
    width: `${(rect.width / crop.width) * 100}%`,
    height: `${(rect.height / crop.height) * 100}%`,
  }
}
</script>

<template>
  <figure
    class="border-base-300 bg-base-300 rounded-box relative overflow-hidden border"
    :style="{ aspectRatio: `${crop.width} / ${crop.height}` }"
  >
    <!-- max-w-none がないと preflight の img { max-width: 100% } に潰される。 -->
    <img
      :src="src"
      :alt="alt"
      class="absolute max-w-none"
      :style="imageStyle"
      loading="lazy"
      decoding="async"
    />

    <div
      v-if="highlight"
      class="ring-primary rounded-field pointer-events-none absolute ring-4"
      :style="toOverlayStyle(highlight)"
    >
      <span
        v-if="badge"
        class="badge badge-primary badge-sm absolute -top-3 -left-3"
        aria-hidden="true"
      >
        {{ badge }}
      </span>
    </div>
  </figure>
</template>

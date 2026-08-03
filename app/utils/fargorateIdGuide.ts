import type { ScreenshotRect } from '~/components/ScreenshotFigure.vue'

/** 案内の各手順で見せるスクリーンショット。文言は翻訳ファイルにある。 */
export type FargoRateIdGuideScreenshot = {
  /** 翻訳ファイルの `fargorateIdGuide.steps` 配下のキー。 */
  key: string
  src: string
  /** 元画像の原寸の幅。クロップの座標をこの幅の比率に直すために要る。 */
  naturalWidth: number
  crop: ScreenshotRect
  highlight: ScreenshotRect
}

/** 案内に使うスクリーンショットの原寸の幅。日本語版は3枚とも同じ。 */
const SCREENSHOT_WIDTH = 1260

/**
 * 日本語のFargoRateアプリのスクリーンショット。
 *
 * 座標は元画像の原寸ピクセル。クロップ範囲は本人以外の顔が写り込まない位置に
 * 取ってある。00と01は右上に、02は上半分にプロフィール写真があるため、範囲を
 * 変える場合は写り込まないことを必ず確認すること。ぼかしで隠す方法は採って
 * いない。backdrop-filter は祖先の opacity の影響を受け、モーダルはまさに
 * opacity を遷移させるため、環境によっては素通しになりうる。
 */
const japaneseScreenshots: FargoRateIdGuideScreenshot[] = [
  {
    key: 'menu',
    src: '/img/fargorate-id-00.png',
    naturalWidth: SCREENSHOT_WIDTH,
    crop: { x: 0, y: 170, width: 960, height: 420 },
    highlight: { x: 76, y: 279, width: 100, height: 90 },
  },
  {
    key: 'playerCard',
    src: '/img/fargorate-id-01.png',
    naturalWidth: SCREENSHOT_WIDTH,
    crop: { x: 0, y: 620, width: 960, height: 500 },
    highlight: { x: 8, y: 710, width: 944, height: 168 },
  },
  {
    key: 'number',
    src: '/img/fargorate-id-02.png',
    naturalWidth: SCREENSHOT_WIDTH,
    crop: { x: 0, y: 1860, width: 1260, height: 660 },
    highlight: { x: 340, y: 2360, width: 575, height: 110 },
  },
]

/**
 * ロケールごとのスクリーンショット。
 *
 * FargoRateアプリの表示言語は端末の設定に従うため、案内の画像も本来は
 * ロケールごとに撮り分ける必要がある。英語版の画像はまだ用意できていないので、
 * 当面は日本語版を流用する。画像が揃ったら `en` の配列だけ差し替えればよい。
 */
const screenshotsByLocale: Record<string, FargoRateIdGuideScreenshot[]> = {
  ja: japaneseScreenshots,
  en: japaneseScreenshots,
}

/** 指定したロケールの案内用スクリーンショットを返す。 */
export function fargorateIdGuideScreenshots(
  locale: string,
): FargoRateIdGuideScreenshot[] {
  return screenshotsByLocale[locale] ?? japaneseScreenshots
}

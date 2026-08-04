export type GameSlug =
  'fair-single-race' | 'custom-single-race' | 'usapl-9-ball' | 'usapl-8-ball'

export type GameDefinition = {
  slug: GameSlug
  /**
   * ブリーフィングのステップ3（ゲーム設定）のパス。ロケールの接頭辞を含まない
   * ため、描画側で `localePath()` に通すこと。
   */
  briefingPath: string
  /**
   * 表示名と説明のメッセージキー。モジュールスコープの定数では翻訳関数を
   * 呼べないため、キーで持ち描画側で `$t()` に通す。
   */
  labelKey: string
  descriptionKey: string
  /**
   * 一覧に出すシンボル画像（`public/` 起点のパス）。JCLのように地域で
   * ブランドが変わるゲームがあるため、ロケールごとに持つ。
   */
  image?: { ja: string; en: string }
  /** シンボルが決まっていないゲームの代用アイコン。 */
  icon?: string
  /** 未実装のゲームは一覧に「準備中」として出し、選べないようにする。 */
  available: boolean
}

/**
 * 提供するゲームの一覧。ゲームを追加するときはここに1件足し、
 * `app/pages/games/<スラッグ>/` にブリーフィングとスコアボードのページを置く。
 */
export const gameDefinitions: GameDefinition[] = [
  {
    slug: 'fair-single-race',
    briefingPath: '/games/fair-single-race/briefing',
    labelKey: 'games.types.fairSingleRace.label',
    descriptionKey: 'games.types.fairSingleRace.description',
    image: {
      ja: '/img/fargorate/FR-shield@2x.png',
      en: '/img/fargorate/FR-shield@2x.png',
    },
    available: true,
  },
  {
    slug: 'custom-single-race',
    briefingPath: '/games/custom-single-race/briefing',
    labelKey: 'games.types.customSingleRace.label',
    descriptionKey: 'games.types.customSingleRace.description',
    // シンボルは検討中のため、決まるまでアイコンで代用する。
    icon: 'mdi:tune-variant',
    available: false,
  },
  {
    slug: 'usapl-9-ball',
    briefingPath: '/games/usapl-9-ball/briefing',
    labelKey: 'games.types.usapl9Ball.label',
    descriptionKey: 'games.types.usapl9Ball.description',
    image: {
      ja: '/img/jcl/JCL_logo.png',
      en: '/img/usapl/2b640d11a73856ac2eba34c1c2861814.png',
    },
    available: false,
  },
  {
    slug: 'usapl-8-ball',
    briefingPath: '/games/usapl-8-ball/briefing',
    labelKey: 'games.types.usapl8Ball.label',
    descriptionKey: 'games.types.usapl8Ball.description',
    image: {
      ja: '/img/jcl/JCL_logo.png',
      en: '/img/usapl/2b640d11a73856ac2eba34c1c2861814.png',
    },
    available: false,
  },
]

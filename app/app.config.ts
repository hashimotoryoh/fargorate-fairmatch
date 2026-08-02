export default defineAppConfig({
  icon: {
    // daisyUIのドックやヘッダーでは `currentColor` に色を委ねたいため、
    // CSSの背景画像ではなくインラインSVGで描く。
    mode: 'svg',
  },
})

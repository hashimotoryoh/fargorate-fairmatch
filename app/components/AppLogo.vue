<template>
  <!--
    仮のロゴ。大小2つの球を上下にずらして配置し、レーティングの差がある
    プレイヤー同士の対戦を表す。ヘッダーでは 24px 前後で表示されるため、
    要素は2つに抑え、色は currentColor に任せる。
  -->
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    aria-hidden="true"
  >
    <circle cx="8" cy="15" r="6.25" />
    <circle cx="17.25" cy="7.75" r="4.25" fill="currentColor" />
  </svg>
</template>

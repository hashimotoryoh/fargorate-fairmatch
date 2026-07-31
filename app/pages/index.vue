<script setup lang="ts">
// 認証フローの確認用の仮実装。認証情報の表示とサインアウトのみを行う。
const { user, clear } = useUserSession()

async function signOut() {
  await clear()
  await navigateTo('/lookup')
}
</script>

<template>
  <div class="mx-auto max-w-md">
    <h1 class="mb-4 text-xl font-bold">FargoRate FairMatch</h1>

    <div v-if="user" class="flex flex-col gap-4">
      <table class="table">
        <tbody>
          <tr>
            <th>FargoRate ID</th>
            <td>{{ user.fargorateId }}</td>
          </tr>
          <tr>
            <th>名前</th>
            <td>{{ user.firstName }} {{ user.lastName }}</td>
          </tr>
          <tr>
            <th>リーグ</th>
            <td>{{ user.leagueName ?? '-' }}</td>
          </tr>
          <tr>
            <th>リージョン</th>
            <td>{{ user.region ?? '-' }}</td>
          </tr>
          <tr>
            <th>チーム</th>
            <td>{{ user.teamNames ?? '-' }}</td>
          </tr>
          <tr>
            <th>レーティング</th>
            <td>{{ user.effectiveRating }}</td>
          </tr>
          <tr>
            <th>信頼度</th>
            <td>{{ user.robustness }}</td>
          </tr>
        </tbody>
      </table>

      <button class="btn" type="button" @click="signOut">サインアウト</button>
    </div>
  </div>
</template>

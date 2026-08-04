# FargoRateレースAPI

[FargoRate](https://fairmatch.fargorate.com/)ページの `Find a Fair Match` を開き、`Player One` に `576`、`Player Two` に `419` を入力し検索した。

Google Chrome の `検証 > ネットワーク` から該当のリクエストを `Copy as cURL` でコピーし、ターミナルで実行した。

```bash
$ curl 'https://lms.fargorate.com/api/ratingcalc/racesbytype?type=1&ratingOne=576&ratingTwo=419' \
  -H 'Accept: application/json, text/javascript, */*; q=0.01' \
  -H 'Accept-Language: ja,en-US;q=0.9,en;q=0.8' \
  -H 'Connection: keep-alive' \
  -H 'Origin: https://fairmatch.fargorate.com' \
  -H 'Referer: https://fairmatch.fargorate.com/' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-site' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36' \
  -H 'sec-ch-ua: "Google Chrome";v="149", "Chromium";v="149", "Not)A;Brand";v="24"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"'
[{"highPlayerRaceTo":3,"lowPlayerRaceTo":2,"delta":0.0,"closest":false},{"highPlayerRaceTo":4,"lowPlayerRaceTo":2,"delta":0.0,"closest":false},{"highPlayerRaceTo":5,"lowPlayerRaceTo":3,"delta":0.0,"closest":false},{"highPlayerRaceTo":6,"lowPlayerRaceTo":3,"delta":0.0,"closest":false},{"highPlayerRaceTo":7,"lowPlayerRaceTo":4,"delta":0.0,"closest":false},{"highPlayerRaceTo":8,"lowPlayerRaceTo":4,"delta":0.0,"closest":false},{"highPlayerRaceTo":9,"lowPlayerRaceTo":4,"delta":0.0,"closest":false},{"highPlayerRaceTo":10,"lowPlayerRaceTo":5,"delta":0.0,"closest":false},{"highPlayerRaceTo":11,"lowPlayerRaceTo":5,"delta":0.0,"closest":false},{"highPlayerRaceTo":12,"lowPlayerRaceTo":5,"delta":0.0,"closest":true},{"highPlayerRaceTo":13,"lowPlayerRaceTo":6,"delta":0.0,"closest":false}]
```

## レスポンス

トップレベルが配列で、ルックアップAPIのようなラッパーオブジェクトは無い。

| フィールド | 型 | 意味 |
| --- | --- | --- |
| `highPlayerRaceTo` | number | レーティングが高い側の必要セット数 |
| `lowPlayerRaceTo` | number | レーティングが低い側の必要セット数 |
| `delta` | number | 上の例では全件 `0.0`。意味は未調査 |
| `closest` | boolean | 最も公平な候補にだけ `true` が付く。上の例では `12-5` の1件 |

## パラメータ

- `type`: レーティングが高い側への厳しさ。`0` = mild、`1` = medium、`2` = hot。このアプリでは常に medium（`1`）を使う
- `ratingOne`: レーティングが高い側。レスポンスが `high`/`low` の名前で返るため、アプリ側で高低を正規化してから渡す
- `ratingTwo`: レーティングが低い側

## 補足

- 認証・Cookieは不要。上のcURLのヘッダーはブラウザからのコピーそのままで、必須ではない
- このAPIを使うのはフェアセットマッチ（`fair-single-race`）だけである

# FargoRateメンバーシップルックアップAPI

[FargoRate](https://fairmatch.fargorate.com/)ページの `Find a Player` を開き、`Player name or id` のフォームに `Ryoh Hashimoto` を入力し検索した。

Google Chrome の `検証 > ネットワーク` から該当のリクエストを `Copy as cURL` でコピーし、ターミナルで実行した。

```bash
$ curl 'https://dashboard.fargorate.com/api/indexsearch?q=Ryoh%20Hashimoto' \
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
{"value":[{"id":"C531C6D8-8113-49AA-8EFF-AFCD00CE98EF","readableId":"1181693","membershipId":"9900006315553","firstName":"Ryoh","lastName":"Hashimoto","location":"","rating":"575","robustness":"695","provisionalRating":"575","effectiveRating":"576","membershipNumber":null,"imageUrl":null,"lmsId":null,"shareMatches":null,"statsOverall":null,"statsByRating":null,"ratingHistory":null}]}
```

## 補足

フォームには `Player name or id` とあるが、IDでの検索は `readableId` を対象としている。

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

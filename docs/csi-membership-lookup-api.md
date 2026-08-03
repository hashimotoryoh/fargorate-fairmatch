# CSIメンバーシップルックアップAPI

> **注意: このAPIは現在アプリから使用していない。** かつてはリンクの導線でFargoRate IDから姓名を引くために使っていたが、FargoRate IDが必ずしもCSIに登録されていないことが判明したため、FargoRateのAPIだけでリンクする設計へ変更した。この文書は調査の記録として残している。

[CSIメンバーシップルックアップ](https://csibbm.com/Public/MemberLookupweeksplayed)ページを開き、`Membership #` のフォームに `9900006315553` を入力し検索した。

Google Chrome の `検証 > ネットワーク` から該当のリクエストを `Copy as cURL` でコピーし、ターミナルで実行した。

```bash
$ curl 'https://csibbm.com/Public/_MembershipLookupWeeksPlayed' \
  -H 'accept: text/plain, */*; q=0.01' \
  -H 'accept-language: ja,en-US;q=0.9,en;q=0.8' \
  -H 'content-type: application/x-www-form-urlencoded; charset=UTF-8' \
  -b '_ga=GA1.2.176218668.1785403469; _gid=GA1.2.1136178529.1785403469; _ga_C4SKYT58NG=GS2.2.s1785403469$o1$g1$t1785403896$j60$l0$h0' \
  -H 'origin: https://csibbm.com' \
  -H 'priority: u=1, i' \
  -H 'referer: https://csibbm.com/Public/MemberLookupweeksplayed' \
  -H 'sec-ch-ua: "Google Chrome";v="149", "Chromium";v="149", "Not)A;Brand";v="24"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36' \
  -H 'x-requested-with: XMLHttpRequest' \
  --data-raw 'page=1&firstName=&lastName=&membershipNumber=9900006315553'
{"data":[{"ContactID":"c272bba2-cb86-47be-989f-4edb56cf7f61","ContactNumber":631555,"FirstName":"Ryoh","LegalFirstName":"Ryoh","Gender":null,"MembershipNumber":"9900006315553","LeagueNumber":2124,"LastName":"Hashimoto","City":null,"Region":"Japan - Unknown Prefecture","MembershipType":"USAPL League Player","IsSanctioned":"Yes","IsActiveLastSeason":false,"WeeksPlayed":0,"WeeksPlayedLastSeason":0,"TeamNameArray":null,"TeamNameLastSeasonArray":null,"TeamNames":"side arm","LastSeasonTeamNames":"side arm","AnyActiveMemberships":true,"RelevantPlayerActivities":null,"MemberCards":null,"MembershipTypeID":"0cab68c4-8968-4c07-a444-4c9c5174f66f","IsActive":true,"SanctioningBodyName":"USAPL","MembershipDetails":null,"LeagueName":"Japan CSI Pool League"}],"total":1}
```

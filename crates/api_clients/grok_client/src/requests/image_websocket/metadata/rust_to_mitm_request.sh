# This was Rust -> mitm capture -> curl

# Cloudflare knows this is fake...

curl-impersonate-ff \
  -vvv \
  --http1.1 \
  -H 'Connection: Upgrade' \
  -H 'Upgrade: websocket' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:143.0) Gecko/20100101 Firefox/143.0' \
  -H 'Accept: */*' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  --compressed \
  --include \
  -H 'Sec-Websocket-Version: 13' \
  -H 'Origin: https://grok.com' \
  -H 'Sec-Websocket-Extensions: permessage-deflate' \
  -H 'Sec-Websocket-Key: X2NHDjwqbk4quToBT5L97Q==' \
  -H 'Cookie: stblid=4c0f7d0f-9768-49cf-94f7-1f59f1adf1f5; x-anon-token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiNmFhNTFmZmYtMmFlNC00NjU3LTk0ZDItNDFjMWQyMjNlZTUyIiwidGVhbV9pZCI6bnVsbCwiZXhwIjoxNzYwMDQyNDA0LCJpc19hbm9uX3VzZXIiOnRydWV9.ySBr18x0Tht-a3RE-cdtQDbWoyJ1SbB_JrHAnNSFzOM; cf_clearance=qYvZ0CfScz.kWrsB14nlWVFylzzOQA0LTnnMZhlCk8M-1760763505-1.2.1.1-RyM97EWXnZ7vo8iyqmM4pyrVP1OFSPC88v61zhD_hAkFtS37A96cvUNXlvaCiGVk5wjTtSkpXcf9wq8wF7vLahSYBoHZXfCxfgeo8rN9BNDwaMXy1Czvj6rNu.OomL9gqoIUCTB7rixqDvJ0Bf9D5cGY5SQth8bLf0jP3rFwmR5oFQMZEdxiOj3zPWxb49EzRnZp_XXCXpiMSeUCABKbZNHGFRlTGqgsf3L.VLb6fCs; i18nextLng=en; sso=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiM2Y3NDgzMTYtOTkyMC00ZTkzLTk1NzQtOTA3ZGNkYzU4M2M5In0.9ne0Ab4cJiNMmntjQwxIfCrVcY6qmuSYMiNRSph1Y60; sso-rw=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiM2Y3NDgzMTYtOTkyMC00ZTkzLTk1NzQtOTA3ZGNkYzU4M2M5In0.9ne0Ab4cJiNMmntjQwxIfCrVcY6qmuSYMiNRSph1Y60; mp_ea93da913ddb66b6372b89d97b1029ac_mixpanel=%7B%22distinct_id%22%3A%222613c794-fce7-4ade-9b22-6118f977ede8%22%2C%22%24device_id%22%3A%22c3c89bdd-b1ba-4939-9ab4-b03b4dfd1e60%22%2C%22%24initial_referrer%22%3A%22%24direct%22%2C%22%24initial_referring_domain%22%3A%22%24direct%22%2C%22__mps%22%3A%7B%7D%2C%22__mpso%22%3A%7B%7D%2C%22__mpus%22%3A%7B%7D%2C%22__mpa%22%3A%7B%7D%2C%22__mpu%22%3A%7B%7D%2C%22__mpr%22%3A%5B%5D%2C%22__mpap%22%3A%5B%5D%2C%22%24user_id%22%3A%222613c794-fce7-4ade-9b22-6118f977ede8%22%2C%22%24search_engine%22%3A%22google%22%2C%22utm_source%22%3A%22x%22%2C%22utm_campaign%22%3A%22grok_imagine_post%22%7D' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: websocket' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'Pragma: no-cache' \
  -H 'Cache-Control: no-cache' \
  https://grok.com/ws/imagine/listen

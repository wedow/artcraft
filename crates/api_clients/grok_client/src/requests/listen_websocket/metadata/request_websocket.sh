#!/usr/bin/env bash

echo ""
echo "Websocket Test..."
echo ""

# NB: Without Cookie, it's a 403
# Without User-Agent, it's a 403

# IT WORKS !!!! -
# Curl was including `Sec-Websocket-Key` and `Sec-WebSocket-Version` automatically, so it GOT ADDED TWICE
# - It works without the `cf_clearance` cookie, too! (Under curl-impersonate-chrome)
# - It works with curl-impersonate-ff + Firefox 143 User-Agent (w/o cf_clearance cookie)
# - It works with curl-impersonate-ff + "weird user agent" (w/o cf_clearance cookie)

curl-impersonate-ff  -vvv 'wss://grok.com/ws/imagine/listen' \
  --include \
  --no-buffer \
  -H 'Connection: Upgrade' \
  -H 'Upgrade: websocket' \
  -b '_ga=GA1.1.1232202746.1760710013; i18nextLng=en; sso=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiOGU3MDFiNzctOTdkNC00ZjM0LWExOTctOWFmMDU1MzY3NDAwIn0.-a6x0InxbGzfTVfUlrdzxskxCnvMDI8lC90z4wHeGIk; sso-rw=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiOGU3MDFiNzctOTdkNC00ZjM0LWExOTctOWFmMDU1MzY3NDAwIn0.-a6x0InxbGzfTVfUlrdzxskxCnvMDI8lC90z4wHeGIk; stblid=b3331fc1-45d7-466b-83df-67427c0b2367; mp_ea93da913ddb66b6372b89d97b1029ac_mixpanel=%7B%22distinct_id%22%3A%2285980643-ffab-4984-a3de-59a608c47d7f%22%2C%22%24device_id%22%3A%2279ce237a-a0f3-4913-bf4b-519ac8a98263%22%2C%22%24initial_referrer%22%3A%22%24direct%22%2C%22%24initial_referring_domain%22%3A%22%24direct%22%2C%22__mps%22%3A%7B%7D%2C%22__mpso%22%3A%7B%7D%2C%22__mpus%22%3A%7B%7D%2C%22__mpa%22%3A%7B%7D%2C%22__mpu%22%3A%7B%7D%2C%22__mpr%22%3A%5B%5D%2C%22__mpap%22%3A%5B%5D%2C%22%24user_id%22%3A%2285980643-ffab-4984-a3de-59a608c47d7f%22%7D; _ga_8FEWB057YH=GS2.1.s1760724394$o3$g1$t1760724401$j53$l0$h0' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:143.0) Gecko/20100101 Firefox/143.0'

  #-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
  #-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:143.0) Gecko/20100101 Firefox/143.0'
  #-b '_ga=GA1.1.1232202746.1760710013; i18nextLng=en; sso=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiOGU3MDFiNzctOTdkNC00ZjM0LWExOTctOWFmMDU1MzY3NDAwIn0.-a6x0InxbGzfTVfUlrdzxskxCnvMDI8lC90z4wHeGIk; sso-rw=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiOGU3MDFiNzctOTdkNC00ZjM0LWExOTctOWFmMDU1MzY3NDAwIn0.-a6x0InxbGzfTVfUlrdzxskxCnvMDI8lC90z4wHeGIk; stblid=b3331fc1-45d7-466b-83df-67427c0b2367; mp_ea93da913ddb66b6372b89d97b1029ac_mixpanel=%7B%22distinct_id%22%3A%2285980643-ffab-4984-a3de-59a608c47d7f%22%2C%22%24device_id%22%3A%2279ce237a-a0f3-4913-bf4b-519ac8a98263%22%2C%22%24initial_referrer%22%3A%22%24direct%22%2C%22%24initial_referring_domain%22%3A%22%24direct%22%2C%22__mps%22%3A%7B%7D%2C%22__mpso%22%3A%7B%7D%2C%22__mpus%22%3A%7B%7D%2C%22__mpa%22%3A%7B%7D%2C%22__mpu%22%3A%7B%7D%2C%22__mpr%22%3A%5B%5D%2C%22__mpap%22%3A%5B%5D%2C%22%24user_id%22%3A%2285980643-ffab-4984-a3de-59a608c47d7f%22%7D; cf_clearance=e7.LXFbmc.U81rZIqxuBfBe88yuBZMXEP.zwxNkbOxw-1760724394-1.2.1.1-JMHrapBGxcZriUw852.NCqwFRpZJFvoYxq.mV0jDpKCkiHBZwpdv09XJi6eFLJUYJJ6UDZ3c1eAsucVYLdWN.SvA9M6qzujj8nY4ym03PxQlMEd2OmXJogtDDJbPhA5AZEGxA39_6QQlvaBIUBnYPALYrTl9XJN_V4q3n4BXtpoBzrIJURMIn0mW3esUCGv0NukuVQrkrNtMgqT5SUmTGi0idaBYoR_2_wv4P09lsug; _ga_8FEWB057YH=GS2.1.s1760724394$o3$g1$t1760724401$j53$l0$h0' \
  #-H 'Origin: https://grok.com' \
  #-H 'Host: grok.com' \
  #-H 'Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==' \
  #-H 'Sec-WebSocket-Version: 13' \

# -H 'Sec-WebSocket-Key: XjPVg9OQe7CJOH6U7lq5vw==' \

#  -H 'Cache-Control: no-cache' \
#  -H 'Accept-Language: en-US,en;q=0.9' \
#  -H 'Pragma: no-cache' \
# -H 'Sec-WebSocket-Extensions: permessage-deflate; client_max_window_bits'

#curl-impersonate-ff --include \
#curl-impersonate-chrome --include \

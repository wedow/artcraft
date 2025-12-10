use crate::credentials::world_labs_bearer_token::WorldLabsBearerToken;
use crate::credentials::world_labs_cookies::WorldLabsCookies;
use crate::error::world_labs_client_error::WorldLabsClientError;
use crate::error::world_labs_error::WorldLabsError;
use crate::requests::common::common_header_values::{ORIGIN_VALUE, REFERER_VALUE};
use http_headers::names::{PRIORITY, SEC_FETCH_DEST, SEC_FETCH_MODE, SEC_FETCH_SITE, SEC_GPC};
use http_headers::values::accept::ACCEPT_ALL;
use http_headers::values::cache_control::CACHE_CONTROL_NO_CACHE;
use http_headers::values::connection::CONNECTION_KEEP_ALIVE;
use http_headers::values::content_type::CONTENT_TYPE_APPLICATION_JSON;
use http_headers::values::pragma::PRAGMA_NO_CACHE;
use http_headers::values::priority::PRIORITY_HIGHEST;
use http_headers::values::sec::{SEC_FETCH_DEST_EMPTY, SEC_FETCH_MODE_CORS, SEC_FETCH_SITE_CROSS_SITE};
use http_headers::values::te::TE_TRAILERS;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, AUTHORIZATION, CACHE_CONTROL, CONNECTION, CONTENT_TYPE, ORIGIN, PRAGMA, REFERER, TE};
use wreq::Client;
use wreq_util::Emulation;

const URL : &str = "https://marble2-kgw-prod-iac1.wlt-ai.art/api/v1/objects";

pub struct ObjectsCreateInitialArgs<'a> {

  pub cookies: &'a WorldLabsCookies,
  pub bearer_token: &'a WorldLabsBearerToken,

}

pub async fn objects_create_initial(args: ObjectsCreateInitialArgs<'_>) -> Result<(), WorldLabsError> {
  let client = Client::builder()
      .emulation(Emulation::Firefox143)
      .build()
      .map_err(|err| WorldLabsClientError::WreqClientError(err))?;

  /*
  -H 'User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0' \
  -H 'Accept: * / *' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate, br, zstd' \
  -H 'Referer: https://marble.worldlabs.ai/' \
  -H 'content-type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk1MTg5MTkxMTA3NjA1NDM0NGUxNWUyNTY0MjViYjQyNWVlYjNhNWMiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiVmljdG9yIFZvaWNlIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0t3MGFhWEtZU3F5LVhra242OXlkSUpGR25KQTM3UzEzWHZqTlk0ZDl4Q3pVektVdz1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS93bHQtdHJhaW5pbmctZ3NjIiwiYXVkIjoid2x0LXRyYWluaW5nLWdzYyIsImF1dGhfdGltZSI6MTc2NTMyNTM3NCwidXNlcl9pZCI6InNWZ0FRRHlIM0JmWU9CZkY2ZXBXVGpMSHlnWDIiLCJzdWIiOiJzVmdBUUR5SDNCZllPQmZGNmVwV1RqTEh5Z1gyIiwiaWF0IjoxNzY1MzI1Mzc0LCJleHAiOjE3NjUzMjg5NzQsImVtYWlsIjoidmljdG9ydm9pY2U4OUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExNjQ1OTMwMDE5ODYxOTg4ODgzNiJdLCJlbWFpbCI6WyJ2aWN0b3J2b2ljZTg5QGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.U_mp4iAw14poJz11UFKg3QVO6TSfE8Gps6VqLhg4GLLumjilgnuyD8mnKFznRFX0R-OyBf8mugVk59zfy4BugeZ0cXRkm1FWHqR9BVJZ9BQoEobXw4RqHkUvtgSe2qnx8a4fLUVp5zxNPpXfEjLAdcG4YnNwdZ7-TxyCDvO3U_WHkG3aAJup1q5KOqURDeYoQ7m7THeobyM3pnmDO03GIMdYgLV3Lnpvk6FTprtsV8SxWr8ZJ-Cy1g_I9wtKcB4B5bIFLjfV4r8W_-uq_g5ddbri-Yy28Ah97jxFIFOVChbPSbQpS-TRshW6M2cM5Y2EhGudpgVQBM-Tekco9fGSRw' \
  -H 'Origin: https://marble.worldlabs.ai' \
  -H 'Sec-GPC: 1' \
  -H 'Connection: keep-alive' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: cross-site' \
  -H 'Priority: u=0' \
  -H 'Pragma: no-cache' \
  -H 'Cache-Control: no-cache' \
  -H 'TE: trailers' \
  --data-raw '{"metadata":{"version":"0.0.1","createdAt":1765325556528,"updatedAt":1765325556528,"useAdvancedEditing":false,"draftMode":false,"nodes":{}},"mime_type":"application/run+json"}'
   */

  let mut request_builder = client.post(URL)
      .header(ACCEPT, ACCEPT_ALL)
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
      .header(ACCEPT_ENCODING, "gzip, deflate, br, zstd")
      .header(REFERER, REFERER_VALUE)
      .header(CONTENT_TYPE, CONTENT_TYPE_APPLICATION_JSON)
      .header(AUTHORIZATION, args.bearer_token.to_bearer_token_string())
      .header(ORIGIN, ORIGIN_VALUE)
      .header(SEC_GPC, "1")
      .header(CONNECTION, CONNECTION_KEEP_ALIVE)
      .header(SEC_FETCH_DEST, SEC_FETCH_DEST_EMPTY)
      .header(SEC_FETCH_MODE, SEC_FETCH_MODE_CORS)
      .header(SEC_FETCH_SITE, SEC_FETCH_SITE_CROSS_SITE)
      .header(PRIORITY, PRIORITY_HIGHEST)
      .header(PRAGMA, PRAGMA_NO_CACHE)
      .header(CACHE_CONTROL, CACHE_CONTROL_NO_CACHE)
      .header(TE, TE_TRAILERS);



  Ok(())
}
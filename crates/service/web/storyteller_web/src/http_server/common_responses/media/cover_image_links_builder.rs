use crate::http_server::common_responses::media::media_domain::MediaDomain;
use artcraft_api_defs::common::responses::cover_image_links::CoverImageLinks;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;

// TODO(bt,2024-09-18): Consolidate thumbnail builder code and vars
// TODO(bt,2024-09-05): Worth reducing the quality at all?
const QUALITY : u8 = 95;

pub struct CoverImageLinksBuilder {}

impl CoverImageLinksBuilder {

  pub fn from_media_path(
    domain: MediaDomain,
    bucket_path: &MediaFileBucketPath,
  ) -> Option<CoverImageLinks> {
    let rooted_path = bucket_path.get_full_object_path_str();
    Self::from_rooted_path(domain, rooted_path)
  }

  pub fn from_maybe_media_path(
    domain: MediaDomain,
    bucket_path: Option<&MediaFileBucketPath>,
  ) -> Option<CoverImageLinks> {
    match bucket_path {
      None => None,
      Some(bucket_path) => Self::from_media_path(domain, bucket_path),
    }
  }

  pub fn from_parts(
    domain: MediaDomain,
    maybe_cover_image_public_bucket_path: Option<&str>,
    maybe_cover_image_public_bucket_prefix: Option<&str>,
    maybe_cover_image_public_bucket_extension: Option<&str>,
  ) -> Option<CoverImageLinks> {
    let bucket_path= match maybe_cover_image_public_bucket_path {
      None => return None,
      Some(path) => path,
    };
    let bucket_path = MediaFileBucketPath::from_object_hash(
      bucket_path,
      maybe_cover_image_public_bucket_prefix,
      maybe_cover_image_public_bucket_extension
    );
    Self::from_media_path(domain, &bucket_path)
  }

  pub fn from_rooted_path(
    domain: MediaDomain,
    rooted_path: &str,
  ) -> Option<CoverImageLinks> {
    if !rooted_path.ends_with(".jpg")
        && !rooted_path.ends_with(".png")
        && !rooted_path.ends_with(".gif") {
      return None;
    }

    let mut cdn_url = domain.new_cdn_url();
    cdn_url.set_path(rooted_path);

    Some(CoverImageLinks {
      cdn_url,
      thumbnail_template: thumbnail_template(domain, rooted_path),
    })
  }
}

fn thumbnail_template(media_domain: MediaDomain, rooted_path: &str) -> String {
  let host = media_domain.cdn_url_str();
  format!("{host}/cdn-cgi/image/width={{WIDTH}},quality={QUALITY}{rooted_path}")
}

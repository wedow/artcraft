use errors::AnyhowResult;

pub async fn send_password_reset(email_address: &str, secret_key: String) -> AnyhowResult<()> { 
  todo!();
  // use futures::Future;
  // use mail_headers::{
  //     headers::*,
  //     header_components::Domain
  // };
  // use mail_core::{Mail, default_impl::simple_context};
  // use mail_smtp::{self as smtp, ConnectionConfig};

  // let ctx = simple_context::new(Domain::from_unchecked("example.com".to_owned()), "asdkds".parse().unwrap())
  //     .unwrap();

  // let mut mail = Mail::plain_text("Some body", &ctx);
  // mail.insert_headers(headers! {
  //     _From: ["bla@example.com"],
  //     _To: ["blub@example.com"],
  //     Subject: "Some Mail"
  // }.unwrap());

  // let con_config = ConnectionConfig::builder_local_unencrypted().build();

  // let fut = smtp::send(mail.into(), con_config, ctx);
  // let results = fut.wait();
}
use crate::email::get_password_reset_url::{get_password_reset_url, PasswordResetLocation};
use crate::http_server::requests::get_request_domain_branding::DomainBranding;
use errors::AnyhowResult;
use resend_rs::types::CreateEmailBaseOptions;
use resend_rs::Resend;
use server_environment::ServerEnvironment;

pub struct SendPasswordResetEmailArgs<'a> {
  email_address_destination: &'a str,
  verification_token: &'a str,
  resend_client: &'a Resend,
  server_environment: ServerEnvironment,
  domain_branding: DomainBranding,
}

pub async fn send_password_reset_email(
  args: SendPasswordResetEmailArgs<'_>
) -> AnyhowResult<()> {
  let resend = Resend::new("re_xxxxxxxxx");

  let from = "ArtCraft <noreply@getartcraft.com>";
  let to = [args.email_address_destination];

  let subject = "ArtCraft Password Reset";
  
  let url = match (args.domain_branding, args.server_environment) {
    (DomainBranding::FakeYou, ServerEnvironment::Development) => PasswordResetLocation::FakeYouDevelopment,
    (DomainBranding::FakeYou, ServerEnvironment::Production) => PasswordResetLocation::FakeYouProduction,
    (_, _) => PasswordResetLocation::ArtCraftProduction,
  };

  let link = get_password_reset_url(args.verification_token, url);
  let code = args.verification_token;

  let html_message = format!(r#"
      <a href="{link}">Click here to reset your password!</a>
      <br />
      <br />
      If you can't click the link, here's the secret reset code: {code}
      <br />
      <br />
      Thank You,
      <br />
      <br />
      Storyteller.ai (FakeYou) Team
    "#);

  let email = CreateEmailBaseOptions::new(from, to, subject)
      .with_html(&html_message);

  let _email = args.resend_client.emails.send(email).await?;

  Ok(())
}
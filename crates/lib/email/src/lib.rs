use errors::{AnyhowResult, AnyhowError, anyhow};

use lettre::message::header::ContentType;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};


pub async fn send_password_reset(email_address: &str, secret_key: String) -> AnyhowResult<()> { 
    let email = Message::builder()
    .from("Support <support@storyteller.ai>".parse().unwrap())
    .to( email_address.parse().unwrap())
    .subject("Your password reset")
    .header(ContentType::TEXT_PLAIN)
    .body(format!("Here you go! {secret_key}"))
    .unwrap();

    let creds = Credentials::new("smtp_username".to_owned(), "smtp_password".to_owned());

    // Open a remote connection to gmail
    let mailer = SmtpTransport::relay("smtp.gmail.com")
    .unwrap()
    .credentials(creds)
    .build();

    // Send the email
    match mailer.send(&email) {
    Ok(_) => println!("Email sent successfully!"),
    Err(e) => panic!("Could not send email: {e:?}"),
    }

    Ok(())
}
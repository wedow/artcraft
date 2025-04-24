use crate::credentials::SoraCredentials;
use crate::creds::sora_credential_set::SoraCredentialSet;

pub enum CredentialMigration {
  Legacy(SoraCredentials),
  New(SoraCredentialSet),
}

pub enum CredentialMigrationRef<'a> {
  Legacy(&'a SoraCredentials),
  New(&'a SoraCredentialSet),
}

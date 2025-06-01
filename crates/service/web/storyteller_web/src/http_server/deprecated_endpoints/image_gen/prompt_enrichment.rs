use prompt_engineering::classify_prompt::classify_prompt;

use crate::http_server::deprecated_endpoints::image_gen::enqueue_image_generation::EnqueueImageGenRequest;
use crate::http_server::deprecated_endpoints::image_gen::replacement_prompts::get_replacement_prompt;

pub struct EnrichedPrompts {
  pub positive_prompt: String,
  pub maybe_negative_prompt: Option<String>,
}

const DEFAULT_NEGATIVE_PROMPT : &str = "nudity, nsfw, naked, sex";

const ADD_TO_NSFW_POSITIVE_PROMPT: &str = "legal adult, legal age";
const ADD_TO_NSFW_NEGATIVE_PROMPT: &str = "underage, child, minor, kid, children, young, youngling, younglings";

/// Enrich the user-provided prompts.
/// In the future, we can add prompt engineering to these.
pub fn enrich_prompt(request: &EnqueueImageGenRequest) -> Option<EnrichedPrompts> {
  let mut positive_prompt = match request.maybe_prompt.as_deref() {
    None => return None, // NB: Some callers aren't running prompts.
    Some(prompt) => prompt.to_string(),
  };

  let mut maybe_negative_prompt = request.maybe_n_prompt
      .as_ref()
      .map(|prompt| prompt.to_string());

  let classification = classify_prompt(&positive_prompt);

  if !classification.prompt_references_sex {
    // If the prompt doesn't have sex terms in it, try to make sure it doesn't get generated.
    match maybe_negative_prompt.as_deref() {
      None => {
        maybe_negative_prompt = Some(DEFAULT_NEGATIVE_PROMPT.to_string());
      }
      Some(negative_prompt) => {
        let new_negative_prompt = format!("{}, {}", negative_prompt, DEFAULT_NEGATIVE_PROMPT);
        maybe_negative_prompt = Some(new_negative_prompt);
      }
    }
  }

  if classification.prompt_references_sex {
    if !classification.is_abusive() {
      // Abusive cases get handled below
      positive_prompt = format!("{}, {}", positive_prompt, ADD_TO_NSFW_POSITIVE_PROMPT);
    }

    match maybe_negative_prompt.as_deref() {
      None => {
        maybe_negative_prompt = Some(ADD_TO_NSFW_NEGATIVE_PROMPT.to_string());
      }
      Some(negative_prompt) => {
        let new_negative_prompt = format!("{}, {}", negative_prompt, ADD_TO_NSFW_NEGATIVE_PROMPT);
        maybe_negative_prompt = Some(new_negative_prompt);
      }
    }
  }

  // These prompts get treated harshly.
  if classification.is_abusive() {
    // NB: Save the original prompt as the negative prompt so that we can study it.
    maybe_negative_prompt = Some(positive_prompt.clone());
    positive_prompt = get_replacement_prompt().to_string();
  }

  Some(EnrichedPrompts {
    positive_prompt,
    maybe_negative_prompt,
  })
}

#[cfg(test)]
mod tests {
  use crate::http_server::deprecated_endpoints::image_gen::enqueue_image_generation::EnqueueImageGenRequest;
  use crate::http_server::deprecated_endpoints::image_gen::prompt_enrichment::enrich_prompt;

  struct Prompt {
    pub positive: &'static str,
    pub maybe_negative: Option<&'static str>,
  }

  impl Prompt {
    fn positive(positive: &'static str) -> Self {
      Self {
        positive,
        maybe_negative: None,
      }
    }

    fn positive_negative(positive: &'static str, negative: &'static str) -> Self {
      Self {
        positive,
        maybe_negative: Some(negative),
      }
    }

    fn to_request(&self) -> EnqueueImageGenRequest {
      EnqueueImageGenRequest {
        maybe_prompt: Some(self.positive.to_string()),
        maybe_n_prompt: self.maybe_negative.as_deref().map(|s| s.to_string()),
        ..Default::default()
      }
    }
  }

  mod sfw {
    use super::*;

    #[test]
    fn sfw_prompt_no_negative_prompt() {
      let result = enrich_prompt(&Prompt::positive("hello").to_request()).unwrap();

      assert_eq!(result.positive_prompt, "hello".to_string());
      assert_eq!(result.maybe_negative_prompt, Some("nudity, nsfw, naked, sex".to_string()));
    }

    #[test]
    fn sfw_prompt_with_negative_prompt() {
      let result = enrich_prompt(&Prompt::positive_negative("hello", "goodbye").to_request()).unwrap();

      assert_eq!(result.positive_prompt, "hello".to_string());
      assert_eq!(result.maybe_negative_prompt, Some("goodbye, nudity, nsfw, naked, sex".to_string()));
    }
  }

  mod nsfw {
    use super::*;

    #[test]
    fn legal_nsfw_prompt_no_negative_prompt() {
      let result = enrich_prompt(&Prompt::positive("sex").to_request()).unwrap();

      assert_eq!(result.positive_prompt, "sex, legal adult, legal age".to_string());
      assert_eq!(result.maybe_negative_prompt, Some("underage, child, minor, kid, children, young, youngling, younglings".to_string()));
    }

    #[test]
    fn legal_nsfw_prompt_with_negative_prompt() {
      let result = enrich_prompt(&Prompt::positive_negative("sex", "goodbye").to_request()).unwrap();

      assert_eq!(result.positive_prompt, "sex, legal adult, legal age".to_string());
      assert_eq!(result.maybe_negative_prompt, Some("goodbye, underage, child, minor, kid, children, young, youngling, younglings".to_string()));
    }
  }

  mod illegal {
    use super::*;

    #[test]
    fn csam_prompt_no_negative_prompt() {
      let result = enrich_prompt(&Prompt::positive("underage sex").to_request()).unwrap();

      // Scrubbed from prompt
      assert!(!result.positive_prompt.contains("underage"));
      assert!(!result.positive_prompt.contains("sex"));

      // Bad prompt is preserved as the negative prompt
      assert_eq!(result.maybe_negative_prompt, Some("underage sex".to_string()));
    }

    #[test]
    fn csam_prompt_with_negative_prompt() {
      let result = enrich_prompt(&Prompt::positive_negative("underage sex", "goodbye").to_request()).unwrap();

      // Scrubbed from prompt
      assert!(!result.positive_prompt.contains("underage"));
      assert!(!result.positive_prompt.contains("sex"));

      // Bad prompt is preserved as the negative prompt
      assert_eq!(result.maybe_negative_prompt, Some("underage sex".to_string()));
    }
  }
}

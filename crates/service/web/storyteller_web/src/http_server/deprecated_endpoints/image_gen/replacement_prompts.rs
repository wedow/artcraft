use collections::random_from_array::random_from_array;

const REPLACEMENT_PROMPTS : [&str; 4] = [
  "angry president bush, disappointed George Bush, single person, pointing in accusation, disappointed at the viewer, trying to teach the user a lesson, furrowed brow, sad, angry, disappointed, high quality, good art, best quality, amazing detail, masterpiece",
  "angry president obama, disappointed Barack Obama, single person, pointing in accusation, disappointed at the viewer, trying to teach the user a lesson, furrowed brow, sad, angry, disappointed, high quality, good art, best quality, amazing detail, masterpiece",
  "angry elvis, disappointed Elvis Presley, single person, pointing in accusation, disappointed at the viewer, trying to teach the user a lesson, furrowed brow, sad, angry, disappointed, high quality, good art, best quality, amazing detail, masterpiece",
  "angry Queen Elizabeth, disappointed Queen Elizabeth II, single person, pointing in accusation, disappointed at the viewer, trying to teach the user a lesson, furrowed brow, sad, angry, disappointed, high quality, good art, best quality, amazing detail, masterpiece",
];

/// If the user inputs a abusive, controversial, or bad prompt, replace the prompt with one of these.
pub fn get_replacement_prompt() -> &'static str {
  random_from_array(&REPLACEMENT_PROMPTS)
      .unwrap_or(&REPLACEMENT_PROMPTS[0])
}

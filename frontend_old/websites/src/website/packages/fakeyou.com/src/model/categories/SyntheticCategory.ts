import { TtsModelListItem } from "@storyteller/components/src/api/tts/ListTtsModels";
import { v4 as uuidv4 } from "uuid";

// Special synthetic categories created on the frontend.
// Used in a union type, but they should play well with `TtsCategory`.
export class SyntheticCategory {
  name: string;
  name_for_dropdown: string;
  category_token: string;
  maybe_super_category_token?: string;

  ttsModels: Set<TtsModelListItem>;

  constructor(
    name: string,
    token?: string,
    maybe_super_category_token?: string
  ) {
    this.name = name;
    this.name_for_dropdown = name;
    this.category_token = !!token ? token : `syn:${uuidv4()}`;
    this.maybe_super_category_token = maybe_super_category_token;
    this.ttsModels = new Set();
  }
}

export function GenerateSyntheticCategories(): SyntheticCategory[] {
  return [
    // Under-categorized
    new SyntheticCategory("Under-categorized Models", "syn:under"),
    new SyntheticCategory(
      "With 0 categories",
      "syn:uncategorized",
      "syn:under"
    ),
    new SyntheticCategory("With 1 category", "syn:one-category", "syn:under"),
    // Most recent
    new SyntheticCategory("Most Recent Voices", "syn:most-recent"),
  ];
}

// Directly mutate the model records
export function DynamicallyCategorizeModels(models: TtsModelListItem[]) {
  // NB: Sorting by creation date will involve more refactoring, so this is fine for now.
  const mostRecentModelTokens = new Set(
    [...models]
      .sort((modelA, modelB) => {
        const dateA = new Date(modelA.created_at);
        const dateB = new Date(modelB.created_at);
        if (dateA > dateB) {
          return -1;
        } else if (dateA < dateB) {
          return 1;
        } else {
          return 0;
        }
      })
      .map((model) => model.model_token)
      .slice(0, 25)
  );

  models.forEach((model) => {
    if (!model.category_tokens) {
      model.category_tokens = [];
    }
    if (model.category_tokens.length === 1) {
      model.category_tokens.push("syn:one-category");
    } else if (model.category_tokens.length === 0) {
      model.category_tokens.push("syn:uncategorized");
    }

    if (mostRecentModelTokens.has(model.model_token)) {
      model.category_tokens.push("syn:most-recent");
    }
  });
}

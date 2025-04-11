import React from // useEffect, useState
"react";
import { TtsCategory } from "@storyteller/components/src/api/category/ListTtsCategories";
// import { TtsModelListItem } from "@storyteller/components/src/api/tts/ListTtsModels";
import { App } from "./App";
// import { GetComputedTtsCategoryAssignmentsSuccessResponse } from "@storyteller/components/src/api/category/GetComputedTtsCategoryAssignments";
import { SyntheticCategory } from "./model/categories/SyntheticCategory";

// interface Props {
//   // Certan browsers (iPhone) have pitiful support for drawing APIs. Worse yet,
//   // they seem to lose the "touch event sandboxing" that allows for audio to be
//   // played after user interaction if the XHRs delivering the audio don't do so
//   // as actual audio mimetypes. (Decoding from base64 and trying to play fails.)
//   enableSpectrograms: boolean;

//   // Whether or not to inform users that the name of the website has changed.
//   flashVocodesNotice: boolean;
// }

export type TtsCategoryType = TtsCategory | SyntheticCategory;

export function AppWrapper() {
  // props: Props
  // Caches of all objects queried
  // These may be triggered by a different page than the user initially lands on.
  // const [allTtsCategories, setAllTtsCategories] = useState<TtsCategoryType[]>(
  //   []
  // );
  // const [allTtsModels, setAllTtsModels] = useState<TtsModelListItem[]>([]);
  // const [computedTtsCategoryAssignments, setComputedTtsCategoryAssignments] =
  //   useState<GetComputedTtsCategoryAssignmentsSuccessResponse | undefined>(
  //     undefined
  //   );

  // Precalculated maps for lookup by primary key
  // const [allCategoriesByTokenMap, setAllCategoriesByTokenMap] = useState<
  //   Map<string, TtsCategoryType>
  // >(new Map());
  // const [allTtsModelsByTokenMap, setAllTtsModelsByTokenMap] = useState<
  //   Map<string, TtsModelListItem>
  // >(new Map());

  // Precalculated map for lookup by foreign key
  // A TTS voice is attached to every category up the tree from the leaf.
  // We recursively build this, 1) to ensure we can access a voice at all levels
  // of specificity, and 2) to prune empty categories.
  // const [ttsModelsByCategoryToken, setTtsModelsByCategoryToken] = useState<
  //   Map<string, Set<TtsModelListItem>>
  // >(new Map());

  // Calculated dropdown options for every level of categories.
  // Outer array has length of at least one, one element per <select>
  // Inner array contains the categories in each level.
  // Structure: [dropdownLevel][categories]
  // const [dropdownCategories, setDropdownCategories] = useState<
  //   TtsCategoryType[][]
  // >([]);

  // User selections.
  // Every category in the heirarchy that has been selected by the user.
  // Empty list if none are selected.
  // Structure: [firstSelected, secondSelected...]
  // const [selectedCategories, setSelectedCategories] = useState<
  //   TtsCategoryType[]
  // >([]);

  // User selections.
  // const [maybeSelectedTtsModel, setMaybeSelectedTtsModel] = useState<
  //   TtsModelListItem | undefined
  // >(undefined);

  // User selections.
  // This allows the user to filter out voices that don't match their
  // preferred language.
  // Values are IETF 2-letter language codes. Other locale information is stripped.
  // The value "*" serves as a sentinel for all voices / no filter.
  // const [selectedTtsLanguageScope, setSelectedTtsLanguageScope] =
  //   useState<string>("*");

  // TODO: Handle empty category list
  // useEffect(() => {
  //   // Category lookup by token
  //   let categoriesByTokenMap = new Map();
  //   allTtsCategories.forEach(category => {
  //     categoriesByTokenMap.set(category.category_token, category);
  //   });
  //   setAllCategoriesByTokenMap(categoriesByTokenMap);

  //   // TTS model lookup by token
  //   let ttsModelsByTokenMap = new Map();
  //   allTtsModels.forEach(model => {
  //     ttsModelsByTokenMap.set(model.model_token, model);
  //   });
  //   setAllTtsModelsByTokenMap(ttsModelsByTokenMap);

  // Initial dropdown state
  // const rootCategories = allTtsCategories.filter(category => {
  //   return !category.maybe_super_category_token;
  // });
  // const rootLevel = [rootCategories];
  // setDropdownCategories(rootLevel);

  ///  NB: This was the really expensive cubic time++ aglorithm to recursively calculate nested category assignments.
  ///   This has since been ported to the server and will no longer be computed here. We're preserving this for posterity.
  ///
  ///    // Voice lookup table
  ///    let categoriesToTtsModelTokens = new Map();
  ///    // Category ancestry memoization
  ///    let categoryTokenToAllAncestorTokens : Map<string, Set<string>> = new Map();
  ///
  ///    // N * M with memoization should't be too bad here.
  ///    // Also note that the models should be lexographically sorted by name.
  ///    allTtsModels.forEach(ttsModel => {
  ///      if (ttsModel.category_tokens.length === 0) {
  ///        // TODO: Attach to "uncategorized" special category
  ///        return;
  ///      }
  ///      ttsModel.category_tokens.forEach(categoryToken => {
  ///        let ancestors = categoryTokenToAllAncestorTokens.get(categoryToken);
  ///        if (ancestors === undefined) {
  ///          ancestors = findAllAncestorTokens(categoryToken, categoriesByTokenMap);
  ///          categoryTokenToAllAncestorTokens.set(categoryToken, ancestors);
  ///        }
  ///        ancestors.forEach(categoryToken => {
  ///          let models : Set<TtsModelListItem> = categoriesToTtsModelTokens.get(categoryToken);
  ///          if (models === undefined) {
  ///            models = new Set();
  ///            categoriesToTtsModelTokens.set(categoryToken, models);
  ///          }
  ///          models.add(ttsModel);
  ///        })
  ///      });
  ///    });
  ///    setTtsModelsByCategoryToken(categoriesToTtsModelTokens);

  //   const nestedCategoryTokenToModelTokensMap: Map<
  //     string,
  //     Set<string>
  //   > = computedTtsCategoryAssignments?.category_token_to_tts_model_tokens
  //     .recursive || new Map();

  //   let categoriesToTtsModelTokens = new Map();

  //   nestedCategoryTokenToModelTokensMap.forEach(
  //     (ttsModelTokens, categoryToken) => {
  //       ttsModelTokens.forEach(ttsModelToken => {
  //         let ttsModel = ttsModelsByTokenMap.get(ttsModelToken);
  //         if (ttsModel === undefined) {
  //           return;
  //         }
  //         let models: Set<TtsModelListItem> =
  //           categoriesToTtsModelTokens.get(categoryToken);
  //         if (models === undefined) {
  //           models = new Set();
  //           categoriesToTtsModelTokens.set(categoryToken, models);
  //         }
  //         models.add(ttsModel);
  //       });
  //     }
  //   );

  //   setTtsModelsByCategoryToken(categoriesToTtsModelTokens);
  // }, [allTtsCategories, allTtsModels, computedTtsCategoryAssignments]);

  return (
    <App
    // enableSpectrograms={props.enableSpectrograms}
    // flashVocodesNotice={props.flashVocodesNotice}
    // allTtsCategories={allTtsCategories}
    // setAllTtsCategories={setAllTtsCategories}
    // allTtsModels={allTtsModels}
    // setAllTtsModels={setAllTtsModels}
    // computedTtsCategoryAssignments={computedTtsCategoryAssignments}
    // setComputedTtsCategoryAssignments={setComputedTtsCategoryAssignments}
    // allTtsCategoriesByTokenMap={allCategoriesByTokenMap}
    // allTtsModelsByTokenMap={allTtsModelsByTokenMap}
    // ttsModelsByCategoryToken={ttsModelsByCategoryToken}
    // dropdownCategories={dropdownCategories}
    // setDropdownCategories={setDropdownCategories}
    // selectedCategories={selectedCategories}
    // setSelectedCategories={setSelectedCategories}
    // maybeSelectedTtsModel={maybeSelectedTtsModel}
    // setMaybeSelectedTtsModel={setMaybeSelectedTtsModel}
    // selectedTtsLanguageScope={selectedTtsLanguageScope}
    // setSelectedTtsLanguageScope={setSelectedTtsLanguageScope}
    />
  );
}

///  NB: This was the really expensive cubic time++ aglorithm to recursively calculate nested category assignments.
///   This has since been ported to the server and will no longer be computed here. We're preserving this for posterity.
///
/// function findAllAncestorTokens(categoryToken: string, allCategoriesByTokenMap: Map<string, TtsCategory>): Set<string> {
///   const ancestorTokens = recursiveFindAllAncestorTokens(categoryToken, allCategoriesByTokenMap);
///   return new Set(ancestorTokens);
/// }
///
/// function recursiveFindAllAncestorTokens(categoryToken: string, allCategoriesByTokenMap: Map<string, TtsCategory>): string[] {
///   let category = allCategoriesByTokenMap.get(categoryToken)
///   if (category === undefined) {
///     return [];
///   }
///   if (!category.maybe_super_category_token) {
///     return [categoryToken];
///   }
///   return [
///     ...recursiveFindAllAncestorTokens(category.maybe_super_category_token, allCategoriesByTokenMap),
///     categoryToken,
///   ];
/// }

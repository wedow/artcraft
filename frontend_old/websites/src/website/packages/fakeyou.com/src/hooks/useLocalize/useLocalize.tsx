import { t as oldT } from "i18next";
import { useTranslation } from "react-i18next";
import { i18n2 } from "App";

export default function useLocalize(nameSpace: string) {
  const { t, i18n } = useTranslation(nameSpace, {
    i18n: i18n2,
    useSuspense: false,
  });

  return {
    oldT,
    t,
    language: i18n.language,
  };
}

import { useSignals } from "@preact/signals-react/runtime";
import { PageEditor } from "~/pages/PageEnigma/PageEditor";
import { PageStyling } from "~/pages/PageEnigma/PageStyling";
import { currentPage } from "~/signals";
import { Pages } from "~/pages/PageEnigma/constants/page";

export const PageEnigmaComponent = () => {
  useSignals();

  return (
    <>
      <div className={currentPage.value === Pages.EDIT ? "visible" : "hidden"}>
        <PageEditor />
      </div>
      <div className={currentPage.value === Pages.STYLE ? "visible" : "hidden"}>
        <PageStyling />
      </div>
    </>
  );
};

import { useSignals } from "@preact/signals-react/runtime";
import { PageEditor } from "~/pages/PageEnigma/PageEditor";

// TODO: Remove these file
import { currentPage } from "~/signals";
import { Pages } from "~/pages/PageEnigma/constants/page";

export const PageEnigmaComponent = () => {
  useSignals();
  return (
    <>
      <PageEditor />
    </>
  );
};

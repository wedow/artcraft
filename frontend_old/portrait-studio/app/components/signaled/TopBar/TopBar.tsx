import { useLocation, useParams } from "@remix-run/react";
import { faChevronLeft } from "@fortawesome/pro-solid-svg-icons";
import { ButtonLink } from "~/components";
import { AuthButtons } from "./AuthButtons";
import { SceneTitleInput } from "./SceneTitleInput";
import { getCurrentLocationWithoutParams } from "~/utilities";

function isEditorPath(path: string) {
  if (path === "/") return true;
  if (path === "/idealenigma/") return true;
  return false;
}
interface Props {
  pageName: string;
}

export const TopBar = ({ pageName }: Props) => {
  const currentLocation = getCurrentLocationWithoutParams(
    useLocation().pathname,
    useParams(),
  );

  return (
    <header className="fixed left-0 top-0 z-30 w-full border-b border-ui-panel-border bg-ui-background">
      <nav
        className="mx-auto grid h-[56px] w-screen grid-cols-2 items-center justify-between px-3"
        aria-label="Global"
      >
        <div className="flex gap-4">
          <a href="/" className="">
            <span className="sr-only">Storyteller.ai</span>
            <img
              className="h-[36px] w-auto pb-[3px]"
              src="/resources/images/Storyteller-Logo-1.png"
              alt="Logo StoryTeller.ai"
            />
          </a>
          {!isEditorPath(currentLocation) && (
            <ButtonLink to={"/"} variant="secondary" icon={faChevronLeft}>
              Back to Editor
            </ButtonLink>
          )}

          <SceneTitleInput pageName={pageName} />
        </div>

        <div className="flex justify-end gap-2.5">
          {/* <MyMoviesButton /> */}
          <div className="flex justify-end gap-2">
            <AuthButtons />
          </div>
        </div>
      </nav>
    </header>
  );
};

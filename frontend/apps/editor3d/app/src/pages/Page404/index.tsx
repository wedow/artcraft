import { faChevronLeft } from "@fortawesome/pro-solid-svg-icons";
import { P, H1 } from "~/components";
import { json } from "react-router-dom";
import { ButtonLink } from "@storyteller/ui-button-link";

export const loader = () => {
  return json(null, { status: 404 });
};

export const Page404 = () => {
  return (
    <div
      className="fixed w-full overflow-scroll"
      style={{ height: "calc(100% - 72px)" }}
    >
      <div className="mx-auto my-24 flex h-1/2 w-10/12 max-w-7xl flex-col items-center justify-center gap-8 rounded-lg bg-ui-panel p-6 text-center">
        <P>Oops, seems like this is not a page that exists!</P>
        <H1>Server Error: 404</H1>

        <ButtonLink to="/" icon={faChevronLeft}>
          Back to Dashboard
        </ButtonLink>
      </div>
    </div>
  );
};
export default Page404;

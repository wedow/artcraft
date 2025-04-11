import { faChevronLeft } from "@fortawesome/pro-solid-svg-icons";
import { P, H1, ButtonLink } from "~/components";
import { json } from "@remix-run/router";

export const loader = () => {
  return json(null, { status: 404 });
};

export const Page404 = () => {
  return(
    <div
    className="fixed w-full overflow-scroll"
    style={{height: "calc(100% - 72px)"}}
    >
      <div
        className='bg-ui-panel w-10/12 max-w-7xl h-1/2 mx-auto my-24 rounded-lg p-6 flex flex-col items-center justify-center gap-8 text-center'
      >
        <P>Oops, seems like this is not a page that exists!</P>
        <H1>Server Error: 404</H1>

        <ButtonLink to="/" icon={faChevronLeft}>Back to Dashboard</ButtonLink>
      </div>
    </div>
  );
};
export default Page404;

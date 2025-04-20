import { useSignals } from "@preact/signals-react/runtime";
import {
  currentStep,
  showWizard,
} from "~/pages/PageEnigma/Wizard/signals/wizard";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/pro-solid-svg-icons";
import { Fragment } from "react";

export const MainPage = () => {
  useSignals();
  const step = currentStep.value;

  return (
    <div>
      <div className="mb-3 font-bold">How would you like to start?</div>
      <div className="flex gap-5">
        {(step?.options ?? []).map((option) => (
          <Fragment key={option.value}>
            {option.label === "Remix" && (
              <button
                className={twMerge(
                  "group relative flex h-[249px] w-full flex-col items-center rounded-lg border border-white/5 bg-brand-secondary/50 px-2 pt-[58px] transition-all duration-150 hover:border-brand-primary hover:bg-brand-primary/20",
                )}
                onClick={() => (showWizard.value = option.value as string)}
              >
                <svg
                  width="36"
                  height="33"
                  viewBox="0 0 36 33"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.74336 8.12213C14.2972 3.56828 21.6551 3.54632 26.2382 8.04892L23.2219 11.058C22.7167 11.5631 22.5703 12.3172 22.8412 12.9762C23.112 13.6351 23.7563 14.0597 24.4665 14.0597H33.2154H33.8377C34.8115 14.0597 35.5949 13.2763 35.5949 12.3026V2.93133C35.5949 2.22117 35.1702 1.57689 34.5113 1.306C33.8524 1.03512 33.0983 1.18154 32.5931 1.68671L29.5475 4.73237C23.134 -1.60055 12.8037 -1.57859 6.42681 4.80558C4.64042 6.59198 3.35187 8.69319 2.56117 10.9408C2.12921 12.1635 2.77349 13.496 3.98882 13.9279C5.20416 14.3599 6.54396 13.7156 6.97591 12.5003C7.53965 10.9042 8.45481 9.40336 9.74336 8.12213ZM0.452637 20.5024V21.0589V21.1101V29.8737C0.452637 30.5839 0.877272 31.2281 1.53619 31.499C2.19511 31.7699 2.9492 31.6235 3.45437 31.1183L6.50003 28.0727C12.9135 34.4056 23.2438 34.3836 29.6207 27.9995C31.4071 26.2131 32.7029 24.1118 33.4936 21.8715C33.9256 20.6489 33.2813 19.3164 32.066 18.8844C30.8507 18.4525 29.5109 19.0968 29.0789 20.3121C28.5152 21.9081 27.6 23.409 26.3115 24.6902C21.7576 29.2441 14.3997 29.266 9.81658 24.7634L12.8256 21.7471C13.3308 21.2419 13.4772 20.4878 13.2063 19.8289C12.9354 19.17 12.2912 18.7453 11.581 18.7453H2.82474H2.77349H2.20975C1.23602 18.7453 0.452637 19.5287 0.452637 20.5024Z"
                    fill="white"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M17.9759 11.2148C18.6202 11.2148 19.1414 11.7361 19.1414 12.3803V14.956H21.717C22.3613 14.956 22.8825 15.4772 22.8825 16.1214C22.8825 16.7657 22.3613 17.2869 21.717 17.2869H19.1414V19.8625C19.1414 20.5068 18.6202 21.028 17.9759 21.028C17.3317 21.028 16.8104 20.5068 16.8104 19.8625V17.2869H14.2348C13.5906 17.2869 13.0693 16.7657 13.0693 16.1214C13.0693 15.4772 13.5906 14.956 14.2348 14.956H16.8104V12.3803C16.8104 11.7361 17.3317 11.2148 17.9759 11.2148Z"
                    fill="white"
                  />
                </svg>
                <div className="mt-4 text-xl font-bold">Remix</div>
                <div className="mt-4 px-8 text-sm text-white/70">
                  Create a scene from an existing scene
                </div>
                <div className="absolute bottom-[8px] right-[12px] text-lg text-white opacity-50 group-hover:opacity-100">
                  <FontAwesomeIcon icon={faArrowRight} />
                </div>
              </button>
            )}

            {option.label === "Blank Scene" && (
              <button
                className={twMerge(
                  "group relative flex h-[249px] w-full flex-col items-center rounded-lg border border-white/5 bg-brand-secondary/50 px-2 pt-[58px] transition-all duration-150 hover:border-brand-primary hover:bg-brand-primary/20",
                )}
                onClick={() => (showWizard.value = option.value as string)}
              >
                <svg
                  width="26"
                  height="34"
                  viewBox="0 0 26 34"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.494629 4.18421C0.494629 1.87636 2.32929 0 4.58586 0H14.8139V8.36842C14.8139 9.52562 15.7281 10.4605 16.8595 10.4605H25.042V29.2895C25.042 31.5973 23.2073 33.4737 20.9508 33.4737H4.58586C2.32929 33.4737 0.494629 31.5973 0.494629 29.2895V4.18421ZM25.042 8.36842H16.8595V0L25.042 8.36842Z"
                    fill="white"
                  />
                </svg>
                <div className="mt-4 text-xl font-bold">Blank Scene</div>
                <div className="mt-4 px-8 text-sm text-white/70">
                  If you’re already familiar with Storyteller Studio.
                </div>
                <div className="absolute bottom-[8px] right-[12px] text-lg text-white opacity-50 group-hover:opacity-100">
                  <FontAwesomeIcon icon={faArrowRight} />
                </div>
              </button>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};

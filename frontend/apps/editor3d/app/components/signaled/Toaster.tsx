import { useSignals } from "@preact/signals-react/runtime";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHexagonXmark,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { ToastTypes } from "~/enums";
import { toasts, deleteToast } from "~/signals";
import { useEffect, useRef, useState } from "react";

export type ToastDataType = {
  type: ToastTypes;
  message: string;
};

export const Toaster = () => {
  useSignals();
  const TITLES = {
    [ToastTypes.ERROR]: "Error!",
    [ToastTypes.WARNING]: "Warning!",
    [ToastTypes.SUCCESS]: "Success",
  };

  const ICONS: Record<string, React.ReactNode> = {
    error: <FontAwesomeIcon icon={faHexagonXmark} className="text-[#FF5F5F]" />,
    warning: (
      <FontAwesomeIcon
        icon={faTriangleExclamation}
        className="text-[#FFDC5F]"
      />
    ),
    success: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        className="h-4 w-4"
      >
        <path
          opacity="1"
          d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
          fill="#3ACA86"
        />
        <path
          d="M369 175c-9.4 9.4-9.4 24.6 0 33.9L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0z"
          fill="#FFFFFF"
        />
      </svg>
    ),
  };

  const toastTypeToKey: Record<ToastTypes, string> = {
    [ToastTypes.ERROR]: "error",
    [ToastTypes.WARNING]: "warning",
    [ToastTypes.SUCCESS]: "success",
  };

  const toastRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [heights, setHeights] = useState<number[]>([]);

  useEffect(() => {
    const newHeights = toastRefs.current.map((ref) => ref?.offsetHeight || 0);
    setHeights(newHeights);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toasts.value]);

  return (
    <>
      {toasts.value.map((toast, index) => (
        <div
          key={toast.id}
          ref={(el) => (toastRefs.current[index] = el)}
          className="absolute z-50 w-[360px] animate-fadeIn rounded-lg border border-[#5E5E7C] bg-ui-controls p-3 shadow-xl"
          style={{
            top: heights
              .slice(0, index)
              .reduce((acc, height) => acc + height + 8, 52),
            right: 8,
          }}
        >
          <div className="flex justify-between rounded-lg">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {ICONS[toastTypeToKey[toast.type]]}
                <div className="text-base font-bold text-white">
                  {TITLES[toast.type]}
                </div>
              </div>
              <div className="text-left text-sm text-white opacity-75">
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => deleteToast(toast.id)}
              className="ml-4 text-xl font-bold text-white opacity-50"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>
      ))}
    </>
  );
};

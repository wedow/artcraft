import { P, H3 } from "~/components";
import { FilterEngineCategories } from "~/enums";
import {
  Button
} from "@storyteller/ui-button"
interface Props {
  onCancel: () => void;
  onRetry: () => void;
  type: FilterEngineCategories | string;
  errorMessage?: string;
}

export const UploadAssetError = ({
  onCancel,
  onRetry,
  type,
  errorMessage,
}: Props) => {
  return (
    <>
      <H3>Error in Uploading {type}</H3>
      <P>{errorMessage ?? "Unknown Error"}</P>
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button onClick={onRetry} variant="primary">
          Try again
        </Button>
      </div>
    </>
  );
};

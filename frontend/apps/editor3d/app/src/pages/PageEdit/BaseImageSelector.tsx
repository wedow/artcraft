import { faImage } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export type BaseImageSelectorProps = {
  onImageSelect: (imageUrl: string) => void;
}

const BaseImageSelector = ({
  onImageSelect
}: BaseImageSelectorProps) => {

  return (
    <div className="flex items-center justify-center bg-ui-panel border-ui-panel-border border-4">
      <FontAwesomeIcon icon={faImage} className="text-6xl text-ui-text-secondary" />
      <span className="text-ui-text-secondary text-lg ml-2">Click to upload or drag and drop an image here to edit</span>
      <div className="mt-4">
      </div>
    </div>
  )
}

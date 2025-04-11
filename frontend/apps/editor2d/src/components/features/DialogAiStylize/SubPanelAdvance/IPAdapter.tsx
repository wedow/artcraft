import { useEffect, useState, useCallback, useRef } from "react";
import { FileUploader } from "react-drag-drop-files";
import Cropper, { Point, Area } from "react-easy-crop";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileImage, faXmark } from "@fortawesome/pro-solid-svg-icons";

import { Button } from "~/components/ui";
import getCroppedImg, {
  base64ToFile,
  uploadIPA,
  fetchIPAUrl,
} from "./utilities";

type Crop = {
  location: Point;
  zoom: number;
  cropArea?: Area;
  croppedAreaPixels?: Area;
};
type State = {
  ipaUrl?: string;
  imageFileString?: string;
  crop: Crop;
};

const initialCrop = {
  location: { x: 0, y: 0 },
  zoom: 1,
};

export const IPAdapter = ({
  ipaToken,
  onUploadedIPA,
}: {
  ipaToken?: string;
  onUploadedIPA: (newIpaToken: string) => void;
}) => {
  const FILE_TYPES = ["JPG", "PNG", "JPEG"];
  const [state, setState] = useState<State>({
    crop: initialCrop,
  });
  const { imageFileString, ipaUrl, crop } = state;

  const prevIpaToken = useRef<string | undefined>();

  useEffect(() => {
    const setIpaUrl = async () => {
      if (ipaToken && ipaToken !== prevIpaToken.current) {
        const ipaUrl = await fetchIPAUrl(ipaToken);
        setState((curr) => ({ ...curr, ipaUrl }));
      }
    };
    setIpaUrl();
  }, [ipaToken]);

  // this loads the file from drag-and-drop file uploader
  // turn it into a string for the react-image-crop to use
  const onFileChange = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setState((curr) => {
        return {
          ...curr,
          imageFileString: reader.result as string,
        };
      });
    };
    reader.readAsDataURL(file);
  }, []);

  // handler for react-image-crop's completion
  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    console.log("on CROP COMPLETE", croppedArea, croppedAreaPixels);
    setState((curr) => ({
      ...curr,
      crop: {
        ...curr.crop,
        cropArea: croppedArea,
        croppedAreaPixels: croppedAreaPixels,
      },
    }));
  };

  const onSaveCrop = async () => {
    if (!crop.croppedAreaPixels || !imageFileString) {
      console.error("Error: do not have the assets for saving a cropped image");
      setState({ crop: initialCrop }); // complete reset
      return;
    }
    const croppedImageUrl = await getCroppedImg(
      imageFileString,
      crop.croppedAreaPixels,
    );
    if (!croppedImageUrl) {
      console.error("Error: failed to crop image");
      setState({ crop: initialCrop }); // complete reset
      return;
    }
    // converts base64 cropped image into a file for upload
    const croppedImageFile = base64ToFile(croppedImageUrl, "cropped-image.jpg");
    const ipaToken = await uploadIPA(croppedImageFile);
    if (ipaToken) {
      onUploadedIPA(ipaToken);
    }
  };

  const onDeleteImage = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setState({ crop: initialCrop });
  };

  const DragAndDropZone = () => {
    return (
      <div className="border-ui-controls-button/50 bg-brand-secondary hover:bg-ui-controls-button/40 flex cursor-pointer items-center gap-3.5 rounded-lg border-2 border-dashed p-3 transition-all duration-150">
        <FontAwesomeIcon icon={faFileImage} className="text-3xl" />
        <div className="flex flex-col gap-0 text-sm">
          <p className="font-medium">
            <u>Upload an image</u> or drop it here
          </p>
          <p className="flex items-center gap-2 text-sm font-normal opacity-50">
            {FILE_TYPES.join(", ").toString()} supported
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h4>IP Adapter</h4>
        Additional Style Reference Image{" "}
        <span className="text-xs font-normal">(Optional)</span>
      </div>

      {!imageFileString &&
        !ipaUrl && ( //case of no file
          <FileUploader
            handleChange={onFileChange}
            name="file"
            types={FILE_TYPES}
          >
            <DragAndDropZone />
          </FileUploader>
        )}

      {imageFileString &&
        !ipaUrl && ( // file staged for cropping
          <div
            title="Crop Reference Image"
            className="flex grow flex-col gap-4"
          >
            <div className="relative w-full grow">
              <div className="absolute h-full w-full overflow-scroll rounded bg-black/25">
                <Cropper
                  image={imageFileString}
                  crop={crop.location}
                  zoom={crop.zoom}
                  aspect={1}
                  onCropChange={(newCropLocation) => {
                    setState((curr) => ({
                      ...curr,
                      crop: {
                        ...curr.crop,
                        location: newCropLocation,
                      },
                    }));
                  }}
                  onCropComplete={onCropComplete}
                  onZoomChange={(newZoom) => {
                    setState((curr) => ({
                      ...curr,
                      zoom: newZoom,
                    }));
                  }}
                />
              </div>
            </div>

            <div className="flex justify-center gap-2">
              <Button
                onClick={() => {
                  setState((curr) => ({
                    ...curr,
                    crop: initialCrop,
                    imageFileString: undefined,
                  }));
                }}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button onClick={onSaveCrop} variant="primary">
                Confirm
              </Button>
            </div>
          </div>
        )}

      {ipaUrl && ( //case of having ipaFileUrl
        <div className="relative">
          <FileUploader
            handleChange={onFileChange}
            name="file"
            types={FILE_TYPES}
          >
            <div className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-white/10 bg-black/25">
              <img
                src={ipaUrl}
                alt="IPAdapter"
                className="object-contain"
                crossOrigin="anonymous"
              />
            </div>
          </FileUploader>
          <Button
            className="text-md absolute right-2 top-2 z-10 h-6 w-6 rounded-full font-medium hover:bg-primary"
            onClick={onDeleteImage}
            icon={faXmark}
            variant="action"
          />
        </div>
      )}
    </div>
  );
};

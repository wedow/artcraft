import { AIStylizeProps } from "../utilities";
import { Switch } from "~/components/ui";

export const StyleOptionSwitches = ({
  faceDetail,
  upscale,
  lipSync,
  cinematic,
  enginePreProcessing,
  onStylizeOptionsChanged,
}: {
  cinematic: boolean;
  enginePreProcessing: boolean;
  faceDetail: boolean;
  lipSync: boolean;
  upscale: boolean;
  onStylizeOptionsChanged: (newOptions: Partial<AIStylizeProps>) => void;
}) => {
  const handleCinematicChange = () => {
    onStylizeOptionsChanged({
      cinematic: !cinematic,
      upscale: !cinematic === true ? false : upscale,
    });
  };

  const enginePreProcessingChange = () => {
    onStylizeOptionsChanged({
      enginePreProcessing: !enginePreProcessing,
    });
  };

  const handleUpscaleChange = () => {
    onStylizeOptionsChanged({
      upscale: !upscale,
      cinematic: !upscale === true ? false : cinematic,
    });
  };

  const handleLipsyncChange = () => {
    onStylizeOptionsChanged({
      lipSync: !lipSync,
    });
  };

  const handleFaceDetailerChange = () => {
    onStylizeOptionsChanged({
      faceDetail: !faceDetail,
    });
  };

  return (
    <div className="flex w-full flex-col gap-4 rounded-b-lg bg-ui-panel">
      <Switch
        checked={lipSync}
        label="Sync Lips with Speech"
        onChange={handleLipsyncChange}
      />
      <Switch
        checked={faceDetail}
        label="Face Detailer"
        onChange={handleFaceDetailerChange}
      />
      <Switch
        disabled={cinematic ? "semi" : false}
        checked={upscale}
        label="Upscale"
        onChange={handleUpscaleChange}
      />
      <Switch
        disabled={upscale ? "semi" : false}
        checked={cinematic}
        label="Use Cinematic"
        onChange={handleCinematicChange}
      />
      <Switch
        checked={enginePreProcessing}
        label="Engine Preprocessing"
        onChange={enginePreProcessingChange}
      />
    </div>
  );
};

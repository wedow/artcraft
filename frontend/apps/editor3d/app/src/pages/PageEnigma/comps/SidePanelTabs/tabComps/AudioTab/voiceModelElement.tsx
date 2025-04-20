import { Weight } from "~/models";
import { H4, H6 } from "~/components";

export const VoiceModelElement = ({
  model,
  onSelect,
}: {
  model: Weight;
  onSelect: (item: Weight) => void;
}) => {
  const creatorName = model.creator.display_name;

  return (
    <button
      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent bg-brand-secondary p-3 text-start transition-all hover:border-ui-controls-button hover:bg-ui-controls-button/40"
      onClick={() => onSelect(model)}
    >
      <span className="h-12 w-12 rounded-lg bg-white/10" />
      <div className="grow">
        <H4>{model.title}</H4>
        {creatorName && <H6 className="text-white/70">{creatorName}</H6>}
      </div>
    </button>
  );
};

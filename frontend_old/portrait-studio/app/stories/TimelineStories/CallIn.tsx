import { parseQueueData } from "./parseQueueData";

export const CallIn = ({ values }: any) => {
  return (
    <div className="text-black">
      <div>
        <strong>Call Parameters</strong>
      </div>
      <div className="h-[210px] w-[200px] overflow-auto">
        Params: {parseQueueData(values, 1)}
      </div>
    </div>
  );
};

import { Timeline } from "~/pages/PageEnigma/comps/Timeline";
import { QueueIn } from "~/stories/TimelineStories/QueueIn";
import { QueueOut } from "~/stories/TimelineStories/QueueOut";
import { EngineActions } from "~/stories/TimelineStories/EngineActions";
import { DnDActions } from "~/stories/TimelineStories/DnDActions";
import { useState } from "react";

export const RenderStoryContent = () => {
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="text-black">
      <div>All length and offsets are in frames.</div>
      <div className="flex gap-4">
        <EngineActions
          setRefresh={() => setRefresh((count) => (count + 1) % 10000)}
        />
        <QueueIn refresh={refresh} />
        <QueueOut refresh={refresh} />
        <DnDActions
          setRefresh={() => setRefresh((count) => (count + 1) % 10000)}
        />
        <Timeline />
      </div>
    </div>
  );
};

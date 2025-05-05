import { useSignals } from "@preact/signals-react/runtime";
import { faAngleLeft, faFilm, faPlus } from "@fortawesome/pro-solid-svg-icons";
import { Button, TopBar } from "~/components";
import { PreviewImages } from "~/pages/PageEnigma/comps/PreviewImages";
import { useContext, useState } from "react";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";
import { Pages } from "~/pages/PageEnigma/constants/page";
import { currentPage, pageWidth } from "~/signals";
import { ControlsVideo } from "~/pages/PageEnigma/comps/ControlsVideo";
import { StylizeTabPages } from "~/pages/PageEnigma/enums";
import { generateProgress, selectedArtStyle } from "~/pages/PageEnigma/signals";
import { StyleSelectionButton } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/StylizeTab/StyleSelectionButton";
import { styleList } from "~/pages/PageEnigma/styleList";
import { Prompts } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/StylizeTab/Prompts";
import { StyleStrength } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/StylizeTab/StyleStrength";
import { IPAdapter } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/StylizeTab/IPAdapter";
import { StyleSelection } from "~/pages/PageEnigma/comps/StyleSelection";
import { StyleMoreOptions } from "~/pages/PageEnigma/comps/StyleMoreOptions/StyleMoreOptions";
import Queue, { QueueNames } from "~/pages/PageEnigma/Queue";
import { toTimelineActions } from "~/pages/PageEnigma/Queue/toTimelineActions";

export const PageStyling = () => {
  useSignals();
  const editorEngine = useContext(EngineContext);
  const [view, setView] = useState(StylizeTabPages.MAIN);

  const currentStyle = styleList.find(
    (style) => style.type === selectedArtStyle.value,
  );

  const generateMovie = async () => {
    console.log("generate");
    // await editorEngine?.generateVideo();
    generateProgress.value = 0;
    // temp
    let percent = 0;
    const timer = setInterval(() => {
      percent += 2;
      console.log("gen", percent);
      Queue.publish({
        queueName: QueueNames.TO_TIMELINE,
        action: toTimelineActions.GENERATE_PROGRESS,
        data: { currentTime: percent },
      });
      if (percent >= 100) {
        generateProgress.value = -1;
        clearInterval(timer);
      }
    }, 500);
  };

  const switchEdit = () => {
    editorEngine?.switchEdit();
    currentPage.value = Pages.EDIT;
  };

  const overlayWidth = (pageWidth.value * (100 - generateProgress.value)) / 100;
  const overlayOffset = pageWidth.value - overlayWidth;

  return (
    <div className="h-screen w-screen">
      <TopBar pageName="Stylization" />
      <div className="mt-4 flex flex-col items-center gap-6">
        <PreviewImages />
      </div>
      <div className="relative h-full">
        <div className="mt-4">
          <ControlsVideo />
        </div>
        {/* <div className="relative h-[120px] w-full overflow-hidden bg-ui-panel">
          <LowerPanel>
            <Timeline />
          </LowerPanel>
        </div> */}
        <div className="flex h-full justify-center gap-8 bg-ui-panel pt-4">
          <div className="relative flex w-[292px] flex-col gap-4">
            <div className="absolute -left-[140px] top-[90px] flex flex-col justify-center">
              <Button variant="action" onClick={switchEdit} icon={faAngleLeft}>
                Edit Scene
              </Button>
            </div>
            <StyleSelectionButton
              onClick={() => setView(StylizeTabPages.STYLE_SELECTION)}
              selectedStyle={selectedArtStyle.value}
              label={currentStyle?.label || "Select a Style"}
              imageSrc={
                currentStyle?.image ||
                "/resources/placeholders/style_placeholder.png"
              }
            />
            <IPAdapter />
          </div>
          <div className="flex w-[292px] flex-col gap-4">
            <Prompts />
          </div>
          <div className="flex w-[292px] flex-col gap-4">
            <StyleStrength />
            <Button
              icon={faPlus}
              variant="action"
              onClick={() => setView(StylizeTabPages.MORE_OPTIONS)}
            >
              More Options
            </Button>
            <Button
              icon={faFilm}
              variant="primary"
              onClick={generateMovie}
              className="h-12"
            >
              Generate Movie
            </Button>
          </div>
        </div>
        {generateProgress.value > -1 && (
          <>
            <div className="absolute inset-0 h-full w-screen bg-gray-200 opacity-25" />
            <div
              className="absolute top-0 h-full bg-gray-200 opacity-25"
              style={{ width: overlayWidth, left: overlayOffset }}
            />
          </>
        )}
      </div>
      {view === StylizeTabPages.STYLE_SELECTION && (
        <StyleSelection
          onClose={() => {
            setView(StylizeTabPages.MAIN);
          }}
        />
      )}
      {view === StylizeTabPages.MORE_OPTIONS && (
        <StyleMoreOptions onClose={() => setView(StylizeTabPages.MAIN)} />
      )}
    </div>
  );
};

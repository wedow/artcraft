import { TabTitle } from "~/pages/PageEnigma/comps/SidePanelTabs/sharedComps/TabTitle";
import { PageStyleSelection } from "./PageStyleSelection";
import { Prompts } from "./Prompts";
import { useSignals, useSignalEffect } from "@preact/signals-react/runtime";
import { useState } from "react";
import { ArtStyle } from "~/pages/PageEnigma/Editor/api_manager";
import { styleList } from "~/pages/PageEnigma/styleList";
import { EditorStates, StylizeTabPages } from "~/pages/PageEnigma/enums";
import { StyleSelectionButton } from "./StyleSelectionButton";
import { GenerateMovieButton } from "./GenerateMovieButton";
import { editorState } from "~/pages/PageEnigma/signals/engine";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
// import { IPAdapter } from "./IPAdapter";
import {
  selectedArtStyle,
  setArtStyleSelection,
} from "~/pages/PageEnigma/signals";
// import { StyleOptions } from "./StyleOptions";
import { StyleStrength } from "./StyleStrength";

interface StylizeTabProps {
  isStylizeSidePanel?: boolean;
}

export function StylizeTab({ isStylizeSidePanel }: StylizeTabProps) {
  useSignals();

  const [view, setView] = useState(StylizeTabPages.MAIN);
  const [generateSectionHeight, setGenerateSectionHeight] = useState(114);

  const currentStyle = styleList.find(
    (style) => style.type === selectedArtStyle.value,
  );

  const handleSelectStyle = (newSelection: ArtStyle) => {
    setArtStyleSelection(newSelection);
    // setSelection(newSelection);
    setView(StylizeTabPages.MAIN);
  };

  if (view === StylizeTabPages.STYLE_SELECTION) {
    return (
      <PageStyleSelection
        selection={selectedArtStyle.value}
        setSelection={handleSelectStyle}
        changePage={setView}
      />
    );
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <TabTitle
        title="Generate Your Image with AI"
        isStylizeSidePanel={isStylizeSidePanel}
        showCloseButton={false}
        className="pt-1"
      />
      <div
        className="mt-4 flex w-full flex-col gap-3 overflow-y-auto overflow-x-hidden px-5 pb-2"
        style={{ marginBottom: `${generateSectionHeight}px` }}
      >
        <StyleSelectionButton
          onClick={() => setView(StylizeTabPages.STYLE_SELECTION)}
          selectedStyle={selectedArtStyle.value}
          label={currentStyle?.label || "Select a Style"}
          imageSrc={
            currentStyle?.image ||
            "/resources/placeholders/style_placeholder.png"
          }
        />
        <Prompts />
        {/* <IPAdapter /> */}
        {/* <StyleOptions /> */}
        <StyleStrength />
      </div>
      <GenerateMovieButton
        setGenerateSectionHeight={setGenerateSectionHeight}
      />
    </div>
  );
}

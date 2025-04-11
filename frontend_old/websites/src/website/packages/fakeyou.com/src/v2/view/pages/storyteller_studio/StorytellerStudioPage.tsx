import React from "react";
import { SessionWrapper } from "@storyteller/components/src/session/SessionWrapper";
import { SessionSubscriptionsWrapper } from "@storyteller/components/src/session/SessionSubscriptionsWrapper";
import { StudioNotAvailable } from "v2/view/_common/StudioNotAvailable";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import { useParams } from "react-router-dom";
import Scene3D from "components/common/Scene3D/Scene3D";
import { EngineMode } from "components/common/Scene3D/EngineMode";
import { SplitFirstPeriod } from "utils/SplitFirstPeriod";

interface Props {
  sessionWrapper: SessionWrapper;
  sessionSubscriptionsWrapper: SessionSubscriptionsWrapper;
}

function StorytellerStudioListPage(props: Props) {
  // NB: The URL parameter might be a raw media token (for .scn.ron files), or it might 
  // have an appended suffix to assist the engine in loading the correct scene format. 
  // For example, this is a valid "mediaTokenSpec": `m_zk0qkm1tgsdbh6e3c9kedy34vaympd.glb`
  const { mediaToken : mediaTokenSpec } = useParams<{ mediaToken: string }>();

  const { base: mediaToken, maybeRemainder: maybeExtension } = SplitFirstPeriod(mediaTokenSpec);

  usePrefixedDocumentTitle("Storyteller Studio");

  if (!props.sessionWrapper.canAccessStudio()) {
    return <StudioNotAvailable />;
  }

  let assetDescriptor;

  // We should prefer to start the onboarding flow with an existing scene, but if 
  // one is unavailable, we should show the sample room.
  if (maybeExtension !== undefined) {
    assetDescriptor = {
      sceneImportToken: mediaToken,
      extension: maybeExtension,
    };
  } else if (mediaToken) {
    assetDescriptor = {
      storytellerSceneMediaFileToken: mediaToken,
    };
  } else {
    assetDescriptor = {
      objectId: "sample-room.gltf",
    };
  }

  return (
    <>
      <Scene3D
        fullScreen={true} 
        mode={EngineMode.Studio}
        asset={assetDescriptor}
      />
    </>
  );
}

export { StorytellerStudioListPage };

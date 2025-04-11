import React from "react";
import AudioCard from "./AudioCard";
import ImageCard from "./ImageCard";
import VideoCard from "./VideoCard";
import BVHCard from "./BVHCard";
import GLBCard from "./GLBCard";
import GLTFCard from "./GLTFCard";
import FBXCard from "./FBXCard";
import SceneRonCard from "./SceneRonCard";
import SceneJSONCard from "./SceneJSONCard";
import ArKitCard from "./ArKitCard";

interface Props {
  props: any;
  type: string;
}

export default function MediaCards({ props, type }: Props) {
  const keySuffix = props.data.token + "-" + props.page;

  switch (type) {
    case "audio":
    case "mp3":
    case "wav":
      return <AudioCard {...props} />;
    case "gif":
    case "jpg":
    case "png":
    case "image":
      return <ImageCard {...props} />;
    case "bvh":
      return <BVHCard {...props} />;
    case "glb":
      return <GLBCard {...props} />;
    case "gltf":
      return <GLTFCard {...props} />;
    case "fbx":
      return <FBXCard {...props} />;
    case "pmd":
      return <GLBCard {...{ ...props, labelOverride: "PMD" }} />;
    case "pmx":
      return <GLBCard {...{ ...props, labelOverride: "PMX" }} />;
    case "scene_ron":
      return <SceneRonCard {...props} />;
    case "scene_json":
      return <SceneJSONCard {...props} />;
    case "vmd":
      // TODO(bt,2024-05-09): This is a temporary hack. ARKit files are uploaded as these
      return <ArKitCard {...props} />;
    case "mp4":
    case "video":
      return <VideoCard {...props} key={`video-${keySuffix}`} />;
    default:
      return <div>Unsupported media type</div>;
  }
}

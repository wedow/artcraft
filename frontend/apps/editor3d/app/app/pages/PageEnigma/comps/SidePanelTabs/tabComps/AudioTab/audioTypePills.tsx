import { Pill } from "~/components";

export const AudioTypePill = ({
  category,
  children
}:{
  category?: string;
  children?:React.ReactNode;
}) => {
  function getCategoryColor(cate:string|undefined) {
    switch(cate){
      case "tts":
        return "bg-media-audio-tts";
      case "voice_conversion":
        return "bg-media-audio-v2v";
      case "upload":
        return "bg-media-audio-upload"
      case "demo":
        return "bg-media-audio-demo";
      default:
        return "bg-inference-error";
    }
  }

  function getCategoryText(cate:string|undefined) {
    switch(cate){
      case "tts":
        return "TTS";
      case "voice_conversion":
        return "V2V";
      case "upload":
        return "Upload"
      case "demo":
        return "Demo";
      default:
        return "Unknown Type"
    }
  }

  return(
    <Pill className={getCategoryColor(category)}>
      {children ? children : getCategoryText(category)}
    </Pill>
  )
}
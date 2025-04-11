import React from "react";
import { faVideo } from "@fortawesome/pro-solid-svg-icons";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import Countdown from "components/common/Countdown";
import FAQSection from "components/common/FAQSection";
//

const endDate = new Date("2024-11-18T12:00:00-04:00");

export default function CogVideo() {
  usePrefixedDocumentTitle("CogVideo Text and Image to Video Generation");

  return (
    <>
      <div
        style={{
          background: `url("/images/bg-svg.svg") no-repeat center center`,
          backgroundSize: "cover",
          width: "100%",
          height: "100vh",
        }}
      >
        <Countdown
          endDate={endDate}
          title="CogVideo"
          description="Text and Image to Video Generation"
          icon={faVideo}
        />
      </div>

      {/* <HowToUseSection title="How to Use F5-TTS" steps={howToUseSteps} /> */}

      <FAQSection faqItems={faqItems} className="mt-5 pt-5" />
    </>
  );
}

const faqItems = [
  {
    question: "What is CogVideo?",
    answer:
      "CogVideo is an AI model designed for generating videos from text and image inputs. Built using diffusion transformers, it creates short, coherent video sequences aligned with the provided prompts, making it a powerful tool for text-driven video content creation.",
  },
  {
    question: "How does CogVideo generate videos from text and images?",
    answer:
      "CogVideo leverages a 3D Variational Autoencoder (VAE) to compress videos along spatial and temporal dimensions, improving compression rates and maintaining video quality. It integrates an expert transformer with adaptive LayerNorm, enabling strong alignment between text and video for clear, coherent outputs.",
  },
  {
    question: "What makes CogVideo unique among video generation models?",
    answer:
      "CogVideo stands out due to its ability to generate videos with richer motion and improved text-video alignment. It employs techniques like multi-resolution frame packing, progressive training, and an effective text-video data processing pipeline, resulting in visually compelling videos with coherent narratives.",
  },
  {
    question: "What datasets are used to train CogVideo?",
    answer:
      "CogVideo utilizes a comprehensive text-video data processing pipeline that includes advanced preprocessing techniques and video captioning. This ensures that the generated videos maintain high quality and semantic alignment with the input text or image prompts.",
  },
  {
    question: "What are the primary use cases for CogVideo?",
    answer:
      "CogVideo is ideal for generating text-driven videos for advertising, storytelling, educational content, creative projects, and social media posts. Its capabilities in creating coherent, text-aligned videos make it versatile for various media and content production needs.",
  },
];

// const howToUseSteps = [
//   {
//     icon: faWaveformLines,
//     title: "Step 1: Upload Your Audio",
//     description:
//       "In the panel above, start by adding a reference audio, either record your own voice or upload an audio file. This audio will be used by F5-TTS to clone the voice, enabling the generation of speech that closely resembles the reference voice. For optimal results, ensure the audio is clear and of high quality.",
//   },
//   {
//     icon: faTextSize,
//     title: "Step 2: Enter Your Text",
//     description:
//       "Next, input the text you wish to convert into speech. This text will be synthesized using the voice from your reference audio, allowing you to create personalized audio content. Ensure your text is clear and concise for the best results.",
//   },
//   {
//     icon: faArrowDownToLine,
//     title: "Step 3: Generate and Save",
//     description: (
//       <>
//         With your audio and text prepared, click 'Generate Speech' to activate
//         F5-TTS and transform your text into lifelike speech. Once the process is
//         complete, you can listen to the synthesized audio directly in the output
//         panel above. If you're happy with the result, click the download button
//         to save the audio file and use it in your projects!
//       </>
//     ),
//   },
// ];

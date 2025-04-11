import React from "react";
import { faImagePolaroidUser } from "@fortawesome/pro-solid-svg-icons";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import Countdown from "components/common/Countdown";
import FAQSection from "components/common/FAQSection";
//

const endDate = new Date("2024-11-18T12:00:00-04:00");

export default function Hallo2() {
  usePrefixedDocumentTitle(
    "Hallo2 High-Resolution, Long-Duration Audio-Driven Portrait Animation"
  );

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
          title="Hallo2"
          description="High-Resolution, Long-Duration Audio-Driven Portrait Animation"
          icon={faImagePolaroidUser}
        />
      </div>

      {/* <HowToUseSection title="How to Use F5-TTS" steps={howToUseSteps} /> */}

      <FAQSection faqItems={faqItems} className="mt-5 pt-5" />
    </>
  );
}

const faqItems = [
  {
    question: "What is Hallo 2?",
    answer:
      "Hallo 2 is an advanced AI model designed for long-duration, high-resolution portrait animation driven by audio. Building on its predecessor, Hallo, this model can generate hour-long 4K portrait animations with improved visual consistency, temporal coherence, and rich control options, making it suitable for a wide range of creative applications.",
  },
  {
    question: "How does Hallo 2 achieve long-duration video generation?",
    answer:
      "Hallo 2 uses innovative techniques like patch-drop augmentation and Gaussian noise to maintain visual consistency and temporal coherence in long videos. By incorporating vector quantization of latent codes and temporal alignment strategies, it can produce seamless animations that extend up to tens of minutes without appearance drift or artifacts.",
  },
  {
    question:
      "What makes Hallo 2 different from other portrait animation tools?",
    answer:
      "Hallo 2 stands out for its ability to produce 4K resolution videos with extended duration. It also supports adjustable semantic labels, allowing users to control facial expressions and expressions beyond audio-driven cues. This makes it one of the most versatile and high-quality solutions for creating long and detailed animated portraits.",
  },
  {
    question: "What datasets are used to train Hallo 2?",
    answer:
      "Hallo 2 has been trained and tested on publicly available datasets, including HDTF, CelebV, and its introduced 'Wild' dataset. These datasets ensure that the model performs well in diverse conditions, generating realistic and controllable 4K portrait animations for different use cases.",
  },
  {
    question: "What are the main use cases for Hallo 2?",
    answer:
      "Hallo 2 is perfect for creating long-form, high-resolution animated portraits. It is suitable for use cases like creating digital avatars, virtual influencers, video dubbing, interactive storytelling, and even artistic projects that require detailed visual animations.",
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

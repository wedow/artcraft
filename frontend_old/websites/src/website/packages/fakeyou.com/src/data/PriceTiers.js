import { isVideoToolsEnabled } from "config/featureFlags";

const FAKEYOU_PRICES = {
  //Starter Tier
  starter: {
    internal_plan_key: {
      development: null,
      production: null,
    },
    tier: "Starter",
    price: 0,
    priority: {
      title: "Processing Priority",
      features: ["Slowest"],
    },
    tts: {
      title: "Text to Speech",
      features: ["Unlimited generation", "Up to 12 seconds audio"],
    },
    vc: {
      title: "Voice to Voice",
      features: ["Up to 3 minutes audio"],
    },
    // vcapp: {
    //   title: "VC App",
    //   features: [
    //     "5 model downloads",
    //     "Up to 12 secs prerecorded",
    //     "Up to 2 mins realtime",
    //   ],
    // },
    // w2l: {
    //   title: "Wav2Lip",
    //   features: ["Up to 12 seconds video"],
    // },
    lipsync: {
      title: "Lipsync",
      features: ["Access to Lipsync video generation"],
    },
    live_portrait: {
      title: "Live Portrait",
      features: ["Access to Live Portrait"],
    },
    style_transfer: {
      title: "Video Style Transfer",
      features: ["Access to Style Transfer", "3 second video generation"],
    },
  },

  //Plus Tier
  plus: {
    internal_plan_key: {
      development: "development_fakeyou_plus",
      production: "fakeyou_plus",
    },
    tier: "Plus",
    price: 7,
    priority: {
      title: "Processing Priority",
      features: ["Normal"],
    },
    tts: {
      title: "Text to Speech",
      features: ["Unlimited generation", "Up to 30 seconds audio"],
    },
    vc: {
      title: "Voice to Voice",
      features: ["Up to 4 minutes of audio"],
    },
    ads: {
      title: "Advertisements",
      features: ["Remove all ads"],
    },

    // vcweb: {
    //   title: "VC Web",
    //   features: ["Up to 30 seconds audio", "Push to play"],
    // },
    // vcapp: {
    //   title: "VC App",
    //   features: [
    //     "10 model downloads",
    //     "Up to 30 secs prerecorded",
    //     "Up to 7 mins realtime",
    //   ],
    // },
    // w2l: {
    //   title: "Wav2Lip",
    //   features: ["Up to 1 minute video"],
    // },

    ...(isVideoToolsEnabled()
      ? {
          lipsync: {
            title: "Lipsync",
            features: ["Access to Lipsync video generation"],
          },
          live_portrait: {
            title: "Live Portrait",
            features: ["Access to Live Portrait"],
          },
          style_transfer: {
            title: "Video Style Transfer",
            features: ["Access to Style Transfer", "3 second video generation"],
          },
        }
      : {}),
  },

  //Pro Tier
  pro: {
    internal_plan_key: {
      development: "development_fakeyou_pro",
      production: "fakeyou_pro",
    },
    tier: "Pro",
    price: 15,
    priority: {
      title: "Processing Priority",
      features: ["Faster"],
    },
    tts: {
      title: "Text to Speech",
      features: [
        "Unlimited generation",
        "Up to 1 minute audio",
        //"Generate MP3 file",
        "Upload private models",
      ],
    },
    vc: {
      title: "Voice to Voice",
      features: ["Up to 5 minutes of audio", "Upload private models"],
    },
    ads: {
      title: "Advertisements",
      features: ["Remove all ads"],
    },
    // channels: {
    //   title: "Video Channels",
    //   features: [
    //     "Ad-free (coming soon)",
    //     "Interactive features (coming soon)",
    //   ],
    // },
    // vcweb: {
    //   title: "VC Web",
    //   features: ["Up to 30 seconds audio", "Push to play", "Generate MP3 file"],
    // },
    // vcapp: {
    //   title: "VC App",
    //   features: [
    //     "20 model downloads",
    //     "Up to 5 mins prerecorded",
    //     "Up to 15 mins realtime",
    //   ],
    // },
    // w2l: {
    //   title: "Wav2Lip",
    //   features: ["Up to 2 minutes video"],
    // },
    ...(isVideoToolsEnabled()
      ? {
          lipsync: {
            title: "Lipsync",
            features: ["Access to Lipsync video generation"],
          },
          live_portrait: {
            title: "Live Portrait",
            features: [
              "Access to Live Portrait",
              "Private videos",
              "Watermark removal",
            ],
          },
          style_transfer: {
            title: "Video Style Transfer",
            features: [
              "Access to Style Transfer",
              "7 second video generation",
              "Private videos",
              "Watermark removal",
              "Faster/Higher quality renders",
            ],
          },
        }
      : {}),
    storyteller: {
      title: "High-Fidelity, Controllable Video Generation",
      features: ["Priority Beta Access to Storyteller Studio"],
    },
    api: {
      title: "API Access",
      features: ["Full API access"],
    },
  },

  //Elite Tier
  elite: {
    internal_plan_key: {
      development: "development_fakeyou_elite",
      production: "fakeyou_elite",
    },
    tier: "Elite",
    price: 25,
    priority: {
      title: "Processing Priority",
      features: ["Fastest"],
    },
    tts: {
      title: "Text to Speech",
      features: [
        "Unlimited generation",
        "Up to 2 minutes audio",
        //"Generate MP3 file",
        "Upload private models",
        "Share private models",
      ],
    },
    vc: {
      title: "Voice to Voice",
      features: [
        "Unlimited audio",
        "Upload private models",
        "Share private models",
      ],
    },
    ads: {
      title: "Advertisements",
      features: ["Remove all ads"],
    },
    // channels: {
    //   title: "Video Channels",
    //   features: [
    //     "Influence creative direction",
    //     "Ad-free (coming soon)",
    //     "Interactive features (coming soon)",
    //     "Build your own channel (coming soon)",
    //   ],
    // },
    // vcweb: {
    //   title: "VC Web",
    //   features: ["Up to 7 minutes audio", "Push to play", "Generate MP3 file"],
    // },
    // vcapp: {
    //   title: "VC App",
    //   features: [
    //     "Unlimited models",
    //     "Unlimited prerecorded",
    //     "Unlimited realtime",
    //   ],
    // },
    // w2l: {
    //   title: "Wav2Lip",
    //   features: ["Up to 2 minutes video"],
    // },
    ...(isVideoToolsEnabled()
      ? {
          lipsync: {
            title: "Lipsync",
            features: ["Access to Lipsync video generation"],
          },
          live_portrait: {
            title: "Live Portrait",
            features: [
              "Access to Live Portrait",
              "Private videos",
              "Watermark removal",
            ],
          },
          style_transfer: {
            title: "Video Style Transfer",
            features: [
              "Access to Style Transfer",
              "7 second video generation",
              "Private videos",
              "Watermark removal",
              "Faster/Higher quality renders",
            ],
          },
        }
      : {}),
    api: {
      title: "API Access",
      features: ["Full API access"],
    },
    commercial: {
      title: "Commercial Voices",
      features: ["FakeYou commercial voices"],
    },
    storyteller: {
      title: "High-Fidelity, Controllable Video Generation",
      features: ["Priority Beta Access to Storyteller Studio"],
    },
  },
};

export { FAKEYOU_PRICES };

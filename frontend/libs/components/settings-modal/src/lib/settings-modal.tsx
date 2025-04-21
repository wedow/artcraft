import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faVideo,
  faImage,
  faCog,
} from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { Input } from "@storyteller/ui-input";
import { Select, SelectValue } from "@storyteller/ui-select";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AccountInfo {
  username: string;
  subscription: string;
  credits: number;
}

type SettingsSection = "accounts" | "video" | "image" | "misc";

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [accountInfo] = useState<AccountInfo>({
    username: "Username [logout]",
    subscription: "Pro-tier [change/upgrade]",
    credits: 10233,
  });

  const [selectedSection, setSelectedSection] =
    useState<SettingsSection>("accounts");
  const [palApiKey, setPalApiKey] = useState("");
  const [klingApiKey, setKlingApiKey] = useState("");
  const [defaultVideoModel, setDefaultVideoModel] = useState("veo");
  const [humanVideoProvider, setHumanVideoProvider] = useState("artcraft");

  const sections = [
    { id: "accounts" as const, label: "Accounts", icon: faUser },
    { id: "video" as const, label: "Video", icon: faVideo },
    { id: "image" as const, label: "Image", icon: faImage },
    { id: "misc" as const, label: "Misc", icon: faCog },
  ];

  const renderContent = () => {
    switch (selectedSection) {
      case "accounts":
        return (
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>ArtCraft Account:</span>
              <span className="text-white/80">{accountInfo.username}</span>
            </div>
            <div className="flex justify-between">
              <span>ArtCraft Subscription:</span>
              <span className="text-white/80">{accountInfo.subscription}</span>
            </div>
            <div className="flex justify-between">
              <span>Credits Remaining:</span>
              <span className="text-white/80">{accountInfo.credits}</span>
            </div>

            <div className="rounded-md p-4 text-sm dark:bg-white/5">
              <p className="text-white/60">
                Note: You can optionally log into other accounts and use your
                credits at those providers. Some features are only available via
                3rd party accounts, such as OpenAI / Sora GPT 4.0 Images. For
                other features, ArtCraft credits are consumed unless you log
                into your third party account.
              </p>
            </div>

            <div className="flex justify-between items-center">
              <span>OpenAI / Sora Account:</span>
              <Button variant="secondary" className="py-1">
                Connect
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <span>Google / Veo Account:</span>
              <Button variant="secondary" className="py-1">
                Connect
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="pal-api-key" className="mb-2 block">
                  Pal API Key (optional)
                </label>
                <Input
                  id="pal-api-key"
                  type="password"
                  value={palApiKey}
                  onChange={(e) => setPalApiKey((e.target as any).value)}
                  placeholder="Enter API Key"
                />
              </div>
              <div>
                <label htmlFor="kling-api-key" className="mb-2 block">
                  Kling API Key (optional)
                </label>
                <Input
                  id="kling-api-key"
                  type="password"
                  value={klingApiKey}
                  onChange={(e) => setKlingApiKey((e.target as any).value)}
                  placeholder="Enter API Key"
                />
              </div>
            </div>
          </div>
        );

      case "video":
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="default-video-model" className="mb-2 block">
                Default Video Model
              </label>
              <Select
                id="default-video-model"
                value={defaultVideoModel}
                onChange={(val: SelectValue) =>
                  setDefaultVideoModel(val as string)
                }
                options={[
                  { value: "veo", label: "Veo" },
                  { value: "kling", label: "Kling" },
                ]}
              />
            </div>
            <div>
              <label htmlFor="human-video-provider" className="mb-2 block">
                Human Video Provider
              </label>
              <Select
                id="human-video-provider"
                value={humanVideoProvider}
                onChange={(val: SelectValue) =>
                  setHumanVideoProvider(val as string)
                }
                options={[
                  { value: "artcraft", label: "ArtCraft" },
                  { value: "pal", label: "Pal" },
                ]}
              />
            </div>
          </div>
        );

      case "image":
        return (
          <div>
            <button className="text-blue-600">Various Image Settings...</button>
          </div>
        );

      case "misc":
        return (
          <div>
            <button className="text-blue-600">Other Settings...</button>
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl"
      childPadding={false}
    >
      <div className="h-[560px]">
        <div className="grid h-full grid-cols-12 gap-3">
          <div className="relative col-span-4 p-3 pt-2 after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 after:dark:bg-white/10">
            <div className="flex items-center justify-between gap-2.5 py-0.5">
              <h2 className="text-[18px] font-semibold opacity-80">Settings</h2>
            </div>
            <hr className="my-2 w-full border-white/10" />
            <div className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  className={twMerge(
                    "h-9 w-full rounded-lg p-2 text-left transition-colors duration-100 hover:bg-[#63636B]/40",
                    section.id === selectedSection ? "bg-[#63636B]/40" : ""
                  )}
                  onClick={() => setSelectedSection(section.id)}
                >
                  <div className="flex items-center gap-2.5 text-sm">
                    <FontAwesomeIcon icon={section.icon} />
                    {section.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-8 flex h-full flex-col overflow-auto">
            <div className="w-full border-b border-white/10 py-2.5 ps-0">
              <h2 className="text-[18px] font-semibold">
                {sections.find((s) => s.id === selectedSection)?.label}
              </h2>
            </div>
            <div className="p-3 ps-0 text-sm h-full">{renderContent()}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;

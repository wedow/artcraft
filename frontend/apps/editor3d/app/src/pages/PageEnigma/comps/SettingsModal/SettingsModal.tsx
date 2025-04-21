import { Modal } from "@storyteller/ui-modal";
import { useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AccountInfo {
  username: string;
  subscription: string;
  credits: number;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [accountInfo] = useState<AccountInfo>({
    username: "Username [logout]",
    subscription: "Pro-tier [change/upgrade]",
    credits: 10233,
  });

  const [palApiKey, setPalApiKey] = useState("");
  const [klingApiKey, setKlingApiKey] = useState("");
  const [defaultVideoModel, setDefaultVideoModel] = useState("veo");
  const [humanVideoProvider, setHumanVideoProvider] = useState("artcraft");

  return (
    <Modal
      title="Settings"
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl"
    >
      <div className="space-y-8 p-6">
        {/* Accounts Section */}
        <section>
          <h2 className="mb-4 text-xl font-bold">ACCOUNTS</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>ArtCraft Account:</span>
              <span>{accountInfo.username}</span>
            </div>
            <div className="flex justify-between">
              <span>ArtCraft Subscription:</span>
              <span>{accountInfo.subscription}</span>
            </div>
            <div className="flex justify-between">
              <span>Credits Remaining:</span>
              <span>{accountInfo.credits}</span>
            </div>

            <div className="rounded-md bg-gray-100 p-4 text-sm">
              <p>
                Note: You can optionally log into other accounts and use your
                credits at those providers. Some features are only available via
                3rd party accounts, such as OpenAI / Sora GPT 4.0 Images. For
                other features, ArtCraft credits are consumed unless you log
                into your third party account.
              </p>
            </div>

            <div className="flex justify-between">
              <span>OpenAI / Sora Account:</span>
              <button className="text-blue-600">Connect</button>
            </div>
            <div className="flex justify-between">
              <span>Google / Veo Account:</span>
              <button className="text-blue-600">Connect</button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="pal-api-key" className="mb-2 block">
                  Pal API Key (optional)
                </label>
                <input
                  id="pal-api-key"
                  type="password"
                  className="w-full rounded border p-2"
                  value={palApiKey}
                  onChange={(e) => setPalApiKey(e.target.value)}
                  placeholder="Enter API Key"
                />
              </div>
              <div>
                <label htmlFor="kling-api-key" className="mb-2 block">
                  Kling API Key (optional)
                </label>
                <input
                  id="kling-api-key"
                  type="password"
                  className="w-full rounded border p-2"
                  value={klingApiKey}
                  onChange={(e) => setKlingApiKey(e.target.value)}
                  placeholder="Enter API Key"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Video Section */}
        <section>
          <h2 className="mb-4 text-xl font-bold">VIDEO</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="default-video-model" className="mb-2 block">
                Default Video Model
              </label>
              <select
                id="default-video-model"
                className="w-full rounded border p-2"
                value={defaultVideoModel}
                onChange={(e) => setDefaultVideoModel(e.target.value)}
              >
                <option value="veo">Veo</option>
                <option value="kling">Kling</option>
              </select>
            </div>
            <div>
              <label htmlFor="human-video-provider" className="mb-2 block">
                Human Video Provider
              </label>
              <select
                id="human-video-provider"
                className="w-full rounded border p-2"
                value={humanVideoProvider}
                onChange={(e) => setHumanVideoProvider(e.target.value)}
              >
                <option value="artcraft">ArtCraft</option>
                <option value="pal">Pal</option>
              </select>
            </div>
          </div>
        </section>

        {/* Image Section */}
        <section>
          <h2 className="mb-4 text-xl font-bold">IMAGE</h2>
          <div>
            <button className="text-blue-600">Various Image Settings...</button>
          </div>
        </section>

        {/* Misc Section */}
        <section>
          <h2 className="mb-4 text-xl font-bold">MISC</h2>
          <div>
            <button className="text-blue-600">Other Settings...</button>
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default SettingsModal;

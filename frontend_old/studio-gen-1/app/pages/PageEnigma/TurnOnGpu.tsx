import * as CopyToClipboard from "react-copy-to-clipboard";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/pro-solid-svg-icons";

export const TurnOnGpu = () => {
  const [copied1, setCopied1] = useState(false);
  const [copied2, setCopied2] = useState(false);

  useEffect(() => {
    if (copied1) {
      setTimeout(() => setCopied1(false), 2000);
    }
  }, [copied1]);
  useEffect(() => {
    if (copied2) {
      setTimeout(() => setCopied2(false), 2000);
    }
  }, [copied2]);

  return (
    <div className="fixed inset-0 h-screen overflow-y-auto p-16">
      <div>
        Hardware acceleration is <b>required</b> for StoryTeller Studio to run
        properly. To check if this is enabled, please follow the steps for your
        browser below.
      </div>
      <div className="my-4">
        <b>Google Chrome: </b>
      </div>
      <ol>
        <li>
          <div>
            Click the three stacked dots in upper right of the browser window.
          </div>
        </li>
        <li>
          <div>
            Click the arrow next to <em>&quot;Advanced&quot;</em> and select{" "}
            <em>&quot;System.&quot;</em>
          </div>
        </li>
        <li>
          <div>
            Make sure the box next to{" "}
            <em>&quot;Use hardware acceleration when available&quot;</em> is
            toggled on.
          </div>
        </li>
        <li>
          <div>
            Close and restart the browser for the change to take effect.
          </div>
        </li>
        <ul>
          <li>
            <div>
              You can also copy and paste this link{" "}
              <CopyToClipboard.CopyToClipboard
                text="chrome://settings/system"
                onCopy={() => setCopied1(true)}
              >
                <span className="text-blue">
                  chrome://settings/system&nbsp;
                  {copied1 ? (
                    <span style={{ color: "red" }}>Copied.</span>
                  ) : (
                    <span className="text-sm">
                      <FontAwesomeIcon icon={faCopy} />
                    </span>
                  )}
                  &nbsp;
                </span>
              </CopyToClipboard.CopyToClipboard>
              into the address bar. This will bring you right to the system
              settings.
            </div>
          </li>
        </ul>
      </ol>
      <div className="my-4">
        <b>Firefox:</b>
      </div>
      <ol>
        <li>
          <div>
            Click on <em>&quot;Firefox&quot;</em> then{" "}
            <em>&quot;Preferences.&quot;</em>
          </div>
        </li>
        <li>
          <div>
            In the&nbsp;<em>&quot;General&quot;</em>&nbsp;panel, go to the&nbsp;
            <em>&quot;Performance&quot; </em>section.
          </div>
        </li>
        <li>
          <div>
            Uncheck the box next to&nbsp;
            <em>&quot;Use recommended performance settings&quot;</em> and make
            sure the box next to{" "}
            <em>&quot;Use hardware acceleration when available&quot;</em> is
            selected.
          </div>
        </li>
        <li>
          <div>
            Close and restart the browser for the change to take effect.
          </div>
        </li>
        <ul>
          <li>
            <div>
              If you need help, please follow this link:{" "}
              <a
                href="https://support.mozilla.org/en-US/kb/performance-settings?as=u&amp;utm_source=inproduct"
                target="_blank"
                rel="noreferrer"
                className="text-blue underline"
              >
                https://support.mozilla.org/en-US/kb/performance-settings?as=u&amp;utm_source=inproduct
              </a>
            </div>
          </li>
        </ul>
      </ol>
      <div className="my-4">
        <b>Microsoft Edge:</b>
      </div>
      <ol>
        <li>
          <div>
            Click the &quot;3 dots&quot; menu icon in the upper right of the
            browser window
          </div>
        </li>
        <li>
          <div>
            Click on&nbsp;<em>&quot;Settings&quot;</em> then{" "}
            <em>&quot;System&quot;</em> on the left side.
          </div>
        </li>
        <li>
          <div>
            Toggle on{" "}
            <em>&quot;Use hardware acceleration when available&quot;</em> if
            this is not enabled.
          </div>
        </li>
        <li>
          <div>
            Close and restart the browser for the change to take effect.
          </div>
        </li>
        <ul>
          <li>
            <div>
              You can also copy and paste this link{" "}
              <CopyToClipboard.CopyToClipboard
                text="edge://settings/system"
                onCopy={() => setCopied2(true)}
              >
                <span className="text-blue">
                  edge://settings/system&nbsp;
                  {copied2 ? (
                    <span style={{ color: "red" }}>Copied.</span>
                  ) : (
                    <span className="text-sm">
                      <FontAwesomeIcon icon={faCopy} />
                    </span>
                  )}
                  &nbsp;
                </span>
              </CopyToClipboard.CopyToClipboard>
              into the address bar. This will bring you right to the system
              settings.
            </div>
          </li>
        </ul>
      </ol>
      <div className="my-4">
        <b>Safari (Mac Only)</b>
      </div>
      <div>
        As of macOS Catalina (version 10.15), Hardware acceleration is
        automatically enabled, and there is no way turn this on and off. If you
        are using an older version of MacOS, please use the steps below:
      </div>
      <ol>
        <li>
          <div>
            Click on the &quot;Safari&quot; then &quot;Settings&quot; &gt;{" "}
          </div>
        </li>
        <li>
          <div>
            Click &quot;Advanced&quot; on the top right of the Settings window
            and ensure &quot;Use hardware acceleration&quot; is enabled
          </div>
        </li>
      </ol>
      <div>
        If you are still having an issue with enabling hardware acceleration, we
        recommend you update your graphics card drivers, if possible. If these
        updates do not help, you may have to consider upgrading your graphics
        card or playing on a different device.
      </div>
    </div>
  );
};

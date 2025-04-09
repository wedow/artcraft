import React, { useState, useEffect, useCallback } from "react";
import { ApiConfig } from "@storyteller/components";
import { useParams, useHistory } from "react-router-dom";
import { WebUrl } from "../../../../../common/WebUrl";
import { VisibleIconFc } from "../../../_icons/VisibleIcon";
import { HiddenIconFc } from "../../../_icons/HiddenIcon";
import {
  GetW2lTemplate,
  GetW2lTemplateIsOk,
  W2lTemplate,
} from "@storyteller/components/src/api/w2l/GetW2lTemplate";
import { BackLink } from "../../../_common/BackLink";

import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";

const DEFAULT_VISIBILITY = "public";

export default function W2lTemplateEditPage() {
  let { templateToken }: { templateToken: string } = useParams();

  const history = useHistory();

  PosthogClient.recordPageview();

  const [w2lTemplate, setW2lTemplate] = useState<W2lTemplate | undefined>(
    undefined
  );
  const [title, setTitle] = useState<string>("");
  const [descriptionMarkdown, setDescriptionMarkdown] = useState<string>("");
  const [visibility, setVisibility] = useState<string>(DEFAULT_VISIBILITY);

  const getTemplate = useCallback(async token => {
    const template = await GetW2lTemplate(token);

    if (GetW2lTemplateIsOk(template)) {
      setTitle(template.title || "");
      setDescriptionMarkdown(template.description_markdown || "");
      setVisibility(template.creator_set_visibility || DEFAULT_VISIBILITY);
      setW2lTemplate(template);
    }
  }, []);

  useEffect(() => {
    getTemplate(templateToken);
  }, [templateToken, getTemplate]);

  const handleTitleChange = (ev: React.FormEvent<HTMLInputElement>) => {
    ev.preventDefault();
    const textValue = (ev.target as HTMLInputElement).value;
    setTitle(textValue);
    return false;
  };

  const handleDescriptionMarkdownChange = (
    ev: React.FormEvent<HTMLTextAreaElement>
  ) => {
    ev.preventDefault();
    const textValue = (ev.target as HTMLTextAreaElement).value;
    setDescriptionMarkdown(textValue);
    return false;
  };

  const handleVisibilityChange = (ev: React.FormEvent<HTMLSelectElement>) => {
    setVisibility((ev.target as HTMLSelectElement).value);
  };

  const templateLink = WebUrl.w2lTemplatePage(templateToken);

  const handleFormSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    if (w2lTemplate === undefined) {
      return false;
    }

    if (title.trim() === "") {
      return false;
    }

    const templateToken = w2lTemplate!.template_token;

    const endpointUrl = new ApiConfig().editW2lTemplate(templateToken);

    const request = {
      title: title,
      description_markdown: descriptionMarkdown,
      creator_set_visibility: visibility || DEFAULT_VISIBILITY,
    };

    fetch(endpointUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    })
      .then(res => res.json())
      .then(res => {
        if (res === undefined || !res.success) {
          return; // Endpoint error?
        }

        history.push(templateLink);
      })
      .catch(e => {});

    return false;
  };

  let isDisabled = w2lTemplate === undefined;

  const visibilityIcon =
    visibility === "public" ? <VisibleIconFc /> : <HiddenIconFc />;

  return (
    <div>
      <div className="container pt-5 pb-4 px-lg-5 px-xl-3">
        <div className="d-flex flex-column">
          <h1 className=" fw-bold">Edit Template</h1>
        </div>
        <div className="mt-3">
          <BackLink link={templateLink} text="Back to template" />
        </div>
      </div>

      <form onSubmit={handleFormSubmit}>
        <fieldset disabled={isDisabled}>
          <div className="container-panel pt-4 pb-5">
            <div className="panel p-3 py-4 p-lg-4">
              <div className="d-flex flex-column gap-4">
                <div>
                  <label className="sub-title">Template title</label>
                  <div className="form-group">
                    <input
                      onChange={handleTitleChange}
                      className="form-control"
                      type="text"
                      placeholder="Template title"
                      value={title}
                    />
                  </div>
                  {/*<p className="help">{invalidReason}</p>*/}
                </div>

                <div>
                  <label className="sub-title">
                    Description (supports Markdown)
                  </label>
                  <div className="form-group">
                    <textarea
                      onChange={handleDescriptionMarkdownChange}
                      className="form-control"
                      placeholder="Model description (ie. source of data, training duration, etc)"
                      value={descriptionMarkdown}
                      rows={5}
                    />
                  </div>
                </div>

                <div>
                  <label className="sub-title">
                    Template Visibility&nbsp;{visibilityIcon}
                  </label>
                  <div className="form-group">
                    <select
                      name="creator_set_visibility"
                      onChange={handleVisibilityChange}
                      value={visibility}
                      className="form-control"
                    >
                      <option value="public">
                        Public (visible from your profile)
                      </option>
                      <option value="hidden">Unlisted (shareable URLs)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container pb-5">
            <button className="btn btn-primary w-100">Update Template</button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

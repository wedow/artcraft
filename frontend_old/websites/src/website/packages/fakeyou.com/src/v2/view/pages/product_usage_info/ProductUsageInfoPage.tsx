import React, { useState } from "react";

import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";

const radioButtonsWho = [
  {
    label: "Filmmaker",
  },
  {
    label: "Animator",
  },
  {
    label: "Content creator",
  },
  {
    label: "Musician",
  },
  {
    label: "Other",
  },
];

const radioButtonsWhy = [
  {
    label: "Making social media content",
  },
  {
    label: "Making a short film",
  },
  {
    label: "Making memes for self or friends",
  },
  {
    label: "Using the API",
  },
  {
    label: "Other",
  },
];

export default function ProductUsageInfoPage() {
  usePrefixedDocumentTitle("Product Usage Survey");
  PosthogClient.recordPageview();

  const [selectedOptionWho, setSelectedOptionWho] = useState("");
  const [selectedOptionWhy, setSelectedOptionWhy] = useState("");

  const handleOptionChangeWho = (event: any) => {
    setSelectedOptionWho(event.target.value);
  };

  const handleOptionChangeWhy = (event: any) => {
    setSelectedOptionWhy(event.target.value);
  };

  return (
    <div>
      <div className="container-panel pt-lg-5 my-lg-5 login-panel">
        <div className="panel p-4 p-lg-4 mt-5 mt-lg-0 px-md-4">
          <h2 className="fw-bold pb-0">Product Usage Survey</h2>
          <hr className="my-4" />
          <form className="d-flex flex-column gap-4">
            <div>
              <label className="sub-title">What best describes you?</label>
              {radioButtonsWho.map((radioButton, index) => (
                <div className="form-check" key={index}>
                  <input
                    className="form-check-input"
                    type="radio"
                    id={`Radios${index}`}
                    name="Radios"
                    value={radioButton.label}
                    checked={selectedOptionWho === radioButton.label}
                    onChange={handleOptionChangeWho}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`Radios${index}`}
                  >
                    {radioButton.label}
                  </label>
                </div>
              ))}
              {selectedOptionWho === "Other" && (
                <div className="form-check">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type what best describes you here"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="sub-title">
                What's the main reason you're using FakeYou?
              </label>
              {radioButtonsWhy.map((radioButton, index) => (
                <div className="form-check" key={index}>
                  <input
                    className="form-check-input"
                    type="radio"
                    id={`Radios2${index}`}
                    name="Radios2"
                    value={radioButton.label}
                    checked={selectedOptionWhy === radioButton.label}
                    onChange={handleOptionChangeWhy}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`Radios2${index}`}
                  >
                    {radioButton.label}
                  </label>
                </div>
              ))}
              {selectedOptionWhy === "Other" && (
                <div className="form-check">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type your reason here"
                  />
                </div>
              )}
            </div>
            <button className="btn btn-primary">Submit</button>
          </form>
        </div>
      </div>
    </div>
  );
}

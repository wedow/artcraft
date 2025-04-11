import React, { useState } from "react";
import { Redirect, useHistory, useLocation } from "react-router-dom";
import {
  faPenToSquare,
  faPlus,
  faRightToBracket,
  faStar,
  faWandMagicSparkles,
  faMicrophone,
} from "@fortawesome/pro-solid-svg-icons";
import InferenceJobsList from "components/layout/InferenceJobsList";
import { useLocalize, useSession } from "hooks";
import Panel from "components/common/Panel";
import PageHeader from "components/layout/PageHeader";
import Container from "components/common/Container";
import { NavLink } from "react-router-dom";
import ListItems from "./components/NewList";
import Modal from "components/common/Modal";
import { Button } from "components/common";
import useVoiceRequests from "./useVoiceRequests";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import "./VoiceDesigner.scss";
import { AITools } from "components/marketing";

export default function VoiceDesignerMainPage() {
  usePrefixedDocumentTitle("AI Voice Designer");
  const { pathname } = useLocation();
  const { t } = useLocalize("FaceAnimator");
  const { datasets, voices, isLoading } = useVoiceRequests({
    requestDatasets: true,
    requestVoices: true,
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const view = ["/voice-designer/datasets", "/voice-designer/voices"].indexOf(
    pathname
  );
  const [deleteItem, setDeleteItem] = useState("");
  const [deleteType, setDeleteType] = useState("");
  const [deleteText, setDeleteText] = useState({
    title: "",
    text: "",
  });
  const history = useHistory();
  const { user } = useSession();

  if (pathname === "/voice-designer" || pathname === "/voice-designer/") {
    return <Redirect to="/voice-designer/voices" />;
  }
  const openDeleteModal = (token: string, type: string) => {
    setDeleteItem(token);
    setDeleteType(type);
    setDeleteText({
      title: `Delete ${type}`,
      text: `Are you sure you want to delete this ${type}?`,
    });
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (deleteType === "voice") {
      voices.delete(deleteItem);
      voices.refresh();
    } else if (deleteType === "dataset") datasets.delete(deleteItem);
    datasets.refresh();
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const navToEdit = (token: string, type: string) => {
    history.push(`/voice-designer/${type}/${token}/edit`);
  };

  const navToUseVoice = (token: string, type: string) => {
    history.push(`/voice-designer/voice/${token}`);
  };

  const DataBadge = () => <span className="dataset-badge mb-0">Dataset</span>;
  const VoiceBadge = () => (
    <FontAwesomeIcon icon={faMicrophone} className="me-2 me-lg-3" />
  );

  // these need to be abstracted to use over again -V
  const voiceClick =
    (todo: any, type: string) =>
    ({ target }: { target: any }) => {
      let voiceToken =
        voices.list[target.name.split(",")[0].split(":")[1]].voice_token;
      todo(voiceToken, type);
    };

  const datasetClick =
    (todo: any, type: string) =>
    ({ target }: { target: any }) => {
      let datasetToken =
        datasets.list[target.name.split(",")[0].split(":")[1]].dataset_token;
      todo(datasetToken, type);
    };

  const actionDataSets = datasets.list.map((dataset, i) => {
    return {
      ...dataset,
      badge: DataBadge,
      buttons: [
        {
          label: "Edit",
          small: true,
          variant: "secondary",
          onClick: datasetClick(navToEdit, "dataset"),
        },
        {
          label: "Delete",
          small: true,
          variant: "danger",
          onClick: datasetClick(openDeleteModal, "dataset"),
        },
      ],
      name: dataset.title,
    };
  });

  const actionVoices = voices.list.map((voice, i) => {
    return {
      ...voice,
      badge: VoiceBadge,
      buttons: [
        {
          label: "Edit",
          small: true,
          variant: "secondary",
          onClick: voiceClick(navToEdit, "voice"),
        },
        {
          label: "Delete",
          small: true,
          variant: "danger",
          onClick: voiceClick(openDeleteModal, "voice"),
        },
        {
          label: "Use Voice",
          small: true,
          variant: "primary",
          onClick: voiceClick(navToUseVoice, "voice"),
        },
      ],
      name: voice.title,
    };
  });

  const failures = (fail = "") => {
    switch (fail) {
      // case "face_not_detected": return "Face not detected, try another picture"; // voice designer can have failure states too!
      default:
        return "Uknown failure";
    }
  };

  const createVoiceButton = {
    label: `Create new voice`,
    icon: faPlus,
    to: "/voice-designer/create",
  };

  const signUpButton = {
    label: `Sign Up`,
    icon: faPenToSquare,
    to: "/signup",
  };

  const pricingButton = {
    label: `View Pricing`,
    icon: faStar,
    to: "/pricing",
  };

  const dataPlaceholder = () => (
    <div className="d-flex flex-column list-items p-5 align-items-center">
      <h5 className="fw-semibold mb-3">You haven't created any voices.</h5>
      <Button
        icon={faPlus} // 1
        label="Create New Voice" // 2
        small={true}
        to="/voice-designer/create" // 3
      />
    </div>
  );

  const logggedInView = (
    <>
      <InferenceJobsList
        {...{
          failures,
          jobType: FrontendInferenceJobType.TextToSpeech,
          t,
        }}
      />
      <Panel mb={true}>
        <nav>
          <ul className="nav nav-tabs">
            <div className="d-flex flex-grow-1">
              <li className="nav-item">
                <NavLink
                  to="/voice-designer/voices"
                  className="nav-link fs-6 px-3 px-lg-4"
                  activeClassName="active"
                >
                  My Voices
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/voice-designer/datasets"
                  className="nav-link fs-6"
                  activeClassName="active"
                >
                  My Datasets
                </NavLink>
              </li>
            </div>
          </ul>
        </nav>

        <div className="p-3 p-lg-4">
          <ListItems
            {...{
              data: view ? actionVoices : actionDataSets,
              dataPlaceholder,
              isLoading,
            }}
          />
        </div>
      </Panel>
    </>
  );

  const loggedOutView = (
    <Panel padding={true}>
      <div className="d-flex flex-column align-items-center py-3 my-3 py-md-4 my-md-4 gap-4">
        <div className="text-center">
          <h4 className="fw-bold">Please log in to access voice creation.</h4>

          <p className="text-center opacity-75">
            If you don't have an account yet, sign up now to unlock this
            feature!
          </p>
        </div>

        <div className="d-flex gap-3 align-items-center">
          <Button
            label="Sign Up"
            variant="primary"
            icon={faPenToSquare}
            to="/signup"
          />
          <Button
            label="Login"
            variant="secondary"
            icon={faRightToBracket}
            to="/login"
          />
        </div>
      </div>
    </Panel>
  );

  return (
    <>
      <Container {...{ className: "voice-designer-page", type: "panel" }}>
        <PageHeader
          {...{
            button: user ? createVoiceButton : signUpButton,
            ...(!user ? { secondaryButton: pricingButton } : {}),
            title: "Voice Designer",
            titleIcon: faWandMagicSparkles,
            subText:
              "Create your own AI voice by providing audio files of the voice you want to clone.",
            panel: false,
            imageUrl: "/images/header/voice-designer.png",
          }}
        />
        {user ? logggedInView : loggedOutView}
        {/* Delete Modal */}
        <Modal
          show={isDeleteModalOpen}
          handleClose={closeDeleteModal}
          title={deleteText.title}
          content={() => <p>{deleteText.text}</p>}
          onConfirm={handleDelete}
        />
      </Container>

      <Container type="panel" className="pt-5 mt-5">
        <Panel clear={true}>
          <AITools />
        </Panel>
      </Container>
    </>
  );
}

import React, { useState, memo, useEffect } from "react";
import Searcher from "../Searcher";
import Modal from "../Modal";
import NonRouteTabs from "../Tabs/NonRouteTabs";
import Input from "../TempInput";
import Button from "../Button";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import SelectMediaList from "./SelectMediaList";
import SelectWeightsList from "./SelectWeightsList";
import { useSession } from "hooks";

export type SelectModalData = {
  token: string;
  title: string;
};
interface TabConfig {
  label: string;
  tabKey: string;
  type: "media" | "weights";
  typeFilter?: string;
  searcher?: boolean;
  onlyBookmarked?: boolean;
}
interface SelectModalProps {
  label?: string;
  tabs: TabConfig[];
  modalTitle?: string;
  value?: SelectModalData;
  onSelect?: (data: SelectModalData) => void;
  required?: boolean;
}

const SelectModalContent = ({ searchTabs }: { searchTabs: any }) => <NonRouteTabs tabs={searchTabs} />;

const SelectModal = memo(
  ({
    label,
    tabs,
    modalTitle = "Select",
    onSelect,
    value,
    required,
  }: SelectModalProps) => {
    const emptyValue = { token: "", title: "" };
    const { user } = useSession();
    const [{ isModalOpen, selectedValue, valueType, activeTab }, setState] =
      useState({
        isModalOpen: false,
        selectedValue: value ? value : emptyValue,
        activeTab: tabs[0].tabKey,
        valueType: tabs[0].typeFilter || "all",
      });
    // Update mediaType when activeTab changes
    useEffect(() => {
      const currentTab = tabs.find(tab => tab.tabKey === activeTab);
      setState(curr => ({
        ...curr,
        valueType: currentTab?.typeFilter || "all",
      }));
    }, [activeTab, tabs]);

    const openModal = () => {
      setState(curr => ({ ...curr, isModalOpen: true }));
    };

    const closeModal = () => {
      setState(curr => ({ ...curr, isModalOpen: false }));
    };

    const handleRemove = () => {
      setState(curr => ({ ...curr, selectedValue: emptyValue }));
      if (onSelect) onSelect(emptyValue);
    };

    const handleOnSelect = (data: { token: string; title: string }) => {
      setState(curr => ({
        ...curr,
        selectedValue: { token: data.token, title: data.title || "" },
        isModalOpen: false,
      }));
      if (onSelect) onSelect(data);
    };

    const searchTabs = tabs.map(tab => ({
      label: tab.label,
      content: tab.searcher ? (
        <Searcher
          type="modal"
          onResultSelect={handleOnSelect}
          searcherKey={tab.tabKey}
          weightType={tab.typeFilter}
        />
      ) : (
        <>
          {tab.type === "media" && (
            <SelectMediaList
              mediaType={valueType}
              listKey={tab.tabKey}
              onResultSelect={handleOnSelect}
            />
          )}
          {tab.type === "weights" && (
            <>
              {tab.onlyBookmarked ? (
                <>
                  {user ? (
                    <SelectWeightsList
                      weightType={valueType}
                      listKey={tab.tabKey}
                      onResultBookmarkSelect={handleOnSelect}
                      onlyBookmarked={tab.onlyBookmarked}
                    />
                  ) : (
                    <div className="text-center py-3">
                      <p>Please login to view your bookmarks.</p>
                    </div>
                  )}
                </>
              ) : (
                <SelectWeightsList
                  weightType={valueType}
                  listKey={tab.tabKey}
                  onResultSelect={handleOnSelect}
                />
              )}
            </>
          )}
        </>
      ),
      padding: true,
      onClick: () => setState(curr => ({ ...curr, activeTab: tab.tabKey })),
    }));

    return (
      <>
        <div>
          {label && (
            <label className={`sub-title ${required && "required"}`.trim()}>
              {label}
            </label>
          )}

          <div className="d-flex">
            <Input
              readOnly={true}
              placeholder="None selected"
              onClick={openModal}
              value={
                selectedValue.title !== ""
                  ? selectedValue.title
                  : selectedValue.token || ""
              }
              style={{ cursor: "pointer" }}
              wrapperClassName="flex-grow-1"
            />

            <div className="d-flex gap-2">
              <Button
                label={selectedValue.token !== "" ? "Change" : "Select"}
                onClick={openModal}
              />
              {selectedValue.token && (
                <Button
                  square={true}
                  variant="danger"
                  icon={faTrash}
                  onClick={handleRemove}
                  tooltip="Remove"
                />
              )}
            </div>
          </div>
        </div>

        <Modal {...{ contentProps: { searchTabs } }}
          show={isModalOpen}
          handleClose={closeModal}
          title={modalTitle}
          content={SelectModalContent}
          showButtons={false}
          padding={false}
          large={true}
          position="top"
          mobileFullscreen={true}
        />
      </>
    );
  }
);

export default SelectModal;

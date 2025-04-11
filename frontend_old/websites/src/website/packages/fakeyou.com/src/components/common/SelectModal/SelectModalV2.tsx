import React, {
  memo,
  ReactNode,
  useEffect,
  useState,
} from "react";

import {
  Button,
  TempInput as Input,
  Modal,
} from "components/common";

import { faTrash } from "@fortawesome/free-solid-svg-icons";

export type SelectModalData = {
  token: string;
  title: string;
}

interface SelectModalProps {
  label?: string;
  placeholder?: string;
  modalTitle?: string;
  value?: string | SelectModalData;
  onClear: () => void;
  forcedClose?: Date; //if you need to force close modal, supply date
  required?: boolean;
  children: ReactNode
}

const SelectModalContent = ({ children }: { children: ReactNode }) => <>{ children }</>;

export default memo(function SelectModal ({
  label,
  modalTitle = "Select",
  placeholder = "None selected",
  onClear,
  forcedClose,
  value:valueProps = "",
  required,
  children
}: SelectModalProps) {
    const [isModalOpen, setModalOpen] = useState(false)
    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);
    useEffect(closeModal, [valueProps, forcedClose]);
    const value = typeof valueProps === "string" ? valueProps : valueProps.title;

    return (
      <>
        <div>
          {label && (
            <label className={`sub-title ${required && "required"}`.trim()}>
              {label}
            </label>
          )}

          <div className="d-flex gap-2 position-relative">
            <div 
              className="position-absolute w-100 h-100"
              style={{"cursor": "pointer"}}
              onClick={openModal} 
            />
            <Input
              disabled={true}
              wrapperClassName="w-100"
              placeholder={placeholder}
              onClick={openModal}
              value={value}
            />
            
            <Button label={value !== "" ? "Change" : "Select"} onClick={openModal} />
            {value && (
              <Button
                square={true}
                variant="danger"
                icon={faTrash}
                onClick={onClear}
                tooltip="Remove"
              />
            )}
          </div>
        </div>

        <Modal {...{ contentProps: { children } }}
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

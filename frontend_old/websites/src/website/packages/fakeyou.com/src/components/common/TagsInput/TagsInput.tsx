import React, { useState } from "react";
import "./TagsInput.scss";
import Label from "../Label";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/pro-solid-svg-icons";

interface TagsInputProps {
  value: string[];
  label?: string;
  onChange: (tags: string[]) => void;
  className?: string;
  tagsLimit?: number;
}

const TagsInput: React.FC<TagsInputProps> = ({
  value,
  label,
  onChange,
  className,
  tagsLimit = Infinity,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if ((event.key === "Enter" || event.key === ",") && inputValue.trim()) {
      event.preventDefault();
      addTag(inputValue);
    } else if (event.key === "Backspace" && inputValue === "") {
      handleRemoveTag(value.length - 1);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  const addTag = (tag: string) => {
    const lowerCaseValue = tag.trim().toLowerCase();
    if (value.length < tagsLimit) {
      onChange([...value, lowerCaseValue]);
      setInputValue("");
    } else {
      setInputValue("");
    }
  };

  const handleRemoveTag = (index: number) => {
    const newTags = value.filter((_, i) => i !== index);
    onChange(newTags);
  };

  return (
    <div className={className}>
      {label && <Label label={label} />}
      <div className="tags-input-container form-control">
        {value.map((tag, index) => (
          <div className="tag" key={index}>
            {tag}
            <button type="button" onClick={() => handleRemoveTag(index)}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={
            value.length < tagsLimit
              ? "Enter a tag and press Enter"
              : "Tags limit reached"
          }
        />
      </div>
    </div>
  );
};

export default TagsInput;

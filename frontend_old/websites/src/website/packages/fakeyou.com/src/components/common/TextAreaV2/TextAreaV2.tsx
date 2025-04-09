import React from "react";
import "./TextAreaV2.scss";

interface TextAreaProps {
  label?: string;
  required?: boolean;
  placeholder?: string;
  initialValue?: string;
  value?: string;
  onChange?: (newText:string) => void
}

export default function TextArea({
  label,
  required,
  value,
  placeholder,
  onChange: onChangeCallback,
}: TextAreaProps) {
  const handleOnChange = (e:React.ChangeEvent<HTMLTextAreaElement>)=>{
    if(onChangeCallback) onChangeCallback (e.target.value);
  }
  return (
    <div>
      {label && 
        <label className={`sub-title ${required ? "required" : ""}`}>
          {label}
        </label>
      }
      <div className="form-group">
        <textarea
          className="form-control"
          onChange={handleOnChange}
          {...{value, placeholder}}
        />
      </div>
    </div>
  );
}

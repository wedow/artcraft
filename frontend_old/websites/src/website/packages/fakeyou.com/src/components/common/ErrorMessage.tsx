import React from 'react';
import { useLocalize } from "hooks";
export default function Error({message}:{message?:string}){
  const {t} = useLocalize("App")
  return (
    <div className="row">
      <div className="col-12">
        <h1>{message ? message : t("error.unknownError")}</h1>
      </div>
    </div>
  );
}
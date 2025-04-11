import React from "react";
// import { useParams } from "react-router-dom";
import { Input, TextArea, Select } from "components/common/Inputs/Inputs";
import Panel from "components/common/Panel/Panel";
import { faEye, faFilePen, faSave } from "@fortawesome/pro-solid-svg-icons";
import PageHeaderModelView from "components/layout/PageHeaderModelView/PageHeaderModelView";
import Button from "components/common/Button/Button";
import PageContainer from "components/common/Container";

const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log(event.target.value);
};

const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log("save");
};

const savebtn = <button className="btn btn-primary">Save Changes</button>;

const visibility = [
  { value: "public", label: "Public" },
  { value: "hidden", label: "Hidden" },
];

export default function VcModelEditPage() {
  // let { token } = useParams() as { token: string };
  return (
    <PageContainer>
      <PageHeaderModelView
        title="Solid Snake"
        subText="Solid Snake"
        view="edit"
        titleIcon={faFilePen}
        extras={savebtn}
        modelType="V2V"
      />

      <Panel padding>
        <div className="d-flex flex-column gap-4">
          <Input
            label="Name"
            type="text"
            placeholder="Model title"
            onChange={handleChange}
          />

          <TextArea
            rows={3}
            label="Description"
            placeholder="Description"
            onChange={() => {}}
          />

          <Select
            isSearchable={false}
            icon={faEye}
            defaultValue={visibility[0]}
            options={visibility}
            label="Visibility"
          />

          <Button label="Save Changes" icon={faSave} onClick={handleSave} />
        </div>
      </Panel>
    </PageContainer>
  );
}

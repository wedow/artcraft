import React from "react";
// import { useParams } from "react-router-dom";
import Panel from "components/common/Panel/Panel";
import { faSave, faTrash } from "@fortawesome/pro-solid-svg-icons";
import PageHeaderModelView from "components/layout/PageHeaderModelView/PageHeaderModelView";
import Button from "components/common/Button/Button";
import PageContainer from "components/common/Container";

// const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//   console.log(event.target.value);
// };

const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log("save");
};

const savebtn = <button className="btn btn-primary">Save Changes</button>;

export default function VcModelDeletePage() {
  // let { token } = useParams() as { token: string };
  return (
    <PageContainer>
      <PageHeaderModelView
        title="Solid Snake"
        subText="Solid Snake"
        view="delete"
        titleIcon={faTrash}
        extras={savebtn}
        modelType="V2V"
      />

      <Panel padding>
        <div className="d-flex flex-column gap-4">
          <Button label="Save Changes" icon={faSave} onClick={handleSave} />
        </div>
      </Panel>
    </PageContainer>
  );
}

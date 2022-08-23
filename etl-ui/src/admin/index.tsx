import { Admin, Resource } from "react-admin";
import { dataProviders } from "../dataProviders";
import { RuleList, RuleEdit, RuleCreate } from "./Rules";
import { RecordList, RecordEdit, RecordCreate, RecordShow } from "./Records";
import RuleFolderIcon from "@mui/icons-material/RuleFolder";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";

const AdminApp = () => (
  <Admin dataProvider={dataProviders}>
    <Resource
      name="etl-rules"
      list={RuleList}
      edit={RuleEdit}
      create={RuleCreate}
      icon={RuleFolderIcon}
    />
    <Resource
      name="etl-records"
      list={RecordList}
      edit={RecordEdit}
      create={RecordCreate}
      show={RecordShow}
      icon={PublishedWithChangesIcon}
    />
  </Admin>
);

export default AdminApp;

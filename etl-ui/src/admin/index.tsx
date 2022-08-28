import { Admin, Resource } from "react-admin";
import { dataProviders } from "../dataProviders";
import { RuleList, RuleEdit, RuleCreate } from "./Rules";
import { RecordList, RecordEdit, RecordCreate, RecordShow } from "./Records";
import RuleFolderIcon from "@mui/icons-material/RuleFolder";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import { useAuth0 } from "@auth0/auth0-react";

const AdminApp = () => {
  const { isAuthenticated, logout, loginWithRedirect, user } = useAuth0();

  const authProvider = {
    login: loginWithRedirect,
    logout: () => Promise.resolve(logout({ returnTo: window.location.origin })),
    checkError: () => Promise.resolve(),
    checkAuth: () => (isAuthenticated ? Promise.resolve() : Promise.reject()),
    getPermissions: () => Promise.reject("Unknown method"),
    getIdentity: () =>
      Promise.resolve({
        id: user?.id,
        fullName: user?.given_name,
        avatar: user?.picture,
      }),
  };

  return (
    <Admin dataProvider={dataProviders} authProvider={authProvider}>
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
};
export default AdminApp;

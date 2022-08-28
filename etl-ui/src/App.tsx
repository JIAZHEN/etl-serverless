import AdminApp from "./admin";
import { withAuthenticationRequired } from "@auth0/auth0-react";

const App = () => <AdminApp />;

export default withAuthenticationRequired(App);

import { Auth0Client } from "@auth0/auth0-spa-js";

if (
  !process.env.REACT_APP_AUTH0_DOMAIN ||
  !process.env.REACT_APP_AUTH0_CLIENT_ID
) {
  throw new Error("Missing required ENV variables for AUTH0");
}

const auth0 = new Auth0Client({
  domain: process.env.REACT_APP_AUTH0_DOMAIN,
  client_id: process.env.REACT_APP_AUTH0_CLIENT_ID,
  redirect_uri: window.location.origin,
  cacheLocation: "localstorage",
  useRefreshTokens: true,
  auth0Logout: true,
});

export const authProvider = {
  login: () =>
    auth0.loginWithRedirect({ redirect_uri: window.location.origin }),
  logout: async () => {
    const isAuthenticated = await auth0.isAuthenticated();
    if (isAuthenticated) {
      return auth0.logout({ returnTo: window.location.origin });
    } else {
      return Promise.resolve();
    }
  },
  checkAuth: async () => {
    const isAuthenticated = await auth0.isAuthenticated();
    if (isAuthenticated) {
      return Promise.resolve();
    } else {
      await auth0.getTokenSilently();
      return;
    }
  },
  checkError: (error: any) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      return Promise.reject();
    }
    return Promise.resolve();
  },
  getIdentity: async () => {
    const isAuthenticated = await auth0.isAuthenticated();
    if (isAuthenticated) {
      const user = await auth0.getUser();
      return Promise.resolve({
        id: user?.sub || "",
        fullName: user?.given_name,
        avatar: user?.picture,
      });
    } else {
      return Promise.reject();
    }
  },
  getPermissions: () => Promise.resolve(""),
};

export const getBackendUrl = () => {
  const buildUrl = process.env.REACT_APP_BACKEND_URL;
  const isLocalDevHost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

  if (!buildUrl) {
    return isLocalDevHost ? "http://127.0.0.1:8000" : "";
  }

  if (buildUrl === "http://localhost:8000" && isLocalDevHost) {
    return "http://127.0.0.1:8000";
  }

  return buildUrl.replace(/\/$/, "");
};

export const API_URL = `${getBackendUrl()}/api`;

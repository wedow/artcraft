export const isDevelopment = () => {
  const hostname = window.location.hostname;
  return (
    hostname.includes("devproxy") ||
    hostname === "localhost" ||
    hostname.includes(".local")
  );
};

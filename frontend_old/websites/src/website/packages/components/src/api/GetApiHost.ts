// interface ApiDetails { hostname: string, useSsl: boolean, }

const domainWithoutPort = document.location.host.split(":")[0];

const hostConfig = (host: string, useSsl = true) => ({
  formatUrl: (endpoint = "") =>
    `${useSsl ? "https" : "http"}://${host + endpoint}`,
  host,
  useSsl,
});

export default function GetApiHost() {
  switch (domainWithoutPort) {
    case "fakeyou.com":
    case "staging.fakeyou.com":
      return hostConfig("api.fakeyou.com");
    case "storyteller.ai":
    case "staging.storyteller.ai":
      return hostConfig("api.storyteller.ai");
    case "storyteller.stream": // Storyteller.stream is deprecated and will be decommissioned in the future.
      return hostConfig("api.storyteller.stream");
    case "devproxy.fakeyou.com":
      return hostConfig("api.fakeyou.com");
    case "devproxy.storyteller.ai":
      //return hostConfig("api.storyteller.ai");
      return hostConfig("api.storyteller.ai");
    case "dev.fakeyou.com":
      return hostConfig("api.dev.fakeyou.com:12345", false); // false disables SSL
    default:
      return document.location.host.includes("localhost")
        ? hostConfig("localhost:12345", document.location.protocol === "https:")
        : hostConfig("api.fakeyou.com"); // default
  }
}

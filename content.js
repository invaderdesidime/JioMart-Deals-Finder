console.log("Jiomart content.js loaded");

const script = document.createElement("script");
script.src = chrome.runtime.getURL("page-hook.js");
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

window.addEventListener("message", (event) => {
  if (
    event.source === window &&
    event.data?.source === "JIOMART_EXT" &&
    event.data.type === "TREX_SEARCH_RESPONSE"
  ) {
    chrome.runtime.sendMessage({
      type: "JIOMART_DATA",
      payload: event.data.payload,
    });
  }
});

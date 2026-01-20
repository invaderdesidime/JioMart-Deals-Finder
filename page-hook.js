(() => {
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    try {
      const url = args[0];
      const options = args[1];

      if (
        typeof url === "string" &&
        url.includes("/trex/search") &&
        options?.body
      ) {
        const payload = JSON.parse(options.body);
        const clone = response.clone();

        clone.json().then((data) => {
          window.postMessage(
            {
              source: "JIOMART_EXT",
              type: "TREX_SEARCH_RESPONSE",
              payload: data,
              requestPayload: payload,
            },
            "*"
          );
        });
      }
    } catch (e) {
      console.error("page-hook error", e);
    }

    return response;
  };
})();

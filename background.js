chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  const tabUrl = sender.tab?.url;

  if (msg.type === "JIOMART_DATA" && tabId && tabUrl) {
    const products = extractProducts(msg.payload);
    const contextKey = getContextKey(tabUrl, msg.requestPayload);

    chrome.storage.local.get("jiomartProductsByTab", (res) => {
      const store = res.jiomartProductsByTab || {};
      const existing = store[tabId];

      if (!existing || existing.contextKey !== contextKey) {
        store[tabId] = {
          contextKey,
          products: dedupe(products),
          timestamp: Date.now(),
        };
      } else {
        store[tabId].products = dedupe([...existing.products, ...products]);
        store[tabId].timestamp = Date.now();
      }

      chrome.storage.local.set({ jiomartProductsByTab: store });
    });
  }

  if (msg.type === "GET_PRODUCTS") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      const tabId = tab?.id;
      const tabUrl = tab?.url;

      chrome.storage.local.get("jiomartProductsByTab", (res) => {
        const entry = res.jiomartProductsByTab?.[tabId];

        if (entry && tabUrl.includes("jiomart.com")) {
          sendResponse(entry.products);
        } else {
          sendResponse([]);
        }
      });
    });
    return true;
  }
});

function getContextKey(url, payload) {
  if (!url) return "unknown";

  const searchMatch = url.match(/[?&]q=([^&]+)/i);
  if (searchMatch) {
    const query = decodeURIComponent(searchMatch[1]).trim().toLowerCase();
    return `search:${query}`;
  }

  const categoryMatch = url.match(/\/(\d+)(?:\/)?$/);
  if (categoryMatch) {
    return `category:${categoryMatch[1]}`;
  }

  return "unknown";
}

function dedupe(products) {
  const map = new Map();
  products.forEach((p) => map.set(p.id, p));
  return Array.from(map.values());
}

function extractProducts(apiResponse) {
  if (!apiResponse?.results) return [];

  return apiResponse.results.map((item) => {
    const variant = item.product?.variants?.[0];
    const attrs = variant?.attributes || {};
    const buybox = attrs.buybox_mrp?.text?.[0];

    let mrp = null;
    let price = null;
    let discountPct = null;

    if (buybox) {
      const parts = buybox.split("|");
      mrp = parseFloat(parts[4]);
      price = parseFloat(parts[5]);
      discountPct = parseFloat(parts[8]);
    }

    return {
      id: variant?.id,
      title: variant?.title,
      uri: variant?.uri,
      mrp,
      price,
      discountPct,
    };
  });
}

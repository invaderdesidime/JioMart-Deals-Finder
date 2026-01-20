let products = [];
let currentSort = {
  key: "discountPct",
  direction: "desc",
};

chrome.runtime.sendMessage({ type: "GET_PRODUCTS" }, (data) => {
  products = Array.isArray(data) ? data : [];
  sortAndRender();
  setupSorting();
});

function setupSorting() {
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.style.cursor = "pointer";

    th.addEventListener("click", () => {
      const key = th.dataset.sort;

      if (currentSort.key === key) {
        currentSort.direction =
          currentSort.direction === "asc" ? "desc" : "asc";
      } else {
        currentSort.key = key;
        currentSort.direction = "asc";
      }

      sortAndRender();
    });
  });
}

function sortAndRender() {
  const sorted = [...products].sort((a, b) => {
    const key = currentSort.key;
    let valA = a[key];
    let valB = b[key];

    if (valA == null) return 1;
    if (valB == null) return -1;

    if (typeof valA === "string") {
      return currentSort.direction === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    return currentSort.direction === "asc" ? valA - valB : valB - valA;
  });

  renderTable(sorted);
}

function renderTable(list) {
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty">
          Open a Jiomart category page to view products
        </td>
      </tr>
    `;
    return;
  }

  list.forEach((p) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <a href="${p.uri}" target="_blank">${p.title}</a>
      </td>
      <td>${p.mrp ? `₹${p.mrp}` : "-"}</td>
      <td>${p.price ? `₹${p.price}` : "-"}</td>
      <td>${p.discountPct ? `${p.discountPct}%` : "-"}</td>
    `;
    tbody.appendChild(row);
  });
}

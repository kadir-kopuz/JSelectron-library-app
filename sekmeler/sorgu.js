async function runDynamicQuery() {
  const filters = {
    title: document.getElementById("dyn-title").value,
    author: document.getElementById("dyn-author").value,
    category: document.getElementById("dyn-category").value,
    minYear: document.getElementById("dyn-min-year").value,
    maxYear: document.getElementById("dyn-max-year").value,
    stockOnly: document.getElementById("dyn-stock-only").checked,
    sort: document.getElementById("dyn-sort").value,
  };

  const result = await ipcRenderer.invoke("run-dynamic-query", filters);

  if (result.error) {
    alert("Sorgu Hatası: " + result.error);
    return;
  }

  currentReportData = result.rows;

  const sqlPreview = document.getElementById("sql-preview");
  sqlPreview.innerText = result.sql;
  sqlPreview.style.display = "block";

  renderDynamicTable(result.rows);
}

function exportDynamicPDF() {
  if (!currentReportData || currentReportData.length === 0) {
    return alert("Dışa aktarılacak veri yok! Önce sorgulama yapın.");
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Dinamik Kitap Sorgu Sonuclari", 14, 15);
  doc.autoTable({
    html: "#dynamic-table",
    startY: 25,
    styles: { font: "courier" },
  });

  doc.save(`Sorgu_Sonucu_${Date.now()}.pdf`);
}

function renderDynamicTable(rows) {
  const tbody = document.querySelector("#dynamic-table tbody");
  const countDisplay = document.getElementById("result-count");

  countDisplay.innerText = rows.length;

  if (rows.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center">Eşleşen kayıt bulunamadı.</td></tr>';
    return;
  }

  tbody.innerHTML = rows
    .map(
      (row) => `
    <tr>
      <td>${row.kitap_id}</td>
      <td>${row.kitap_adi}</td>
      <td>${row.yazar}</td>
      <td>${row.kategori_ad || "Kategorisiz"}</td>
      <td>${row.basim_yili || "-"}</td>
      <td>${
        row.mevcut_adet > 0 ? "Stokta (" + row.mevcut_adet + ")" : "Tükendi"
      }</td>
    </tr>
  `
    )
    .join("");
}

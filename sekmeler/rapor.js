let currentReportData = [];
let selectedReportType = 1;

function selectReport(type) {
  selectedReportType = type;
  document
    .querySelectorAll(".report-buttons .btn-outline")
    .forEach((btn, idx) => {
      btn.classList.toggle("active", idx + 1 === type);
    });

  document.getElementById("filter-dates").style.display =
    type === 1 ? "block" : "none";
  document.getElementById("filter-extras").style.display =
    type === 1 ? "block" : "none";
}

async function runReport() {
  const params = {
    type: selectedReportType,
    start: document.getElementById("rep-start").value,
    end: document.getElementById("rep-end").value,
    memberId: document.getElementById("rep-member").value,
    categoryId: document.getElementById("rep-category").value,
  };

  if (selectedReportType === 1 && (!params.start || !params.end)) {
    alert("Lütfen tarih aralığı seçiniz!");
    return;
  }

  const results = await ipcRenderer.invoke("run-report", params);

  if (results.error) {
    alert("Hata: " + results.error);
    return;
  }

  currentReportData = results;
  renderReportsTable(results);
}

function renderReportsTable(data) {
  const thead = document.querySelector("#reports-table thead");
  const tbody = document.querySelector("#reports-table tbody");

  if (data.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center">Kayıt bulunamadı.</td></tr>';
    return;
  }

  let headers = "";
  if (selectedReportType === 1)
    headers =
      "<tr><th>Üye</th><th>Kitap</th><th>Ödünç T.</th><th>Son Teslim</th><th>Durum</th></tr>";
  else if (selectedReportType === 2)
    headers =
      "<tr><th>Üye</th><th>Kitap</th><th>Son Teslim</th><th>Gecikme (Gün)</th></tr>";
  else if (selectedReportType === 3)
    headers = "<tr><th>Kitap Adı</th><th>Yazar</th><th>Okunma Sayısı</th></tr>";

  thead.innerHTML = headers;

  tbody.innerHTML = data
    .map((row) => {
      if (selectedReportType === 1) {
        return `<tr><td>${row.ad} ${row.soyad}</td><td>${
          row.kitap_adi
        }</td><td>${row.odunc_tarihi.toLocaleDateString()}</td><td>${row.son_teslim_tarihi.toLocaleDateString()}</td><td>${
          row.teslim_tarihi ? "İade Edildi" : "Elde"
        }</td></tr>`;
      } else if (selectedReportType === 2) {
        return `<tr><td>${row.ad} ${row.soyad}</td><td>${
          row.kitap_adi
        }</td><td>${row.son_teslim_tarihi.toLocaleDateString()}</td><td style="color:red; font-weight:bold">${
          row.gecikme_gunu
        }</td></tr>`;
      } else {
        return `<tr><td>${row.kitap_adi}</td><td>${row.yazar}</td><td>${row.okunma_sayisi}</td></tr>`;
      }
    })
    .join("");
}

function exportToPDF() {
  if (currentReportData.length === 0)
    return alert("Dışa aktarılacak veri yok!");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Kutuphane Yonetim Sistemi Raporu", 14, 15);
  doc.autoTable({
    html: "#reports-table",
    startY: 25,
    styles: { font: "courier" },
  });

  doc.save(`Rapor_${Date.now()}.pdf`);
}

reports.addEventListener("click", async () => {
  dashboard.classList.add("hidden");
  viewReports.classList.remove("hidden");

  const members = await ipcRenderer.invoke("get-members");
  document.getElementById("rep-member").innerHTML =
    '<option value="">Tüm Üyeler</option>' +
    members
      .map((m) => `<option value="${m.uye_id}">${m.ad} ${m.soyad}</option>`)
      .join("");

  const categories = await ipcRenderer.invoke("get-categories");
  document.getElementById("rep-category").innerHTML =
    '<option value="">Tüm Kategoriler</option>' +
    categories
      .map((c) => `<option value="${c.kategori_id}">${c.kategori_ad}</option>`)
      .join("");
});

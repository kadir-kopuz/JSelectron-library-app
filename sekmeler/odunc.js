loans.addEventListener("click", () => {
  dashboard.classList.add("hidden");
  viewLoans.classList.remove("hidden");
  initLoanPage();
});

async function initLoanPage() {
  loadLoanSelects();
  loadActiveLoans();
}

async function loadLoanSelects() {
  const members = await ipcRenderer.invoke("get-members");
  const books = await ipcRenderer.invoke("get-books");

  const mSelect = document.getElementById("loan-member-select");
  const bSelect = document.getElementById("loan-book-select");

  mSelect.innerHTML =
    '<option value="">Üye Seçiniz...</option>' +
    members
      .map(
        (m) =>
          `<option value="${m.uye_id}">${m.ad} ${m.soyad} (${m.toplam_borc} TL Borç)</option>`
      )
      .join("");

  bSelect.innerHTML =
    '<option value="">Kitap Seçiniz...</option>' +
    books
      .filter((b) => b.mevcut_adet > 0)
      .map(
        (b) =>
          `<option value="${b.kitap_id}">${b.kitap_adi} (Stok: ${b.mevcut_adet})</option>`
      )
      .join("");
}

async function confirmLoan() {
  const uye_id = document.getElementById("loan-member-select").value;
  const kitap_id = document.getElementById("loan-book-select").value;

  if (!uye_id || !kitap_id) return alert("Lütfen üye ve kitap seçiniz!");

  const result = await ipcRenderer.invoke("add-loan", { uye_id, kitap_id });

  if (result.success) {
    alert("Kitap başarıyla ödünç verildi.");
    initLoanPage();
  } else {
    alert("Hata: " + result.error);
  }
}

async function loadActiveLoans() {
  const loansList = await ipcRenderer.invoke("get-active-loans");
  renderLoansTable(loansList);
}

function renderLoansTable(list) {
  const tbody = document.querySelector("#loans-table tbody");
  const thead = document.querySelector("#loans-table thead");

  thead.innerHTML = `<tr><th>Üye</th><th>Kitap</th><th>Son Teslim</th><th>İşlem</th></tr>`;
  tbody.innerHTML = list
    .map(
      (l) => `
    <tr>
      <td>${l.ad} ${l.soyad}</td>
      <td>${l.kitap_adi}</td>
      <td>${new Date(l.son_teslim_tarihi).toLocaleDateString("tr-TR")}</td>
      <td>
        <button class="btn-edit-loan"  onclick="returnBook(${l.odunc_id})">
          <i class="fa-solid fa-check"></i> Teslim Al
        </button>
      </td>
    </tr>
  `
    )
    .join("");
}

async function returnBook(oduncId) {
  if (
    confirm(
      "Kitap teslim alındı olarak işaretlensin mi? (Gecikme varsa ceza otomatik hesaplanacaktır)"
    )
  ) {
    const result = await ipcRenderer.invoke("return-book", oduncId);
    if (result.success) {
      alert("İşlem başarılı.");
      initLoanPage();
    } else {
      alert("Hata: " + result.error);
    }
  }
}

document.getElementById("search-loan").addEventListener("input", async (e) => {
  const term = e.target.value.toLowerCase();
  const allLoans = await ipcRenderer.invoke("get-active-loans");
  const filtered = allLoans.filter(
    (l) =>
      l.ad.toLowerCase().includes(term) ||
      l.soyad.toLowerCase().includes(term) ||
      l.kitap_adi.toLowerCase().includes(term)
  );
  renderLoansTable(filtered);
});

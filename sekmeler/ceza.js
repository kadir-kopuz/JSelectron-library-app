fines.addEventListener("click", async () => {
  dashboard.classList.add("hidden");
  viewFines.classList.remove("hidden");

  const members = await ipcRenderer.invoke("get-members");
  const filterSelect = document.getElementById("filter-fine-member");
  filterSelect.innerHTML =
    '<option value="">Tüm Üyeler</option>' +
    members
      .map((m) => `<option value="${m.uye_id}">${m.ad} ${m.soyad}</option>`)
      .join("");

  loadFines();
});

document
  .getElementById("filter-fine-member")
  .addEventListener("change", loadFines);
document.getElementById("fine-start").addEventListener("change", loadFines);
document.getElementById("fine-end").addEventListener("change", loadFines);

async function loadFines() {
  const memberId = document.getElementById("filter-fine-member").value;
  const startDate = document.getElementById("fine-start").value;
  const endDate = document.getElementById("fine-end").value;

  const filters = { memberId, startDate, endDate };
  const finesList = await ipcRenderer.invoke("get-fines", filters);

  if (finesList.error) {
    console.error(finesList.error);
    return;
  }

  if (memberId) {
    const totalDebt = await ipcRenderer.invoke("get-member-debt", memberId);
    document.getElementById("total-debt-display").innerText = `${totalDebt} TL`;
  } else {
    const currentTotal = finesList.reduce(
      (sum, item) => sum + parseFloat(item.tutar),
      0
    );
    document.getElementById(
      "total-debt-display"
    ).innerText = `${currentTotal.toFixed(2)} TL (Liste Toplamı)`;
  }

  renderFinesTable(finesList);
}

function renderFinesTable(list) {
  const tbody = document.querySelector("#fines-table tbody");
  tbody.innerHTML = list
    .map(
      (c) => `
    <tr>
      <td>${c.ad} ${c.soyad}</td>
      <td style="color: #e74c3c; font-weight: bold;">${c.tutar} TL</td>
      <td>${new Date(c.ceza_tarihi).toLocaleDateString("tr-TR")}</td>
      <td>
        <button class="btn-outline" onclick="showFineDetail(${c.odunc_id}, '${
        c.kitap_adi
      }', ${c.tutar})">
          <i class="fa-solid fa-circle-info"></i> Detay
        </button>
      </td>
    </tr>
  `
    )
    .join("");
}

async function showFineDetail(oduncId, kitapAdi, tutar) {
  alert(
    `Ceza Detayı:\n------------------\nKitap: ${kitapAdi}\nÖdünç No: ${oduncId}\nCeza Tutarı: ${tutar} TL\n\nBu ceza, kitabın son teslim tarihi geçtikten sonra iade edilmesi nedeniyle otomatik hesaplanmıştır.`
  );
}

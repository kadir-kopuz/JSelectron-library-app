function editMember(id) {
  const m = membersList.find((m) => m.id === id);
  document.getElementById("m-id").value = m.id;
  document.getElementById("m-name").value = m.name;
  document.getElementById("m-surname").value = m.surname;
  document.getElementById("m-email").value = m.email;
  document.getElementById("m-phone").value = m.phone;
  openModal("member-modal");
}

const { ipcRenderer } = require("electron");

async function loadMembers() {
  const membersList = await ipcRenderer.invoke("get-members");
  renderMembers(membersList);
}

function renderMembers(list) {
  const tbody = document.querySelector("#members-table tbody");
  tbody.innerHTML = "";

  list.forEach((m) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.uye_id}</td>
      <td>${m.ad} ${m.soyad}</td>
      <td>${m.e_posta}</td>
      <td>${m.telefon}</td>
      <td>
        <button class="btn-edit" onclick="editMember(${m.uye_id}, '${m.ad}', '${m.soyad}', '${m.e_posta}', '${m.telefon}')">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn-delete" onclick="deleteMember(${m.uye_id})">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function saveMember(e) {
  e.preventDefault();
  const id = document.getElementById("m-id").value;
  const memberData = {
    ad: document.getElementById("m-name").value,
    soyad: document.getElementById("m-surname").value,
    e_posta: document.getElementById("m-email").value,
    telefon: document.getElementById("m-phone").value,
  };

  let result;
  if (id) {
    result = await ipcRenderer.invoke("update-member", { id, ...memberData });
  } else {
    result = await ipcRenderer.invoke("add-member", memberData);
  }

  if (result.success) {
    closeModal("member-modal");
    loadMembers();
  } else {
    alert("Hata oluştu: " + result.error);
  }
}

function editMember(id, ad, soyad, email, telefon) {
  document.getElementById("m-id").value = id;
  document.getElementById("m-name").value = ad;
  document.getElementById("m-surname").value = soyad;
  document.getElementById("m-email").value = email;
  document.getElementById("m-phone").value = telefon;

  document.querySelector("#member-modal h3").innerText = "Üye Düzenle";
  openModal("member-modal");
}

async function deleteMember(id) {
  if (confirm("Bu üyeyi silmek istediğinize emin misiniz?")) {
    const result = await ipcRenderer.invoke("delete-member", id);
    if (result.success) {
      loadMembers();
    } else {
      alert("Silinemedi: " + result.error);
    }
  }
}

members.addEventListener("click", () => {
  dashboard.classList.add("hidden");
  viewMembers.classList.remove("hidden");
  loadMembers();
});

document
  .getElementById("search-member")
  .addEventListener("input", async (e) => {
    const term = e.target.value;
    if (term.length > 1) {
      const results = await ipcRenderer.invoke("search-members", term);
      renderMembers(results);
    } else if (term.length === 0) {
      loadMembers();
    }
  });

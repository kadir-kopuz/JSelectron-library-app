const selectFilter = document.getElementById("filter-category");

async function loadBooks() {
  const books = await ipcRenderer.invoke("get-books");
  renderBooks(books);
}

function renderBooks(list) {
  const tbody = document.querySelector("#books-table tbody");
  tbody.innerHTML = list
    .map(
      (b) => `
    <tr>
      <td>${b.kitap_id}</td>
      <td>${b.kitap_adi}</td>
      <td>${b.yazar}</td>
      <td>${b.kategori_ad || "Kategorisiz"}</td>
      <td>${b.mevcut_adet}/${b.toplam_adet}</td>
      <td>
        <button class="btn-edit" onclick="editBook(${b.kitap_id}, '${
        b.kitap_adi
      }', '${b.yazar}', ${b.kategori_id}, '${b.yayin_evi}', ${b.basim_yili}, ${
        b.toplam_adet
      })">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn-delete" onclick="deleteBook(${b.kitap_id})">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `
    )
    .join("");
}

async function saveBook(e) {
  e.preventDefault();
  const id = document.getElementById("b-id").value;
  const bookData = {
    ad: document.getElementById("b-name").value,
    yazar: document.getElementById("b-author").value,
    kategori_id: document.getElementById("b-category").value,
    yayinevi: document.getElementById("b-publisher").value,
    yil: document.getElementById("b-year").value,
    stok: document.getElementById("b-stock").value,
  };

  const channel = id ? "update-book" : "add-book";
  if (id) bookData.id = id;

  const result = await ipcRenderer.invoke(channel, bookData);
  if (result.success) {
    closeModal("book-modal");
    loadBooks();
  } else {
    alert("Hata: " + result.error);
  }
}

function editBook(id, ad, yazar, katId, yayinevi, yil, stok) {
  document.getElementById("b-id").value = id;
  document.getElementById("b-name").value = ad;
  document.getElementById("b-author").value = yazar;
  document.getElementById("b-category").value = katId;
  document.getElementById("b-publisher").value = yayinevi;
  document.getElementById("b-year").value = yil;
  document.getElementById("b-stock").value = stok;

  document.querySelector("#book-modal h3").innerText = "Kitap Düzenle";
  openModal("book-modal");
}

async function deleteBook(id) {
  if (confirm("Bu kitabı silmek istediğinize emin misiniz?")) {
    const result = await ipcRenderer.invoke("delete-book", id);
    if (result.success) loadBooks();
    else alert("Hata: " + result.error);
  }
}

document.getElementById("search-books").addEventListener("input", async (e) => {
  const term = e.target.value;
  if (term.length > 1) {
    const results = await ipcRenderer.invoke("search-books", term);
    renderBooks(results);
  } else if (term.length === 0) {
    loadBooks();
  }
});

books.addEventListener("click", () => {
  dashboard.classList.add("hidden");
  viewBooks.classList.remove("hidden");
  loadCategories();
  loadBooks();
});

async function loadCategories() {
  try {
    const categories = await ipcRenderer.invoke("get-categories");
    const selectModal = document.getElementById("b-category");
    const selectFilter = document.getElementById("filter-category");

    const optionsHtml = categories
      .map((c) => `<option value="${c.kategori_id}">${c.kategori_ad}</option>`)
      .join("");

    if (selectModal) {
      selectModal.innerHTML = optionsHtml;
    }

    if (selectFilter) {
      selectFilter.innerHTML =
        '<option value="">Tüm Kategoriler</option>' + optionsHtml;
    }
  } catch (error) {
    console.error("Kategoriler yüklenirken hata oluştu:", error);
  }
}

books.addEventListener("click", () => {
  dashboard.classList.add("hidden");
  viewBooks.classList.remove("hidden");
  loadCategories();
  loadBooks();
});

function openBookModal() {
  loadCategories();
  document.getElementById("b-id").value = "";
  document.getElementById("book-modal").style.display = "flex";
}

selectFilter.addEventListener("change", async (e) => {
  const categoryId = e.target.value;
  if (categoryId) {
    const filteredBooks = await ipcRenderer.invoke(
      "search-books-by-category",
      categoryId
    );
    renderBooks(filteredBooks);
  } else {
    loadBooks();
  }
});

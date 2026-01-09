const btnLogin = document.querySelector(".btn-login");
const loginScreen = document.querySelector("#login-screen");
const header = document.querySelector(".main-header");
const dashboard = document.querySelector("#view-dashboard");
const container = document.querySelector(".container");
const btnExit = document.querySelector(".btn-logout");
const members = document.querySelector(".members");
const books = document.querySelector(".books");
const loans = document.querySelector(".loans");
const fines = document.querySelector(".fines");
const reports = document.querySelector(".reports");
const dynamic = document.querySelector(".dynamic");
const viewMembers = document.querySelector("#view-members");
const viewBooks = document.querySelector("#view-books");
const viewLoans = document.querySelector("#view-loans");
const viewFines = document.querySelector("#view-fines");
const viewDynamic = document.querySelector("#view-dynamic");
const viewReports = document.querySelector("#view-reports");
const btnBack = document.querySelectorAll(".btn-back");
const loginInput = document.querySelectorAll(".login-inputs");

// btnLogin.addEventListener("click", () => {
//   loginScreen.classList.add("hidden");
//   header.classList.remove("hidden");
//   container.classList.remove("hidden");
// });

btnExit.addEventListener("click", () => {
  loginScreen.classList.remove("hidden");
  header.classList.add("hidden");
  container.classList.add("hidden");
});

btnBack.forEach((btn) => {
  btn.addEventListener("click", () => {
    viewMembers.classList.add("hidden");
    viewBooks.classList.add("hidden");
    viewLoans.classList.add("hidden");
    viewFines.classList.add("hidden");
    viewReports.classList.add("hidden");
    viewDynamic.classList.add("hidden");
    dashboard.classList.remove("hidden");
  });
});

members.addEventListener("click", () => {
  dashboard.classList.add("hidden");
  viewMembers.classList.remove("hidden");
  loadMembers();
});

books.addEventListener("click", () => {
  dashboard.classList.add("hidden");
  viewBooks.classList.remove("hidden");
  loadBooks();
});

loans.addEventListener("click", () => {
  dashboard.classList.add("hidden");
  viewLoans.classList.remove("hidden");
});

fines.addEventListener("click", () => {
  dashboard.classList.add("hidden");
  viewFines.classList.remove("hidden");
});

reports.addEventListener("click", () => {
  dashboard.classList.add("hidden");
  viewReports.classList.remove("hidden");
});

dynamic.addEventListener("click", () => {
  dashboard.classList.add("hidden");
  viewDynamic.classList.remove("hidden");
});

function openModal(modalId) {
  document.getElementById(modalId).style.display = "flex";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
  document.querySelectorAll("form").forEach((f) => f.reset());
  document.getElementById("m-id").value = "";
  document.getElementById("b-id").value = "";
}

const loginForm = document.querySelector("#loginForm");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const loginError = document.querySelector("#login-error");
const welcomeMsg = document.querySelector(".welcome-banner span");
const displayUsername = document.querySelector("#display-username");

loginError.style.display = "none";

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameInput.value;
  const password = passwordInput.value;

  try {
    const response = await ipcRenderer.invoke("login-attempt", {
      username,
      password,
    });

    if (response.success) {
      loginError.style.display = "none";
      loginScreen.classList.add("hidden");
      header.classList.remove("hidden");
      container.classList.remove("hidden");
      welcomeMsg.textContent = `${response.user.kullanici_adi}!`;
      displayUsername.textContent = response.user.rol;
      usernameInput.value = "";
      passwordInput.value = "";

      console.log("Hoş geldin:", response.user.kullanici_adi);
    } else {
      loginError.style.display = "block";
      loginError.textContent = response.message;
    }
  } catch (err) {
    console.error("Giriş hatası:", err);
    alert("Bir hata oluştu.");
  }
});

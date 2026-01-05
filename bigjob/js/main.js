const DOMAIN = "laplateforme.io";
const STORAGE_KEY = "lp-presence-data";
const USER_KEY = "lp-current-user";

const presenceForm = document.getElementById("presence-form");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const dashboard = document.getElementById("dashboard");
const myRequestsContainer = document.getElementById("my-requests");
const moderatorPanel = document.getElementById("moderator-panel");
const adminPanel = document.getElementById("admin-panel");
const userLabel = document.getElementById("user-label");
const logoutBtn = document.getElementById("logout-btn");
const roleBadge = document.getElementById("role-badge");

let data = { users: [], requests: [] };
let currentUser = null;

function todayISO() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString().split("T")[0];
}

function isPastDate(dateStr) {
  return new Date(dateStr) < new Date(todayISO());
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function hydrate() {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    data = JSON.parse(cached);
  } else {
    const res = await fetch("assets/data.json");
    data = await res.json();
    persist();
  }
  const userId = localStorage.getItem(USER_KEY);
  currentUser = data.users.find((u) => u.id === userId) || null;
}

function setMinDate() {
  const dateInput = presenceForm?.elements["date"];
  if (dateInput) dateInput.min = todayISO();
}

function requireDomain(email) {
  const parts = email.split("@");
  return parts.length === 2 && parts[1].toLowerCase() === DOMAIN;
}

function statusPill(status) {
  const base = { pending: "En attente", approved: "Acceptée", rejected: "Refusée" };
  return `<span class="status-pill ${status}">${base[status] || status}</span>`;
}

function renderUserInfo() {
  if (currentUser) {
    userLabel.textContent = `${currentUser.fullName} (${currentUser.email})`;
    logoutBtn.classList.remove("hidden");
  } else {
    userLabel.textContent = "Non connecté";
    logoutBtn.classList.add("hidden");
  }
}

function renderRoleBadge() {
  roleBadge.innerHTML = "";
  if (!currentUser) return;
  const pill = document.createElement("span");
  pill.className = "px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700";
  pill.textContent = currentUser.role;
  roleBadge.appendChild(pill);
}

function renderDashboardVisibility() {
  if (currentUser) {
    dashboard.classList.remove("hidden");
  } else {
    dashboard.classList.add("hidden");
  }
}

function renderMyRequests() {
  if (!currentUser) return;
  const mine = data.requests.filter((r) => r.userId === currentUser.id).sort((a, b) => a.date.localeCompare(b.date));
  if (!mine.length) {
    myRequestsContainer.innerHTML = '<p class="text-sm text-slate-500">Aucune demande pour le moment.</p>';
    return;
  }
  myRequestsContainer.innerHTML = mine
    .map((r) => {
      const disabled = isPastDate(r.date);
      const cancelBtn = r.status === "pending" && !disabled
        ? `<button data-id="${r.id}" class="cancel-btn text-xs text-red-600 hover:text-red-700">Annuler</button>`
        : "";
      return `<div class="flex items-center justify-between border border-slate-100 rounded-xl p-3">
        <div>
          <p class="font-medium">${r.date} — ${r.slot}</p>
          <p class="text-xs text-slate-500">${disabled ? "Date passée" : "Modifiable jusqu'à la date"}</p>
        </div>
        <div class="flex items-center gap-3">${statusPill(r.status)} ${cancelBtn}</div>
      </div>`;
    })
    .join("");
  myRequestsContainer.querySelectorAll(".cancel-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      data.requests = data.requests.filter((r) => r.id !== id);
      persist();
      renderAll();
    });
  });
}

function renderModeratorPanel() {
  if (!currentUser || (currentUser.role !== "moderator" && currentUser.role !== "admin")) {
    moderatorPanel.innerHTML = "Connectez-vous en tant que modérateur pour valider.";
    return;
  }
  if (!data.requests.length) {
    moderatorPanel.innerHTML = '<p class="text-sm text-slate-500">Aucune demande.</p>';
    return;
  }
  moderatorPanel.innerHTML = data.requests
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => {
      const user = data.users.find((u) => u.id === r.userId);
      const disabled = isPastDate(r.date) || r.status !== "pending";
      const baseBtns = disabled
        ? ""
        : `<div class="flex gap-2">
            <button data-id="${r.id}" data-action="approved" class="px-3 py-1 rounded-md text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Accepter</button>
            <button data-id="${r.id}" data-action="rejected" class="px-3 py-1 rounded-md text-xs bg-rose-100 text-rose-700 hover:bg-rose-200">Refuser</button>
          </div>`;
      return `<div class="border border-slate-100 rounded-xl p-3 space-y-1">
        <div class="flex items-center justify-between">
          <p class="font-medium">${r.date} — ${r.slot}</p>
          ${statusPill(r.status)}
        </div>
        <p class="text-sm text-slate-600">${user?.fullName || "Utilisateur"} • ${user?.email || ""}</p>
        ${isPastDate(r.date) ? '<p class="text-xs text-slate-400">Date passée, décision figée.</p>' : baseBtns}
      </div>`;
    })
    .join("");

  moderatorPanel.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");
      const req = data.requests.find((r) => r.id === id);
      if (!req || isPastDate(req.date) || req.status !== "pending") return;
      req.status = action;
      persist();
      renderAll();
    });
  });
}

function renderAdminPanel() {
  if (!currentUser || currentUser.role !== "admin") {
    adminPanel.innerHTML = "Réservé aux administrateurs.";
    return;
  }
  adminPanel.innerHTML = data.users
    .map((u) => {
      const disabled = currentUser.id === u.id;
      const note = disabled ? '<p class="text-[11px] text-slate-400">Vous ne pouvez pas changer votre propre rôle.</p>' : "";
      return `<div class="border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3">
        <div>
          <p class="font-medium">${u.fullName}</p>
          <p class="text-xs text-slate-500">${u.email}</p>
          ${note}
        </div>
        <select data-id="${u.id}" class="rounded-lg border-slate-200" ${disabled ? "disabled" : ""}>
          <option value="student" ${u.role === "student" ? "selected" : ""}>student</option>
          <option value="moderator" ${u.role === "moderator" ? "selected" : ""}>moderator</option>
          <option value="admin" ${u.role === "admin" ? "selected" : ""}>admin</option>
        </select>
      </div>`;
    })
    .join("");

  adminPanel.querySelectorAll("select[data-id]").forEach((select) => {
    select.addEventListener("change", () => {
      const id = select.getAttribute("data-id");
      const user = data.users.find((u) => u.id === id);
      if (!user) return;
      user.role = select.value;
      persist();
      renderAll();
    });
  });
}

function renderAll() {
  renderUserInfo();
  renderRoleBadge();
  renderDashboardVisibility();
  if (currentUser) {
    renderMyRequests();
    renderModeratorPanel();
    renderAdminPanel();
  }
}

function handleLogin(e) {
  e.preventDefault();
  const formData = new FormData(loginForm);
  const email = formData.get("email").toLowerCase();
  const password = formData.get("password");
  const user = data.users.find((u) => u.email === email && u.password === password);
  if (!user) {
    alert("Identifiants invalides");
    return;
  }
  currentUser = user;
  localStorage.setItem(USER_KEY, user.id);
  renderAll();
}

function handleSignup(e) {
  e.preventDefault();
  const formData = new FormData(signupForm);
  const fullName = formData.get("fullName");
  const email = formData.get("email").toLowerCase();
  const password = formData.get("password");

  if (!requireDomain(email)) {
    alert(`Le domaine doit être ${DOMAIN}`);
    return;
  }
  if (data.users.some((u) => u.email === email)) {
    alert("Un compte existe déjà avec cet email.");
    return;
  }
  const newUser = {
    id: `u-${crypto.randomUUID()}`,
    fullName,
    email,
    password,
    role: "student",
  };
  data.users.push(newUser);
  persist();
  currentUser = newUser;
  localStorage.setItem(USER_KEY, newUser.id);
  renderAll();
  signupForm.reset();
}

function handlePresence(e) {
  e.preventDefault();
  if (!currentUser) return;
  const formData = new FormData(presenceForm);
  const date = formData.get("date");
  const slot = formData.get("slot");
  if (!date) return;
  if (isPastDate(date)) {
    alert("Impossible de demander pour une date passée.");
    return;
  }
  const duplicate = data.requests.some((r) => r.userId === currentUser.id && r.date === date && r.slot === slot);
  if (duplicate) {
    alert("Demande déjà existante pour ce créneau.");
    return;
  }
  const req = {
    id: `r-${crypto.randomUUID()}`,
    userId: currentUser.id,
    date,
    slot,
    status: "pending",
  };
  data.requests.push(req);
  persist();
  renderAll();
  presenceForm.reset();
  setMinDate();
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem(USER_KEY);
  renderAll();
}

function attachListeners() {
  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (signupForm) signupForm.addEventListener("submit", handleSignup);
  if (presenceForm) presenceForm.addEventListener("submit", handlePresence);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
}

(async function init() {
  await hydrate();
  setMinDate();
  attachListeners();
  renderAll();
})();

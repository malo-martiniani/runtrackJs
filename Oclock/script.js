// --- Horloge ---
function showTime() {
  const clock = document.getElementById("MyClockDisplay");
  if (!clock) return;

  const date = new Date();
  const h = formatNumber(date.getHours());
  const m = formatNumber(date.getMinutes());
  const s = formatNumber(date.getSeconds());

  clock.textContent = `${h}:${m}:${s}`;
  setTimeout(showTime, 1000);
}

function formatNumber(num) {
  return num < 10 ? "0" + num : String(num);
}

// --- Minuteur ---
let intervalId = null;
let tempsRestant = 0;

function demarrerMinuteur() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }

  const mins = parseInt(document.getElementById("minutes")?.value, 10) || 0;
  const secsInput = parseInt(document.getElementById("secondes")?.value, 10) || 0;
  const secs = Math.min(Math.max(secsInput, 0), 59);

  tempsRestant = Math.max(0, mins * 60 + secs);
  afficherTemps(tempsRestant);
  if (tempsRestant === 0) return;

  intervalId = setInterval(function () {
    tempsRestant--;
    afficherTemps(tempsRestant);
    if (tempsRestant <= 0) {
      arreterMinuteur();
      alert("Temps ecoulee !");
    }
  }, 1000);
}

function arreterMinuteur() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function resetMinuteur() {
  arreterMinuteur();
  tempsRestant = 0;
  afficherTemps(tempsRestant);
}

function afficherTemps(secondes) {
  const minutes = Math.floor(secondes / 60);
  const secs = secondes % 60;
  const affichage = formatNumber(minutes) + ":" + formatNumber(secs);
  const target = document.getElementById("MyMinuteurDisplay");
  if (target) target.textContent = affichage;
}

// --- Chronometre ---
let chronoInterval = null;
let chronoStart = 0;
let chronoElapsed = 0;
let chronoLaps = [];

function formatHMS(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
}

function renderChronoTime() {
  const display = document.getElementById("chrono-display");
  if (!display) return;
  const running = Boolean(chronoInterval);
  const currentElapsed = running ? chronoElapsed + (Date.now() - chronoStart) : chronoElapsed;
  display.textContent = formatHMS(currentElapsed);
}

function renderChronoControls() {
  const toggleBtn = document.getElementById("chrono-toggle");
  const lapBtn = document.getElementById("chrono-lap");
  const resetBtn = document.getElementById("chrono-reset");
  const lapsList = document.getElementById("chrono-laps");

  const running = Boolean(chronoInterval);
  if (toggleBtn) {
    toggleBtn.textContent = running ? "Arreter" : (chronoElapsed > 0 ? "Reprendre" : "Demarrer");
  }
  if (lapBtn) {
    lapBtn.disabled = !running;
  }
  if (resetBtn) {
    resetBtn.disabled = !running && chronoElapsed === 0 && chronoLaps.length === 0;
  }
  if (lapsList) {
    if (!chronoLaps.length) {
      lapsList.innerHTML = "<li>Aucun tour enregistre.</li>";
    } else {
      lapsList.innerHTML = chronoLaps
        .map((lapMs, index) => `<li>Tour ${index + 1} - ${formatHMS(lapMs)}</li>`)
        .join("");
    }
  }
}

function startChrono() {
  if (chronoInterval) return;
  chronoStart = Date.now();
  chronoInterval = setInterval(renderChronoTime, 200);
  renderChronoControls();
}

function stopChrono() {
  if (!chronoInterval) return;
  chronoElapsed += Date.now() - chronoStart;
  clearInterval(chronoInterval);
  chronoInterval = null;
  renderChronoTime();
  renderChronoControls();
}

function toggleChrono() {
  if (chronoInterval) {
    stopChrono();
  } else {
    startChrono();
  }
}

function resetChrono() {
  stopChrono();
  chronoElapsed = 0;
  chronoLaps = [];
  renderChronoTime();
  renderChronoControls();
}

function addChronoLap() {
  if (!chronoInterval) return;
  const total = chronoElapsed + (Date.now() - chronoStart);
  chronoLaps.push(total);
  renderChronoControls();
}

function initChrono() {
  const display = document.getElementById("chrono-display");
  if (!display) return;
  renderChronoTime();
  renderChronoControls();

  document.getElementById("chrono-toggle")?.addEventListener("click", toggleChrono);
  document.getElementById("chrono-lap")?.addEventListener("click", addChronoLap);
  document.getElementById("chrono-reset")?.addEventListener("click", resetChrono);
}

// --- Reveil / Alarme ---
let alarms = [];
let alarmTickInterval = null;

function computeNextTrigger(timeStr) {
  const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime();
}

function formatAlarmStatus(alarm) {
  if (alarm.triggered) return "Passee";
  const now = Date.now();
  const diffMs = alarm.target - now;
  if (diffMs <= 0) return "Passee";
  const diffMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const parts = [];
  if (hours) parts.push(`${hours}h`);
  parts.push(`${minutes}min`);
  return `Dans ${parts.join(" ")}`;
}

function renderAlarms() {
  const list = document.getElementById("alarm-list");
  if (!list) return;
  if (!alarms.length) {
    list.innerHTML = "<li>Aucune alarme programmee.</li>";
    return;
  }
  list.innerHTML = alarms
    .map((alarm) => {
      const status = formatAlarmStatus(alarm);
      return `<li class="alarm-item">
        <div class="alarm-row">
          <span class="alarm-time">${alarm.time}</span>
          <span class="alarm-status">${status}</span>
        </div>
        <div class="alarm-row">
          <span class="alarm-message">${alarm.message}</span>
          <button data-id="${alarm.id}" class="alarm-delete">Supprimer</button>
        </div>
      </li>`;
    })
    .join("");

  list.querySelectorAll(".alarm-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      alarms = alarms.filter((a) => a.id !== id);
      renderAlarms();
    });
  });
}

function addAlarm(event) {
  if (event) event.preventDefault();
  const timeInput = document.getElementById("alarm-time");
  const messageInput = document.getElementById("alarm-message");
  if (!timeInput || !messageInput) return;

  const timeValue = timeInput.value.trim();
  const messageValue = messageInput.value.trim();
  if (!timeValue || !messageValue) {
    alert("Veuillez saisir une heure et un message.");
    return;
  }

  const target = computeNextTrigger(timeValue);
  if (!target) {
    alert("Heure invalide.");
    return;
  }

  const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  alarms.push({ id, time: timeValue, message: messageValue, target, triggered: false });
  renderAlarms();
  timeInput.value = "";
  messageInput.value = "";
}

function tickAlarms() {
  const now = Date.now();
  alarms.forEach((alarm) => {
    if (!alarm.triggered && now >= alarm.target) {
      alarm.triggered = true;
      alert(`Alarme: ${alarm.message}`);
    }
  });
  renderAlarms();
}

function initAlarms() {
  const list = document.getElementById("alarm-list");
  if (!list) return;

  document.getElementById("add-alarm")?.addEventListener("click", addAlarm);
  renderAlarms();

  if (!alarmTickInterval) {
    alarmTickInterval = setInterval(tickAlarms, 1000);
  }
}

// --- Boot ---
showTime();
afficherTemps(0);
initChrono();
initAlarms();

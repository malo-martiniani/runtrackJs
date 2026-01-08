function showTime() {
  var date = new Date();
  var h = date.getHours(); // 0 - 23
  var m = date.getMinutes(); // 0 - 59
  var s = date.getSeconds(); // 0 - 59

  h = h < 10 ? "0" + h : h;
  m = m < 10 ? "0" + m : m;
  s = s < 10 ? "0" + s : s;

  var time = h + ":" + m + ":" + s;

  document.getElementById("MyClockDisplay").textContent = time;

  setTimeout(showTime, 1000);
}

function formatNumber(num) {
  return num < 10 ? "0" + num : num;
}

let intervalId = null;
let tempsRestant = 0;

function demarrerMinuteur() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }

  const mins = parseInt(document.getElementById("minutes").value, 10) || 0;
  const secsInput = parseInt(document.getElementById("secondes").value, 10) || 0;
  const secs = Math.min(Math.max(secsInput, 0), 59);

  tempsRestant = Math.max(0, mins * 60 + secs);
  afficherTemps(tempsRestant);
  if (tempsRestant === 0) return;

  intervalId = setInterval(function () {
    tempsRestant--;
    afficherTemps(tempsRestant);
    if (tempsRestant <= 0) {
      arreterMinuteur();
      alert("Temps écoulé !");
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
  document.getElementById("MyMinuteurDisplay").textContent = affichage;
}

if (document.getElementById("MyClockDisplay")) {
  showTime();
}

showTime();

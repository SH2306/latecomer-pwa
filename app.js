// 🔗 Replace this with your actual Apps Script WebApp URL
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwLAL4YDjL21WmDGoQtLjesexDphjyNwNBXQ0bSUCLaUVjMZ_qdR9vhHfia7e3ZyEYtiQ/exec";

const studentIdInput = document.getElementById("studentId");
const btnSubmitManual = document.getElementById("btnSubmitManual");
const btnStartQR = document.getElementById("btnStartQR");
const btnStopQR = document.getElementById("btnStopQR");
const btnSync = document.getElementById("btnSync");
const messageEl = document.getElementById("message");
const queueList = document.getElementById("queueList");

let html5QrCode;
let offlineQueue = JSON.parse(localStorage.getItem("offlineQueue") || "[]");

// Show status message
function showMessage(text, type = "success") {
  messageEl.textContent = text;
  messageEl.className = type;
}

// Render queue
function renderQueue() {
  queueList.innerHTML = "";
  offlineQueue.forEach((entry, i) => {
    const li = document.createElement("li");
    li.className = "list-group-item small";
    li.textContent = `${entry.name || entry.id} at ${entry.time}`;
    queueList.appendChild(li);
  });
}
renderQueue();

// Save queue
function saveQueue() {
  localStorage.setItem("offlineQueue", JSON.stringify(offlineQueue));
}

// Mark Latecomer (online/offline)
async function markLatecomer(studentId) {
  const now = new Date();
  const timestamp = now.toLocaleString();

  try {
    const res = await fetch(`${WEBAPP_URL}?id=${encodeURIComponent(studentId)}`);
    if (!res.ok) throw new Error("Network error");
    const data = await res.json();

    if (data.status && data.color === "green") {
      showMessage(`✅ ${data.name} • ${data.class}-${data.division} at ${data.time}`, "success");
    } else {
      showMessage(data.status || "❌ Error", "error");
    }
  } catch (err) {
    // Save offline
    offlineQueue.push({
      id: studentId,
      time: timestamp
    });
    saveQueue();
    renderQueue();
    showMessage(`📴 Saved offline: ${studentId} at ${timestamp}`, "error");
  }
}

// Manual Entry Submit
btnSubmitManual.addEventListener("click", () => {
  const id = studentIdInput.value.trim();
  if (!id) return showMessage("❌ Enter Student ID", "error");
  markLatecomer(id);
  studentIdInput.value = "";
});

// Sync Pending Entries
btnSync.addEventListener("click", async () => {
  if (!offlineQueue.length) return showMessage("No pending entries", "error");

  const pending = [...offlineQueue];
  offlineQueue = [];
  saveQueue();
  renderQueue();

  for (let entry of pending) {
    await markLatecomer(entry.id);
  }
});

// QR Scanner
btnStartQR.addEventListener("click", () => {
  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("reader");
  }
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      html5QrCode.stop();
      btnStartQR.disabled = false;
      btnStopQR.disabled = true;
      markLatecomer(decodedText);
    },
    (errorMessage) => {
      console.log("QR Scan error:", errorMessage);
    }
  );
  btnStartQR.disabled = true;
  btnStopQR.disabled = false;
});

btnStopQR.addEventListener("click", () => {
  if (html5QrCode) {
    html5QrCode.stop();
    btnStartQR.disabled = false;
    btnStopQR.disabled = true;
  }
});

// -------------------- CONFIG --------------------
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxeACCBVOprVJ1XNK3TdCtL_7l_J6SxxmIfBbM8JrNik17Y8mPpkDYk6Htys8EXWAOeAQ/exec";
const studentIdInput = document.getElementById("studentId");
const btnSubmitManual = document.getElementById("btnSubmitManual");
const btnSync = document.getElementById("btnSync");
const messageBox = document.getElementById("message");
const queueList = document.getElementById("queueList");
const btnStartQR = document.getElementById("btnStartQR");
const btnStopQR = document.getElementById("btnStopQR");
const qrReaderId = "reader";

let offlineQueue = [];
let html5QrcodeScanner;

// -------------------- LOCAL STORAGE --------------------
function loadQueue() {
  const data = localStorage.getItem("latecomerQueue");
  offlineQueue = data ? JSON.parse(data) : [];
  renderQueue();
}

function saveQueue() {
  localStorage.setItem("latecomerQueue", JSON.stringify(offlineQueue));
}

function renderQueue() {
  queueList.innerHTML = "";
  offlineQueue.forEach(item => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = `${item.name || item.id} at ${item.time || "Pending"}`;
    queueList.appendChild(li);
  });
}

// -------------------- SUBMIT FUNCTION --------------------
function submitLatecomer(id) {
  if (!id) return;
  const timestamp = new Date();
  const timeStr = timestamp.toLocaleTimeString("en-IN", { hour12: true });
  
  fetch(`${WEBAPP_URL}?id=${id}`)
    .then(res => res.json())
    .then(data => {
      if (data.status && data.status.includes("✅")) {
        messageBox.textContent = `${data.name} • ${data.class}-${data.division} at ${data.time}`;
        messageBox.style.color = "green";
        offlineQueue.push({ id: data.id, name: data.name, class: data.class, division: data.division, time: data.time });
        saveQueue();
        renderQueue();
      } else {
        messageBox.textContent = data.status || "❌ Error";
        messageBox.style.color = "red";
      }
    })
    .catch(err => {
      // Offline mode: save locally
      messageBox.textContent = "📴 Saved offline";
      messageBox.style.color = "blue";
      offlineQueue.push({ id: id, name: null, time: timestamp.toLocaleString("en-IN") });
      saveQueue();
      renderQueue();
    });
}

// -------------------- MANUAL ENTRY --------------------
btnSubmitManual.addEventListener("click", () => {
  const id = studentIdInput.value.trim();
  studentIdInput.value = "";
  submitLatecomer(id);
});

// -------------------- OFFLINE SYNC --------------------
btnSync.addEventListener("click", () => {
  if (!navigator.onLine) {
    messageBox.textContent = "❌ You are offline. Connect to internet to sync.";
    messageBox.style.color = "red";
    return;
  }

  const queueCopy = [...offlineQueue];
  offlineQueue = [];
  saveQueue();
  renderQueue();

  queueCopy.forEach(item => {
    if (item.id) submitLatecomer(item.id);
  });

  messageBox.textContent = "⬆️ Syncing pending entries...";
  messageBox.style.color = "green";
});

// -------------------- QR SCANNER --------------------
btnStartQR.addEventListener("click", () => {
  html5QrcodeScanner = new Html5Qrcode(qrReaderId);
  Html5Qrcode.getCameras().then(cameras => {
    if (cameras && cameras.length) {
      html5QrcodeScanner.start(
        cameras[0].id,
        { fps: 10, qrbox: 250 },
        qrCodeMessage => {
          const id = qrCodeMessage.trim();
          studentIdInput.value = id;
          submitLatecomer(id);
          stopQRScanner();
        },
        err => console.warn("QR scan error:", err)
      );
      btnStartQR.disabled = true;
      btnStopQR.disabled = false;
    } else {
      messageBox.textContent = "❌ No camera found";
      messageBox.style.color = "red";
    }
  }).catch(err => {
    messageBox.textContent = "❌ Camera error: " + err;
    messageBox.style.color = "red";
  });
});

btnStopQR.addEventListener("click", stopQRScanner);

function stopQRScanner() {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.stop().then(() => {
      html5QrcodeScanner.clear();
      btnStartQR.disabled = false;
      btnStopQR.disabled = true;
    }).catch(err => console.error(err));
  }
}

// -------------------- INIT --------------------
window.addEventListener("load", () => {
  loadQueue();
});

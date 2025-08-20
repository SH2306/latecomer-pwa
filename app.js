const GAS_URL = "https://script.google.com/macros/s/AKfycbzjX3tLfsq4lBNUkSNyLYtur5RE7ATcvo4m7i6xeI_XXDcCjuJJe5rSo7eoFFcPEYjJbw/exec";

let queue = JSON.parse(localStorage.getItem("latecomerQueue") || "[]");
const studentInput = document.getElementById("studentId");
const studentList = document.getElementById("studentList");
const btnSubmit = document.getElementById("btnSubmitManual");
const messageDiv = document.getElementById("message");
const queueList = document.getElementById("queueList");
const btnSync = document.getElementById("btnSync");

function updateQueueUI() {
  queueList.innerHTML = "";
  queue.forEach(item => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = `${item.name} • ${item.time}`;
    queueList.appendChild(li);
  });
}
updateQueueUI();

// Manual entry submission
btnSubmit.addEventListener("click", () => {
  const id = studentInput.value.trim();
  if (!id) return;
  markLate(id);
  studentInput.value = "";
});

// Fetch student data from Apps Script
async function markLate(studentId) {
  try {
    const res = await fetch(`${GAS_URL}?id=${studentId}`);
    const data = await res.json();
    if (data.status.includes("✅")) {
      showMessage(`${data.name} • ${data.class}-${data.division} marked late at ${data.time}`, "success");
    } else {
      showMessage(data.status, "error");
    }
  } catch (err) {
    // Offline: add to local queue
    const now = new Date();
    queue.push({ id: studentId, name: studentId, time: now.toLocaleString() });
    localStorage.setItem("latecomerQueue", JSON.stringify(queue));
    updateQueueUI();
    showMessage(`📴 Saved offline: ${studentId}`, "error");
  }
}

function showMessage(msg, type) {
  messageDiv.textContent = msg;
  messageDiv.className = type === "success" ? "fw-semibold success" : "fw-semibold error";
  setTimeout(() => { messageDiv.textContent = ""; }, 4000);
}

// Sync offline queue
btnSync.addEventListener("click", async () => {
  const copyQueue = [...queue];
  for (const item of copyQueue) {
    await markLate(item.id);
    queue = queue.filter(q => q.id !== item.id);
    localStorage.setItem("latecomerQueue", JSON.stringify(queue));
    updateQueueUI();
  }
});

// QR Code scanning
let html5QrcodeScanner;
const btnStartQR = document.getElementById("btnStartQR");
const btnStopQR = document.getElementById("btnStopQR");
const readerDiv = document.getElementById("reader");

btnStartQR.addEventListener("click", () => {
  html5QrcodeScanner = new Html5Qrcode("reader");
  Html5Qrcode.getCameras().then(cameras => {
    if (cameras && cameras.length) {
      html5QrcodeScanner.start(cameras[0].id, { fps: 10, qrbox: 250 },
        qrCodeMessage => {
          markLate(qrCodeMessage);
        },
        err => {
          console.log("QR Error", err);
        }
      );
      btnStartQR.disabled = true;
      btnStopQR.disabled = false;
    }
  }).catch(err => showMessage("❌ Camera error: " + err, "error"));
});

btnStopQR.addEventListener("click", () => {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.stop().then(() => {
      readerDiv.innerHTML = "";
      btnStartQR.disabled = false;
      btnStopQR.disabled = true;
    });
  }
});

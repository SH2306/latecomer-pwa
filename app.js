const WEBAPP_URL = "YOUR_WEBAPP_URL_HERE"; // Replace with your Apps Script Web App URL

// Offline queue
let queue = JSON.parse(localStorage.getItem("offlineQueue") || "[]");

// DOM elements
const studentInput = document.getElementById("studentName");
const studentList = document.getElementById("studentList");
const btnSubmit = document.getElementById("btnSubmitManual");
const btnSync = document.getElementById("btnSync");
const message = document.getElementById("message");
const queueList = document.getElementById("queueList");

// Display offline queue
function renderQueue() {
  queueList.innerHTML = "";
  queue.forEach(item => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = `${item.name} • ${item.class}-${item.division} at ${item.time}`;
    queueList.appendChild(li);
  });
}
renderQueue();

// Autocomplete
studentInput.addEventListener("input", async () => {
  const query = studentInput.value.trim();
  if (!query) return;

  try {
    const res = await fetch(`${WEBAPP_URL}?action=search&name=${encodeURIComponent(query)}`);
    const data = await res.json();
    studentList.innerHTML = "";
    data.forEach(s => {
      const option = document.createElement("option");
      option.value = `${s.name} • ${s.class}-${s.division}`;
      studentList.appendChild(option);
    });
  } catch (err) {
    console.error("Autocomplete error", err);
  }
});

// Submit late entry
btnSubmit.addEventListener("click", async () => {
  const value = studentInput.value.trim();
  if (!value) return;
  const namePart = value.split(" • ")[0]; // extract actual name
  try {
    const res = await fetch(`${WEBAPP_URL}?action=mark&name=${encodeURIComponent(namePart)}`);
    const data = await res.json();
    if (data.status.includes("✅")) {
      showMessage(`${data.name} • ${data.class}-${data.division} marked late at ${data.time}`, "success");
      studentInput.value = "";
    } else {
      // offline push
      queue.push({name:namePart, class:data.class||"-", division:data.division||"-", time:new Date().toLocaleString()});
      localStorage.setItem("offlineQueue", JSON.stringify(queue));
      renderQueue();
      showMessage(`Saved offline: ${namePart}`, "error");
    }
  } catch (err) {
    queue.push({name:namePart, class:"-", division:"-", time:new Date().toLocaleString()});
    localStorage.setItem("offlineQueue", JSON.stringify(queue));
    renderQueue();
    showMessage(`Saved offline: ${namePart}`, "error");
  }
});

// Sync offline queue
btnSync.addEventListener("click", async () => {
  const oldQueue = [...queue];
  for (let i=0;i<queue.length;i++){
    const entry = queue[i];
    try {
      await fetch(`${WEBAPP_URL}?action=mark&name=${encodeURIComponent(entry.name)}`);
      queue.splice(i,1);
      i--;
    } catch(e){ console.error("Sync failed", e); }
  }
  localStorage.setItem("offlineQueue", JSON.stringify(queue));
  renderQueue();
  showMessage(`Synced ${oldQueue.length - queue.length} entries`, "success");
});

// message helper
function showMessage(txt,type){
  message.textContent = txt;
  message.className = type==="success" ? "fw-semibold text-success" : "fw-semibold text-danger";
  setTimeout(()=>{ message.textContent=""; }, 5000);
}

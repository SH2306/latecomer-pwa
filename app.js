const GAS_URL = "https://script.google.com/macros/s/AKfycbwJ-ATrkbEbhUyowe7UdPOCdmWctnPZMdKADFE-xjED_UJoLfXo3sSo2RNVjJCIDuvL2Q/exec"; // Replace with your Apps Script URL
const messageEl = document.getElementById('message');
const studentInput = document.getElementById('studentName');
const autocompleteList = document.getElementById('autocomplete-list');

let offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');

function saveQueue() {
  localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
  renderQueue();
}

function renderQueue() {
  const queueList = document.getElementById('queueList');
  if (!queueList) return;
  queueList.innerHTML = '';
  offlineQueue.forEach(item => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = `${item.name} • ${item.class}-${item.division} at ${item.time}`;
    queueList.appendChild(li);
  });
}

// Fetch matching students
async function searchStudents(query) {
  const url = `${GAS_URL}?action=search&name=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url);
    return await res.json();
  } catch {
    return [];
  }
}

// Render autocomplete
function renderAutocomplete(students) {
  autocompleteList.innerHTML = '';
  students.forEach(s => {
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    item.textContent = `${s.name} • ${s.class}-${s.division}`;
    item.onclick = () => {
      studentInput.value = s.name;
      autocompleteList.innerHTML = '';
    };
    autocompleteList.appendChild(item);
  });
}

// Input event
studentInput.addEventListener('input', async () => {
  const query = studentInput.value.trim();
  if (!query) return autocompleteList.innerHTML = '';
  const students = await searchStudents(query);
  renderAutocomplete(students);
});

// Mark student late
document.getElementById('btnSubmit').addEventListener('click', async () => {
  const name = studentInput.value.trim();
  if (!name) return alert('Enter a student name!');
  
  const payload = { action: 'mark', name };
  
  try {
    const res = await fetch(`${GAS_URL}?action=mark&name=${encodeURIComponent(name)}`);
    const data = await res.json();
    if (data.color === 'green') {
      messageEl.textContent = `✅ ${data.name} • ${data.class}-${data.division} marked late at ${data.time}`;
      messageEl.className = 'fw-semibold success';
      studentInput.value = '';
    } else {
      throw new Error(data.status);
    }
  } catch {
    // Offline: save to queue
    const now = new Date();
    offlineQueue.push({ name, class: '-', division: '-', time: now.toLocaleString() });
    saveQueue();
    messageEl.textContent = `📴 Saved offline: ${name}`;
    messageEl.className = 'fw-semibold error';
    studentInput.value = '';
  }
});

// Sync offline queue
document.getElementById('btnSync')?.addEventListener('click', async () => {
  const queueCopy = [...offlineQueue];
  for (let item of queueCopy) {
    try {
      const res = await fetch(`${GAS_URL}?action=mark&name=${encodeURIComponent(item.name)}`);
      const data = await res.json();
      if (data.color === 'green') {
        offlineQueue = offlineQueue.filter(q => q.name !== item.name);
        saveQueue();
      }
    } catch { }
  }
  alert('Offline queue synced if online.');
});

// Initialize queue render
renderQueue();

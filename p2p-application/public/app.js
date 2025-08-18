// Register Worker
document.getElementById('workerForm').onsubmit = async function(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(this).entries());
    await fetch('/api/register-worker', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
    });
    loadLists();
    this.reset();
};

// Post Request
document.getElementById('requestForm').onsubmit = async function(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(this).entries());
    await fetch('/api/post-request', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
    });
    loadLists();
    this.reset();
};

// List Workers & Requests
async function loadLists() {
    // Workers
    const workers = await fetch('/api/list-workers').then(res => res.json());
    document.getElementById('workerList').innerHTML =
        workers.map(w => `<li>ID: ${w.id} | ${w.name} (${w.skill})</li>`).join('');
    // Requests
    const requests = await fetch('/api/list-requests').then(res => res.json());
    document.getElementById('requestList').innerHTML =
        requests.map(r => `<li>ID: ${r.id} | ${r.name} needs: ${r.skill}</li>`).join('');
}
loadLists();

// Connect Worker to Request
document.getElementById('connectForm').onsubmit = async function(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(this).entries());
    const res = await fetch('/api/connect', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
    }).then(res => res.json());
    document.getElementById('connectResult').textContent = 
        res.success ? `Connected! ${res.worker.name} will help ${res.request.name}` : res.message;
};

// Refresh lists regularly
setInterval(loadLists, 3000);

const express = require('express');
const app = express();
const http = require('http').Server(app);

const PORT = 3000;

// In-memory storage for demo
let workers = [];
let requests = [];

app.use(express.static('public'));
app.use(express.json());

// Register as worker
app.post('/api/register-worker', (req, res) => {
    const worker = req.body;
    worker.id = Date.now().toString();
    workers.push(worker);
    res.json({ success: true, worker });
});

// List all workers
app.get('/api/list-workers', (req, res) => {
    res.json(workers);
});

// Post a work request
app.post('/api/post-request', (req, res) => {
    const request = req.body;
    request.id = Date.now().toString();
    requests.push(request);
    res.json({ success: true, request });
});

// List all requests
app.get('/api/list-requests', (req, res) => {
    res.json(requests);
});

// Connect: Match worker/request
app.post('/api/connect', (req, res) => {
    const { workerId, requestId } = req.body;
    const worker = workers.find(w => w.id === workerId);
    const request = requests.find(r => r.id === requestId);
    if (worker && request) {
        res.json({ success: true, worker, request });
    } else {
        res.json({ success: false, message: "Invalid IDs" });
    }
});

http.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT);
});

# 🚀 kaam (काम) — Fresh PC Setup & Dependency Guide

This guide contains everything required to reinstall, configure, and run the **kaam** marketplace platform on a brand-new or freshly formatted PC.

---

## 📋 1. Software Prerequisites to Install

Before running the project, download and install these tools:

1. **Node.js (LTS Version 20.x or higher)**
   - Download: [https://nodejs.org/](https://nodejs.org/)
   - *Installs `node` and `npm` package managers.*

2. **Git for Windows**
   - Download: [https://git-scm.com/download/win](https://git-scm.com/download/win)
   - *Required to clone the repository from GitHub.*

3. **VS Code (Optional / Recommended)**
   - Download: [https://code.visualstudio.com/](https://code.visualstudio.com/)

---

## 📥 2. Step-by-Step Project Restoration

### **Step A: Clone your GitHub Repository**
Open Command Prompt or Terminal and run:
```cmd
git clone https://github.com/surya-4034/Kaam.git
cd Kaam
```

---

### **Step B: Install Dependencies Across All Modules**

Run the following commands to install all required Node modules for the Backend API, Client App, Worker App, and Admin App:

```cmd
:: 1. Backend Server Dependencies
cd server
npm install
cd ..

:: 2. Client Web App Dependencies
cd client-app
npm install
cd ..

:: 3. Worker / Partner App Dependencies
cd worker-app
npm install
cd ..

:: 4. Admin Portal Dependencies
cd admin-app
npm install
cd ..
```

*Or run this single terminal command to install everything at once:*
```cmd
cd server && npm i && cd ../client-app && npm i && cd ../worker-app && npm i && cd ../admin-app && npm i && cd ..
```

---

## ⚡ 3. Running the Complete System

To launch all 4 applications simultaneously with full SQLite database connectivity:

```cmd
node start-services.js
```

### **Access Your Running Apps in Browser**:

| App Name | Port | Local URL |
| :--- | :--- | :--- |
| 📱 **Client App** | `:5174` | `http://localhost:5174` |
| 👷 **Worker App** | `:5175` | `http://localhost:5175` |
| 🛡️ **Admin Dashboard** | `:5176` | `http://localhost:5176` |
| ⚙️ **Backend API** | `:5050` | `http://localhost:5050` |

---

## 🔑 4. Master Admin Credentials
- **Email**: `kaamadmin@gmail.com`
- **Password**: `Sujal957#`

---

## 🛠️ 5. Technical Package Manifest Reference

### **Backend (`server/package.json`)**:
- `express` — Web Framework & REST API
- `sqlite3` — Relational Database Engine
- `mongoose` — MongoDB Atlas Cloud Sync
- `bcryptjs` — Password Hashing
- `jsonwebtoken` — Auth Token Generation
- `h3-js` — Uber H3 Hexagonal Spatial Grid Indexing
- `ioredis` — Redis Spatial Indexing Client
- `cors`, `dotenv`, `nodemailer`, `resend`

### **Frontend Apps (`client-app`, `worker-app`, `admin-app`)**:
- `react`, `react-dom` — React 18 UI Framework
- `vite` — Next-Generation Web Bundler
- `lucide-react` — UI Icon Library
- `firebase` — Google Firebase OAuth & Auth System
- `tailwindcss` — Utility-First Styling

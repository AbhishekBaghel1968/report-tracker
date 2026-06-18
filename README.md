# 🛡️ Cyber Crime Portal

A secure, modern, and anonymous reporting platform designed to empower citizens to report cyber crimes and enable law enforcement officials to systematically manage, investigate, and resolve complaints.

---

## ⚡ Tech Stack & Architecture

The application is built using a modern decoupled architecture:

*   **Frontend**: React 19, Vite, Lucide React, CSS Custom Properties (Themeable CSS), Axios
*   **Backend**: Node.js, Express, Sequelize ORM
*   **Database**: MySQL Server 8.4 (relational schema with automated database checks and syncing)
*   **Security & Auth**: JSON Web Tokens (JWT), BCryptJS password hashing, CORS protection

---

## 🚀 Getting Started

You can run the portal either using the **Automatic Startup Script** (recommended for Windows users) or by running **Manual Startup Commands** for each service.

### 📋 Prerequisites

Before starting, ensure you have the following installed on your system:
*   [Node.js](https://nodejs.org/) (v18.x or higher)
*   [MySQL Server](https://dev.mysql.com/downloads/mysql/) (v8.x or higher)
    *   *Note: If using the automated script, MySQL should be installed at its default path: `C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe`*

---

### Option A: Automatic Startup (Windows)

The repository comes with a preconfigured `start-services.bat` batch file that installs dependencies, launches the MySQL database using localized storage, boots the backend, runs the frontend, and launches the application in your default browser automatically.

1.  Open a command line or file explorer in the root folder.
2.  Run the batch script:
    ```bash
    .\start-services.bat
    ```
3.  The portal will open in your default browser at `http://localhost:5173`.

---

### Option B: Manual Setup & Startup

To run the application manually, run the following steps in order:

#### 1. Setup and Install Dependencies
Install dependencies for both the frontend (root folder) and backend:

```bash
# Install root frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### 2. Configure Environment Variables
Verify your MySQL database connection credentials in `backend/.env`. A default template is provided below:

```env
PORT=8080
JWT_SECRET=9a3f789d31174b5a83a1290382d3e9134a5d891b2c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8
JWT_EXPIRATION=86400000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cyber_security
DB_USER=root
DB_PASS=password
UPLOAD_DIR=./uploads
```

#### 3. Run the Services
Open separate terminal tabs for each command below:

*   **Command 1: Start MySQL Database**
    Run the MySQL server using your system's MySQL binary, specifying the database directory (`mysql_data`):
    ```bash
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --datadir="D:\cyber security\mysql_data" --console --port=3306 --shared-memory
    ```

*   **Command 2: Start Node.js Backend API**
    ```bash
    cd backend
    npm run dev
    ```
    *The server runs on `http://localhost:8080` and will auto-create the `cyber_security` database and seed data if they do not exist.*

*   **Command 3: Start Vite React Frontend App**
    ```bash
    npm run dev
    ```
    *The frontend will run at `http://localhost:5173`.*

---

## 🔑 Demo Credentials

To test the system immediately, the database is auto-seeded with the following credentials upon initial backend run:

### 👮 Administrator Portal (Admin Role)
Allows managing complaints, updating status values, viewing citizen details, and deleting files.
*   **Email**: `admin@gmail.com`
*   **Password**: `admin123`

### 👤 Citizen Portal (User Role)
Allows filing anonymous/official complaints, uploading evidence, editing profile details, and tracking cases.
*   **Email**: `user@gmail.com`
*   **Password**: `user1234`

---

## 📂 Project Structure

```text
├── backend/                  # Node.js + Express Backend App
│   ├── src/
│   │   ├── config/           # Database Connection Setup (Sequelize)
│   │   ├── controllers/      # Route Handler Logic
│   │   ├── middleware/       # Authentication & Upload Middlewares
│   │   ├── models/           # Sequelize Schemas (User, Complaint, File)
│   │   ├── routes/           # API Endpoints Router Definitions
│   │   └── app.js            # Express Entrypoint & Data Seeder
│   └── .env                  # Backend Configuration & Credentials
├── mysql_data/               # Localized MySQL database files
├── src/                      # Vite + React Frontend App
│   ├── assets/               # Public images & icons
│   ├── components/           # Shared components (Navbar, Footer, ProtectedRoutes)
│   ├── context/              # Authentication Context API
│   ├── pages/                # Page Views (Dashboard, Forms, Profile)
│   ├── services/             # API connection handlers (Axios clients)
│   ├── App.jsx               # Route Declarations
│   └── index.css             # Unified CSS Design Tokens & Styles
├── start-services.bat        # Windows single-command runner script
└── README.md                 # Project documentation (this file)
```

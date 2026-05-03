# Database Manager (PostgreSQL & MySQL)

![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![NPM](https://img.shields.io/badge/npm-10.x-CB3837?style=for-the-badge&logo=npm&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

<img width="548" height="202" alt="image" src="https://github.com/user-attachments/assets/998d3046-cc9d-462d-9379-9745aa7779e5" />

Database Manager is a professional, high-performance desktop application designed for seamless administration of PostgreSQL and MySQL databases. It combines a premium user experience with advanced features like a dynamic PostgREST API gateway, local server lifecycle management, and spatial data visualization.

## Overview

<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/5b7f05df-ab9e-42d5-9734-f806af720e5e" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/49e08c1c-56c4-49d0-9d1a-10b6008f90cf" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/c72cd1ce-497a-47d7-ae71-e50d1a112685" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/e202b6db-6cdd-40ff-b1be-823bbd0c0774" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/0a94394c-424a-4689-8d91-5fd0555e7e45" />

---

## Architecture Overview

The application is built on **Electron**, following a secure and decoupled architecture that separates the UI (Renderer) from the system-level logic (Main).

### 1. Main Process

Located in `/src/main`, this process handles all heavy lifting and system interactions:

- **Connection Management**: Manages database pools using `pg` and `mysql2`. It implements a robust lifecycle that cleans up idle pools to save system resources.
- **Local Server Lifecycle**: Bundled PostgreSQL and MySQL binaries are initialized and managed directly by the app. The Main process monitors these sub-processes and provides real-time status updates via IPC.
- **Security & Encryption**: Credentials are secured using deterministic hardware-linked encryption, ensuring that passwords are never stored in plain text.
- **PostgREST Gateway**: Dynamically spawns API instances for specific connections, allowing developers to instantly turn their database into a RESTful API.

### 2. Renderer Process

Located in `/src/renderer`, this is a modern **React 18** application:

- **State Management**: Uses **Zand** for lightweight, high-performance state handling (connections, theme settings, query history).
- **Lazy Metadata Loading**: To ensure responsiveness, the sidebar database tree loads metadata (databases, schemas, tables, columns) on-demand as you expand nodes.
- **Monaco SQL Editor**: A professional-grade code editor providing syntax highlighting and autocomplete for SQL dialects.

### 3. IPC Bridge (The "Communication Layer")

Communication between the processes is handled via a secure `preload.js` bridge. This exposes a controlled `window.electronAPI` object to the frontend, preventing direct access to sensitive Node.js APIs (like `fs` or `child_process`) for maximum security.

---

## Key Features

### PostgREST API Gateway

Instantly expose any PostgreSQL database as a RESTful API.

- **Automatic Mapping**: The gateway automatically maps your schema to GET, POST, PATCH, and DELETE endpoints.
- **JWT Security**: Every API instance is protected by automatically generated JWT secrets.
- **Integration Snippets**: Provides ready-to-use code snippets for Python, PHP, and Node.js.

### 🗺 Spatial Data & PostGIS

Native support for visualizing geographic data.

- **Geometry Viewer**: Detects geometry columns and allows you to preview spatial data directly on an interactive Leaflet map.
- **wkx Integration**: Handles the conversion of Well-Known Binary (WKB) data into GeoJSON for visualization.
  `<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/dc126420-1270-4279-a629-a9bfc28bb8c8" />`
  `<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/4a1003a4-13c3-4e7f-9afe-a8e7182dc369" />`
  `<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/d29c650c-a22f-4f3f-8ec7-3d1f9453db36" />`

### Security Guard

A built-in security scanner that monitors your database activities:

- **Secret Detection**: Scans for hardcoded tokens, API keys, and sensitive strings in your data or queries.
- **Connection Isolation**: Ensures that credentials for production servers are handled with enterprise-grade encryption.

### Local Server Management

The app functions as more than just a client; it's a manager.

- **Embedded Binaries**: Includes localized versions of PostgreSQL and MySQL.
- **One-Click Init**: Automatically initializes data directories and starts servers on application launch.

---

## 🛠 Tech Stack

- **Core**: React 18, Vite, Electron 30+
- **Database Drivers**: `pg` (PostgreSQL), `mysql2` (MySQL)
- **UI Components**: Lucide React (Icons), Tailored CSS Design System
- **Utilities**: Monaco Editor (SQL), Leaflet (Mapping), Zand (State)

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- Must have Postgres Server Running on your local machine(For now).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Daniell22-dot/postgres-manager.git
   cd postgres-manager
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Development Mode:
   ```bash
   npm run dev
   ```

### Production Build

To create a standalone executable for Windows:

```bash
npm run build
```

The packaged app will be available in the `/release` folder.

---

## Licensing

This software is provided under a custom **End User License Agreement (EULA)**. It is licensed for personal and community use. Professional and Enterprise editions are managed via the integrated licensing module in `/src/main/license`.

---

**Developed with ❤️ by Daniel Manyasa.**

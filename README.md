# Database Manager (PostgreSQL & MySQL)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![NPM](https://img.shields.io/badge/npm-10.x-CB3837?style=for-the-badge&logo=npm&logoColor=white) ![NPX](https://img.shields.io/badge/npx-10.x-000000?style=for-the-badge&logo=npm&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white) ![PostGIS](https://img.shields.io/badge/PostGIS-3.x-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-3.x-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)

<img width="548" height="202" alt="image" src="https://github.com/user-attachments/assets/998d3046-cc9d-462d-9379-9745aa7779e5" />

Fast database manager for PostgreSQL and MySQL with support for 20+ simultaneous connections.

## Overview

Database Manager is a high-performance desktop application built to streamline database administration for both PostgreSQL and MySQL. Designed for developers and database administrators, it offers a robust toolset for querying, managing, and visualizing data, including native support for PostGIS spatial data and local server lifecycle management.
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/5b7f05df-ab9e-42d5-9734-f806af720e5e" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/49e08c1c-56c4-49d0-9d1a-10b6008f90cf" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/c72cd1ce-497a-47d7-ae71-e50d1a112685" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/e202b6db-6cdd-40ff-b1be-823bbd0c0774" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/0a94394c-424a-4689-8d91-5fd0555e7e45" />


## Key Features

- **Dual Database Support**: Full management capabilities for both PostgreSQL and MySQL connections.
- **Premium User Interface**: Stunning dark-mode design with customizable themes, accent colors, and typography controls.
- **PostgREST API Gateway**: Instantly generate a RESTful API for PostgreSQL connections with automatic JWT security.
- **Security Guard**: Real-time scanning for hardcoded tokens and secrets to keep your credentials safe.
- **Advanced Query Editor**: Monaco-powered SQL editor with professional autocomplete and syntax highlighting for multiple SQL dialects.
- **Spatial Data Visualization**: Native integration with Leaflet for previewing PostGIS and spatial data.
  <img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/dc126420-1270-4279-a629-a9bfc28bb8c8" />
  <img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/4a1003a4-13c3-4e7f-9afe-a8e7182dc369" />
  <img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/d29c650c-a22f-4f3f-8ec7-3d1f9453db36" />



- **Enterprise-ready Installer**: Professional Windows setup with EULA acceptance and custom branding.

## Tech Stack

- **Frontend**: React 18, Vite, Zustand, Lucide React
- **Backend/Desktop**: Electron, Node.js, pg (PostgreSQL), mysql2 (MySQL)
- **Editor**: Monaco Editor
- **Mapping**: Leaflet, wkx

## Prerequisites

- Node.js
- npm

## Installation

1. Clone the repository and navigate into the directory:

```bash
git clone https://github.com/Daniell22-dot/postgres-manager.git
cd postgres-manager
```

2. Install dependencies:

```bash
npm install
```

## Development

Start the application in development mode with hot-reloading for both the renderer and main processes:

```bash
npm run dev
```

Alternatively, run processes separately:

- **Renderer**: `npm run dev:renderer`
- **Electron**: `npm run dev:electron`

## Building for Production

To build the application for your operating system:

```bash
npm run build
```

This command bundles the React frontend via Vite and packages the Electron application using electron-builder. The output executables will be located in the `release` directory.

## Project Structure

- `/src/main`: Electron main process files, including database connection handling, security, and licensing modules.
- `/src/renderer`: React frontend components, including the Query Editor, Database Tree Sidebar, and utility functions.
- `/src/shared`: Shared configuration and feature toggles.
- `/website`: Promotional website and documentation pages.
- `/resources`: Application icons and static assets used during the build process.

## Author

Developed by Daniel Manyasa.

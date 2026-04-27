# Postgres Manager

![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![NPM](https://img.shields.io/badge/npm-10.x-CB3837?style=for-the-badge&logo=npm&logoColor=white) ![NPX](https://img.shields.io/badge/npx-10.x-000000?style=for-the-badge&logo=npm&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![PostGIS](https://img.shields.io/badge/PostGIS-3.x-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-3.x-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white) ![PostgREST](https://img.shields.io/badge/PostgREST-12.x-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

Fast PostgreSQL manager for 20+ databases.

## Overview

Postgres Manager is a high-performance desktop application built to streamline PostgreSQL database administration. Designed for developers and database administrators, it offers a robust toolset for querying, managing, and visualizing PostgreSQL data, including native support for PostGIS spatial data.

## Key Features

- **Database Management**: Connect to and manage multiple PostgreSQL databases seamlessly.
- **Advanced Query Editor**: Built-in Monaco editor for writing and executing SQL queries with syntax highlighting and autocompletion.
- **Spatial Data Visualization**: Native integration with Leaflet and wkx for previewing PostGIS geometry and geography data types.
- **Security & Auditing**: Features built-in encryption and audit tracking to ensure database connections and queries are secure.
- **Modern User Interface**: Responsive and clean UI built with React, Vite, and Zustand for state management.

## Tech Stack

- **Frontend**: React 18, Vite, Zustand, Lucide React
- **Backend/Desktop**: Electron, Node.js, pg (node-postgres)
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

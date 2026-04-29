# Postgres Manager Tree/Server Update TODO

## 1. Create TODO.md ✅

## 2. Update connectionStore.js ✅
- Add auto-local-servers: PostgreSQL (Local), MySQL (Local)
- Add statuses map + testConnectionStatus action

## 3. Update ConnectionDialog.jsx ✅
- Add server type: PostgreSQL/MySQL selector
- Defaults per type (PG: localhost:5432 postgres, MySQL: localhost:3306 root)
- Empty pw for locals

## 4. Update TreeNode.jsx ✅
- Status badge (🟢/🔴/⏳) for connections
- Context: 'Test Server'

## 5. Update DatabaseTree.jsx ✅
- 'Servers' header
- Auto-load locals
- Status fetch on toggle
- Simplified hierarchy DB → Extensions + Schemas(Public first)

## 6. Backend: connections.js + metadata.js
- MySQL testConnection + metadata IPC (getDatabases etc.)

## 7. Security
- No pw storage for locals
- Validate/test pw

## 8. Test
- npm run test
- App dev: verify tree/status/servers

Progress: [ ]

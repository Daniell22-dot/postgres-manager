const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

function getPostgrestBinaryPath() {
  const executableName = process.platform === 'win32' ? 'postgrest.exe' : 'postgrest';
  const candidatePaths = app.isPackaged
    ? [
        path.join(process.resourcesPath, 'resources', 'bin', process.platform === 'win32' ? 'windows' : process.platform),
        path.join(process.resourcesPath, 'bin', process.platform === 'win32' ? 'windows' : process.platform),
      ]
    : [
        path.join(__dirname, '../../../../resources/bin', process.platform === 'win32' ? 'windows' : process.platform),
      ];

  for (const basePath of candidatePaths) {
    const fullPath = path.join(basePath, executableName);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  throw new Error(
    `PostgREST binary not found. Looked for ${executableName} in: ${candidatePaths
      .map(candidate => path.join(candidate, executableName))
      .join(', ')}`
  );
}

class APIGateway {
  constructor() {
    this.runningInstances = new Map();
  }
  
  async startForConnection(connectionId, connectionConfig) {
    if (this.runningInstances.has(connectionId)) {
      return this.runningInstances.get(connectionId).urls;
    }

    const configPath = path.join(app.getPath('userData'), `postgrest_${connectionId}.conf`);
    const port = 3000 + parseInt(connectionId, 10);
    
    const config = `
      db-uri = "postgres://${connectionConfig.username}:${connectionConfig.password}@${connectionConfig.host}:${connectionConfig.port}/${connectionConfig.database}"
      db-schema = "public"
      db-anon-role = "anon"
      db-pool = 10
      server-host = "0.0.0.0"
      server-port = ${port}
      jwt-secret = "${this.generateJWTSecret()}"
      openapi-server-proxy-uri = "http://localhost:${port}"
    `.split('\n').map(l => l.trim()).join('\n');
    
    fs.writeFileSync(configPath, config);
    
    const binPath = getPostgrestBinaryPath();
    
    const postgrest = spawn(binPath, [configPath]);
    
    postgrest.stdout.on('data', (data) => {
      console.log(`PostgREST (${connectionId}): ${data}`);
    });

    postgrest.stderr.on('data', (data) => {
      console.error(`PostgREST (${connectionId}) Error: ${data}`);
    });

    postgrest.on('error', (error) => {
      console.error(`PostgREST (${connectionId}) Failed to start:`, error);
    });

    postgrest.on('exit', (code, signal) => {
      console.log(`PostgREST (${connectionId}) exited with code ${code} signal ${signal}`);
      this.runningInstances.delete(connectionId);
      try {
        if (fs.existsSync(configPath)) {
          fs.unlinkSync(configPath);
        }
      } catch (e) {
        console.warn(`Failed to clean up PostgREST config for connection ${connectionId}:`, e.message);
      }
    });
    
    const urls = {
      apiUrl: `http://localhost:${port}`,
      docsUrl: `http://localhost:${port}/`
    };

    this.runningInstances.set(connectionId, {
      process: postgrest,
      port: port,
      configPath,
      urls
    });
    
    return urls;
  }
  
  generateJWTSecret() {
    return crypto.randomBytes(64).toString('hex');
  }
  
  async stop(connectionId) {
    const instance = this.runningInstances.get(connectionId);
    if (instance) {
      instance.process.kill();
      try {
        fs.unlinkSync(instance.configPath);
      } catch (e) {}
      this.runningInstances.delete(connectionId);
    }
  }
}

module.exports = { APIGateway };

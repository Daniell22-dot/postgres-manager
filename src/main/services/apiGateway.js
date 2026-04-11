const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

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
    
    const isDev = !app.isPackaged;
    // Resolve postgrest binary path
    const executableName = process.platform === 'win32' ? 'postgrest.exe' : 'postgrest';
    let binPath;
    if (isDev) {
      binPath = path.join(__dirname, '../../../../resources/bin/windows', executableName);
    } else {
      binPath = path.join(process.resourcesPath, 'bin/windows', executableName);
    }
    
    const postgrest = spawn(binPath, [configPath]);
    
    postgrest.stdout.on('data', (data) => {
      console.log(`PostgREST (${connectionId}): ${data}`);
    });

    postgrest.stderr.on('data', (data) => {
      console.error(`PostgREST (${connectionId}) Error: ${data}`);
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
const crypto = require('crypto');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

class EncryptionManager {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.key = null;
    this.initKey();
  }
  
  initKey() {
    const userDataPath = app.getPath('userData');
    const keyPath = path.join(userDataPath, '.master.key');
    
    if (fs.existsSync(keyPath)) {
      this.key = fs.readFileSync(keyPath);
    } else {
      // Generate new key
      this.key = crypto.randomBytes(32);
      fs.writeFileSync(keyPath, this.key, { mode: 0o600 }); // Read/write for owner only
    }
  }
  
  encrypt(text) {
    if (!text) return '';
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted: encrypted,
      tag: authTag.toString('hex')
    });
  }
  
  decrypt(encryptedData) {
    if (!encryptedData) return '';
    
    try {
      const { iv, encrypted, tag } = JSON.parse(encryptedData);
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return '';
    }
  }
}

module.exports = new EncryptionManager();
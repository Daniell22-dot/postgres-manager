const Store = require('electron-store');
const crypto = require('crypto');
const axios = require('axios');

class LicenseManager {
  constructor() {
    this.store = new Store({ name: 'license' });
    this.licenseKey = this.store.get('licenseKey', null);
    this.isValid = false;
    this.licenseData = null;
    
    if (this.licenseKey) {
      this.validateLicense(this.licenseKey);
    }
  }
  
  async validateLicense(key) {
    try {
      // For open source version, always return true with limitations
      if (process.env.OPEN_SOURCE === 'true') {
        this.isValid = true;
        this.licenseData = {
          type: 'open-source',
          features: ['basic-connections', 'query-editor', 'dark-mode'],
          limitations: ['max-connections=5', 'no-team-sharing']
        };
        return true;
      }
      
      // For paid version, validate with your license server
      const response = await axios.post('https://api.yourdomain.com/validate-license', {
        key,
        machineId: this.getMachineId(),
        version: app.getVersion()
      });
      
      if (response.data.valid) {
        this.isValid = true;
        this.licenseData = response.data;
        this.store.set('licenseKey', key);
        return true;
      }
      
      this.isValid = false;
      return false;
    } catch (error) {
      console.error('License validation failed:', error);
      return false;
    }
  }
  
  getMachineId() {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    const mac = Object.values(networkInterfaces)
      .flat()
      .find(details => details.mac && details.mac !== '00:00:00:00:00:00')?.mac;
    
    return crypto.createHash('sha256')
      .update(mac + os.hostname())
      .digest('hex');
  }
  
  hasFeature(feature) {
    if (!this.isValid) return false;
    return this.licenseData?.features?.includes(feature) || false;
  }
  
  getLicenseType() {
    return this.licenseData?.type || 'free';
  }
}

module.exports = new LicenseManager();
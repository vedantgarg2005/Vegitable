const axios = require('axios');

class MessageCentralService {
  constructor() {
    this.baseURL = 'https://cpaas.messagecentral.com';
    this.customerId = process.env.MESSAGE_CENTRAL_CUSTOMER_ID;
    this.email = process.env.MESSAGE_CENTRAL_EMAIL;
    this.password = process.env.MESSAGE_CENTRAL_PASSWORD;
    this.token = null;
  }

  async generateToken() {
    if (!this.customerId || !this.email || !this.password) {
      throw new Error('Message Central credentials not configured');
    }
    const key = Buffer.from(this.password).toString('base64');
    const response = await axios.get(`${this.baseURL}/auth/v1/authentication/token`, {
      params: { customerId: this.customerId, key, scope: 'NEW', country: 91, email: this.email },
      headers: { accept: '*/*' },
      timeout: 15000
    });
    if (response.data.status && response.data.status !== 200) {
      throw new Error(`Authentication failed: ${response.data.error || 'Unknown error'}`);
    }
    this.token = response.data.token;
    return this.token;
  }

  async sendOTP(mobileNumber, countryCode = '91') {
    await this.generateToken();
    try {
      const response = await axios.post(`${this.baseURL}/verification/v3/send`, null, {
        params: { countryCode, flowType: 'SMS', mobileNumber, otpLength: 4 },
        headers: { authToken: this.token },
        timeout: 15000
      });
      this.retryAttempted = false;
      return {
        success: true,
        verificationId: response.data.data.verificationId,
        transactionId: response.data.data.transactionId,
        timeout: response.data.data.timeout
      };
    } catch (error) {
      if (error.response?.status === 401 && !this.retryAttempted) {
        this.retryAttempted = true;
        this.token = null;
        return this.sendOTP(mobileNumber, countryCode);
      }
      this.retryAttempted = false;
      if (error.response?.status === 429) throw new Error('Too many OTP requests. Please wait before trying again.');
      if (error.response?.status === 400) throw new Error('Invalid phone number format.');
      if (error.code === 'ECONNABORTED') throw new Error('Request timeout. Please check your internet connection.');
      throw new Error('Failed to send OTP. Please try again.');
    }
  }

  async validateOTP(verificationId, code) {
    if (!this.token) await this.generateToken();
    try {
      const response = await axios.get(`${this.baseURL}/verification/v3/validateOtp`, {
        params: { verificationId, code },
        headers: { authToken: this.token },
        timeout: 30000
      });
      this.retryAttempted = false;
      return {
        success: response.data.data.verificationStatus === 'VERIFICATION_COMPLETED',
        status: response.data.data.verificationStatus
      };
    } catch (error) {
      if (error.response?.status === 401 && !this.retryAttempted) {
        this.retryAttempted = true;
        this.token = null;
        return this.validateOTP(verificationId, code);
      }
      this.retryAttempted = false;
      return { success: false, status: 'VERIFICATION_FAILED' };
    }
  }
}

module.exports = new MessageCentralService();

import { AuthClient } from '@dfinity/auth-client';

class AuthService {
  constructor() {
    this.authClient = null;
  }

  async init() {
    this.authClient = await AuthClient.create();
    return this.authClient;
  }

  async login() {
    if (!this.authClient) {
      await this.init();
    }

    const days = BigInt(1);
    const hours = BigInt(24);
    const nanoseconds = BigInt(3600000000000);
    
    return new Promise((resolve, reject) => {
      this.authClient.login({
        identityProvider: 'https://identity.ic0.app',
        maxTimeToLive: days * hours * nanoseconds,
        onSuccess: () => resolve(this.authClient.getIdentity()),
        onError: (error) => reject(error)
      });
    });
  }

  async logout() {
    if (this.authClient) {
      await this.authClient.logout();
      window.location.reload();
    }
  }

  async getIdentity() {
    if (!this.authClient) {
      await this.init();
    }
    return this.authClient.getIdentity();
  }

  async isAuthenticated() {
    if (!this.authClient) {
      await this.init();
    }
    return await this.authClient.isAuthenticated();
  }
}

export const authService = new AuthService();
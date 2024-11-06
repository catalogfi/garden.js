export class Url extends URL {
  constructor(endpoint: string, base?: string | Url) {
    super(endpoint, base);
  }

  endpoint(endpoint: string) {
    // Ensure the endpoint starts with a slash
    if (!endpoint.startsWith('/')) {
      endpoint = `/${endpoint}`;
    }

    // Append the new endpoint to the existing pathname
    const newPathname = `${
      this.pathname !== '/' ? this.pathname : ''
    }${endpoint}`;
    return new Url(newPathname, this);
  }

  socket() {
    // Determine if it is https or http
    if (this.protocol === 'https:') {
      return this.origin.replace('https', 'wss');
    } else if (this.protocol === 'http:') {
      return this.origin.replace('http', 'ws');
    } else {
      throw new Error('Invalid protocol');
    }
  }

  addSearchParams(params: Record<string, string>) {
    const url = new URLSearchParams(this.search);
    for (const key in params) {
      url.set(key, params[key]);
    }
    return new Url(`${this.pathname}?${url.toString()}`, this);
  }
}

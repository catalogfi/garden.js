export class Url extends URL {
  constructor(endpoint: string, base?: string | Url) {
    super(endpoint, base);
  }

  /**
   * Returns a new Url object with the provided endpoint appended to the current pathname.
   *
   * @param {string} endpoint - The endpoint to append to the current pathname.
   * @return {Url} A new Url object with the updated pathname.
   */
  endpoint(endpoint: string) {
    const [prevPathname, newPathname] = [
      this.pathname.endsWith('/') ? this.pathname.slice(0, -1) : this.pathname,
      endpoint.startsWith('/') ? endpoint.slice(1) : endpoint,
    ];
    return new Url(prevPathname + '/' + newPathname, this);
  }
  socket() {
    // is it https or http?
    if (this.protocol === 'https:') {
      return this.origin.replace('https', 'wss');
    } else if (this.protocol === 'http:') {
      return this.origin.replace('http', 'ws');
    } else {
      throw new Error('Invalid protocol');
    }
  }
}

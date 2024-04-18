class m {
  constructor() {
    this.memory = /* @__PURE__ */ new Map();
  }
  getItem(e) {
    return this.memory.has(e) ? this.memory.get(e) : null;
  }
  setItem(e, t) {
    this.memory.set(e, t);
  }
  removeItem(e) {
    this.memory.has(e) && this.memory.delete(e);
  }
}
export {
  m as MemoryStorage
};

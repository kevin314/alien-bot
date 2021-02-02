class KevinEventEmitter {
  constructor() {
    this.handlers = {};
  }

  on(name, handler) {
    if (!this.handlers[name]) {
      this.handlers[name] = [];
    }
    this.handers[name].push(handler);
  }

  emit(name, arg) {
    for (const handler of this.handlers[name]) {
      handler(arg);
    }
  }
}
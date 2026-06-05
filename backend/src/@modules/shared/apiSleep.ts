export class ApiSleep {
  static milliseconds(time: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, time);
    });
  }
  static seconds(time: number) {
    return this.milliseconds(time * 1000);
  }
}

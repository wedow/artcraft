class Network {
  constructor() {}

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async task1() {
    console.log("World.");
    let val = true;
    while (val) {
      await this.sleep(1000);
      console.log("Task1 doing work.");
    }
    //throw Error("Ded World.")
  }

  async task2() {
    console.log("Hello.");
    let val = true;
    while (val) {
      await this.sleep(1000);
      console.log("Task2 doing work.");
    }
    //throw Error("Ded Hello.")
  }
}

const network = new Network();

async function main() {
  network.task1();
  network.task2();
}

main();

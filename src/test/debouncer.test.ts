// class Debouncer {
//   store = {};

import { Debouncer } from "support/promise.utils";

//   constructor() {}

//   async set(key) {
//     if (!this.store[key]) {
//       this.store[key] = [];

//       return Promise.resolve();
//     }

//     const promise = new Promise((resolve) => {
//       this.store[key].push(resolve);
//     });

//     return promise;
//   }

//   async next(key) {
//     if (!this.store[key]?.length) {
//       this.store[key] = null;

//       return Promise.resolve();
//     }

//     const callback = this.store[key].shift();

//     return callback();
//   }
// }

const debouncer = new Debouncer();

start();

async function start() {
  await Promise.all([test(1, '1 - 1'), test(2, '2 - 1'), test(1, '1 - 2'), test(1, '1 - 3'), test(2, '2 - 2'), test(1, '1 - 4')]);

  await new Promise((res) => {
    console.log('wait');
    setTimeout(res, 4000);
  });

  test(1, '1 - 5');
  test(1, '1 - 6');

  await test(1, '1 - 7');
}

async function test(id, message) {
  const action = () =>
    new Promise((res) => {
      setTimeout(res, 2000);
    });

  await debouncer.set(id);

  await action();

  console.log(message);

  debouncer.next(id);

  return null;
}
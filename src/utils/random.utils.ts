export const randomNumber = (min = 0, max = 1, floor = false) => {
  const value = (Math.random() * (max - min)) + min;

  if (floor) {
    return Math.floor(value);
  }

  return value;
};

export const randomBool = () => {
  const value = randomNumber();

  return value > 0.5;
};

export const randomArrayItem = (arr: any[]) => {
  if (!arr?.length) {
    return undefined;
  }

  const length = arr.length;
  const index = Math.floor(randomNumber(0, length)) % length;

  return arr[index];
};

const idKeys = 'qwertyuiopasdfghjklzxcvbnm0123456789'.split('');

export const randomId = (length = 5) => {
  return (new Array(length).fill(null).map(() => {
    const key = randomArrayItem(idKeys);
    const isUppercase = randomBool();

    return isUppercase ? key.toUpperCase() : key;
  })).join('');
};

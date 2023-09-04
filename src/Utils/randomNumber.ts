export const randomFloat = (min: number, max: number): number =>
    Math.random() * (max - min) + min;
export const randomNumber = randomFloat;

export const randomInt = (min: number, max: number): number =>
    Math.floor(randomFloat(min, max + 1));

export default randomNumber;

export const randomFloat = (min: number, max: number): number =>
    Math.random() * (max - min) + min;
export const randomNumber = randomFloat;

export const randomInt = (min: number, max: number): number =>
    Math.round(randomFloat(min, max));

export default randomNumber;

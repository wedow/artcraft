
/**
 * Generate a random integer in range.
 * @param min minimum inclusive
 * @param max maximum exclusive
 */
export function GetRandomInt(min: number, max: number) : number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

import { GetRandomInt } from "./GetRandomInt";

export function GetRandomArrayValue<T>(array: Array<T>) : T {
  let index = GetRandomInt(0, array.length);
  return array[index];
}

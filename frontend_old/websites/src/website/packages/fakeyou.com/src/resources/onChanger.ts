type Setter = (x: any) => void

export default function onChanger({ ...setters }: { [key: string]: Setter }) {
  return ({ target }: { target: { name: string; value?: any, checked?: boolean, type?: string } }) => {
    const todo: { [key: string]: Setter } = setters;
    todo[target.name + "Set"](target.type === "checkbox" ?  target.checked : target.value );
  };
}

// I have restore this function to use setters suffixed with "Set" rather than prefixed with "set"
// object keys should ideally be listed alphabetically { apples: 3, bananas: 1, carrots: 0 }
// a value named "alpha" with a corresponding set function named "setAlpha" are far separated from each other alphabetically
// so you may see { alpha, b, ba, c, cd, ct, d, de, ....... setAlpha }
// when rewriting components it is helpful to have related values close together
// { alpha, alphaSet, b, ba, c, cd, ct, d, de, ....... }
// it's easier to search for these variables when they are next to each other among long lists
// and easier to make a text selection -V
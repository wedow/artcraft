import { SplitFirstPeriod } from "./SplitFirstPeriod";

describe('no extension cases', () => {
  test('empty input', () => {
    let output = SplitFirstPeriod("");  
    expect(output.base).toEqual("");
    expect(output.maybeRemainder).toEqual(undefined);
  });

  test('no extension', () => {
    let output = SplitFirstPeriod("foobarbaz");  
    expect(output.base).toEqual("foobarbaz");
    expect(output.maybeRemainder).toEqual(undefined);
  });
});

describe('extension cases', () => {
  test('simple extension', () => {
    let output = SplitFirstPeriod("foo.jpg");  
    expect(output.base).toEqual("foo");
    expect(output.maybeRemainder).toEqual(".jpg");
  });

  test('compound extension', () => {
    let output = SplitFirstPeriod("bar.scn.ron");  
    expect(output.base).toEqual("bar");
    expect(output.maybeRemainder).toEqual(".scn.ron");
  });
});

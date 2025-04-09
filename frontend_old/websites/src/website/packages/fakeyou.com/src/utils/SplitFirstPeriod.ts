interface Output {
  base: string;
  maybeRemainder?: string;
}

// The goal of this function is to split at the first period.
// Calling it "split extension" is inaccurate, because it might
// break for filenames with periods before the extension. We want
// this function to work for extensions such as ".scn.ron", which
// is why we don't split at the last period.
export function SplitFirstPeriod(input: string = ""): Output {
  const i = input.indexOf(".");

  if (i === -1) {
    return { base: input };
  }

  let remainder = input.slice(i + 1);

  if (!!remainder) {
    remainder = `.${remainder}`;
  }

  return {
    base: input.slice(0, i),
    maybeRemainder: remainder,
  };
}

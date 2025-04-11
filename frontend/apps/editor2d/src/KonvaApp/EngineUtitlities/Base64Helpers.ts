const ensureBase64Prefix = (base64String: string) => {
    return base64String.startsWith("data:")
      ? base64String
      : `data:image/png;base64,${base64String}`;
}

export { ensureBase64Prefix };

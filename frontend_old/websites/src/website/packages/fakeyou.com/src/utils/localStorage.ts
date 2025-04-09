export function setLocalStorageItem(
  key: string,
  value: string,
  ttl: number = 2 * 24 * 60 * 60 * 1000 // 2 days by default expiry date
): void {
  const now = new Date();
  const item = {
    value: value,
    expiry: now.getTime() + ttl,
  };
  localStorage.setItem(key, JSON.stringify(item));
}

export function getLocalStorageItem(key: string): string | null {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) {
    return null;
  }
  const item = JSON.parse(itemStr);
  const now = new Date();
  if (now.getTime() > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  return item.value;
}

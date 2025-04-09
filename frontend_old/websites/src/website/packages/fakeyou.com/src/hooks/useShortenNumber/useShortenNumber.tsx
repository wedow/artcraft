export default function useShortenNumber(num: number): string {
  if (isNaN(num)) return "0";
  if (num === 0) return "0";
  if (Math.abs(num) < 1e3) return num.toString();
  if (Math.abs(num) < 1e6) return (num / 1e3).toFixed(1) + "k";
  if (Math.abs(num) < 1e9) return (num / 1e6).toFixed(1) + "M";
  return num.toString();
}

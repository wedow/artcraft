export function getBackgroundColor(backgroundIndex?: number): string {
  switch (backgroundIndex) {
    case 0:
      return "#E66462";
    case 1:
      return "#FD881B";
    case 2:
      return "#E7C13C";
    case 3:
      return "#4BA905";
    case 4:
      return "#25B8A0";
    case 5:
      return "#0078D1";
    case 6:
      return "#7F52C1";
    case 7:
      return "#FF66AC";
    case 8:
      return "#259FEC";
    default:
      return `#1a1a27`;
  }
}

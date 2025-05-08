export enum FontWeight {
  NORMAL = "normal",
  BOLD = "bold",
}
export enum FontStyle {
  NORMAL = "normal",
  ITALIC = "italic",
}
export enum TextAlign {
  LEFT = "left",
  RIGHT = "right",
  CENTER = "center",
  // JUSTIFY = "justify",
}
export enum TextDecoration {
  NONE = "none",
  STRIKETHROUGH = "line-through",
  UNDERLINE = "underline",
}
export type TextFormatData = {
  color: string;
  maxWidth: number;
  fontFamily: string;
  fontSize: number;
  fontStyle: FontStyle;
  fontWeight: FontWeight;
  textAlign: TextAlign;
  textDecoration: TextDecoration;
};
export type TextNodeData = {
  text: string;
} & TextFormatData;

/** @type {import('tailwindcss').Config} */
import colors from "tailwindcss/colors";
import defaultTheme from "tailwindcss/defaultTheme";
import { storytellerColors } from "./tailwind.stcolors";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../libs/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Source Sans 3'", ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        "7xl": "5rem",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
      },
      animation: {
        bounce: "bounce 2s infinite",
      },
    },
    colors: {
      // color value shorthands
      transparent: "transparent",
      current: "currentColor",

      // common colors
      white: colors.white,
      gray: colors.zinc,
      black: colors.black,
      red: colors.red,
      oragne: colors.orange,
      yellow: colors.yellow,
      green: colors.green,
      blue: colors.sky, //use sky instead of blue
      indigo: colors.indigo,
      purple: colors.purple,

      // utility colors
      error: colors.red[500],
      warning: colors.yellow[500],
      success: colors.green[500],
      info: colors.sky[500],

      // brand colors
      primary: {
        DEFAULT: "#2d81ff",
        50: "#eef6ff",
        100: "#d9ebff",
        200: "#bcdcff",
        300: "#8ec7ff",
        400: "#59a7ff",
        500: "#2d81ff",
        600: "#1b63f5",
        700: "#144ee1",
        800: "#173fb6",
        900: "#19398f",
        950: "#142457",
      },
      secondary: {
        DEFAULT: "#3E3E41",
        50: "#f6f6f6",
        100: "#e7e7e7",
        200: "#d1d1d1",
        300: "#b0b0b0",
        400: "#888888",
        500: "#6d6d6d",
        600: "#5d5d5d",
        700: "#4f4f4f",
        800: "#454545",
        900: "#3d3d3d",
        950: "#3E3E41",
      },

      tertiary: storytellerColors.aquamarineBlue,

      ui: {
        background: "#101014",
        panel: "#3E3E41",
        border: "#FFFFFF0D",
        "panel-border": "#3F3F3F",
        controls: "#3E3E41",
      },
    },
    backgroundImage: {
      "radial-gradient":
        "radial-gradient(circle at left, var(--tw-gradient-stops))",
    },
  },
  plugins: [],
};

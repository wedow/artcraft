/** @type {import('tailwindcss').Config} */
import colors from "tailwindcss/colors";
import defaultTheme from "tailwindcss/defaultTheme";
import { storytellerColors } from "./tailwind.stcolors";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
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
      primary: storytellerColors.azureRadiance,
      secondary: storytellerColors.gunpowder,
      tertiary: storytellerColors.aquamarineBlue,

      ui: {
        background: "#101014",
        panel: "#3E3E41",
        border: "#FFFFFF0D",
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

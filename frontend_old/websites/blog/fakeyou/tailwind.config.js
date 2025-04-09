/** @type {import('tailwindcss').Config} */
import colors from "tailwindcss/colors";
module.exports = {
  content: [
    `./templates/*.html`,
    `./templates/**/*.html`,
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "white": colors.white,
        "black": colors.black,
        "primary": {
          DEFAULT: "#e66462", //=500
          "50": "#fdf3f3",
          "100": "#fce4e4",
          "200": "#facfce",
          "300": "#f6acab",
          "400": "#ef7c7a",
          "500": "#e66462",
          "600": "#cf3533",
          "700": "#ae2927",
          "800": "#902624",
          "900": "#782524",
          "950": "#410f0e",
        },
        "secondary": {
          DEFAULT: "#39394c", //=950
          "50": "#f5f6f9",
          "100": "#e8eaf1",
          "200": "#d7dbe6",
          "300": "#bbc1d5",
          "400": "#9aa2c0",
          "500": "#8188b0",
          "600": "#6f74a1",
          "700": "#636492",
          "800": "#545579",
          "900": "#464762",
          "950": "#39394c",
        },
        "panel": "#242433",
        "link": "#4E4EB8"
      },
    },

  },
  plugins: [require("@tailwindcss/typography")],
}


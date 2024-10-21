import { colors } from "@webrecorder/hickory/tokens/tailwind";
import { merge } from "es-toolkit";

export default {
  content: ["./src/**/*.{html,js,ts,ejs}"],
  theme: {
    fontFamily: {
      display: [
        "Konsole, sans-serif",
        { fontVariationSettings: '"wdth" 105, "wght" 650' },
      ],
      "display-wide": [
        "Konsole, sans-serif",
        { fontVariationSettings: '"wdth" 115, "wght" 650' },
      ],
      "display-wider": [
        "Konsole, sans-serif",
        { fontVariationSettings: '"wdth" 137' },
      ],
      body: [
        "Inter Variable, system-ui, sans-serif",
        {
          fontFeatureSettings: '"ss07", "ss08"',
        },
      ],
      monospace: [
        "Recursive",
        "ui-monospace",
        "SFMono-Regular",
        "Menlo",
        "Monaco",
        "Consolas",
        "Liberation Mono",
        "Courier New",
        "monospace",
      ],
    },
    colors: merge(colors, {
      cyan: {
        700: {
          DEFAULT: colors.cyan["700"],
          deep: "var(--color-cyan-700-deep)",
        },
      },
      currentColor: "currentColor",
    }),
    extend: {},
  },
  plugins: [],
};

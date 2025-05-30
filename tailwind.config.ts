import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // GitHub theme colors
        github: {
          canvas: {
            default: "#0d1117",
            subtle: "#161b22",
            inset: "#010409",
          },
          fg: {
            default: "#c9d1d9",
            muted: "#8b949e",
            subtle: "#6e7681",
          },
          border: {
            default: "#30363d",
            muted: "#21262d",
            subtle: "#484f58",
          },
          accent: {
            fg: "#58a6ff",
            emphasis: "#1f6feb",
            subtle: "#388bfd26",
          },
          success: {
            fg: "#3fb950",
            emphasis: "#238636",
            subtle: "#1a7f3726",
          },
          attention: {
            fg: "#d29922",
            emphasis: "#9e6a03",
            subtle: "#bb800926",
          },
          danger: {
            fg: "#f85149",
            emphasis: "#da3633",
            subtle: "#f8514926",
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

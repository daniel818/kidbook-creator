import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#f4258c",
                "background-light": "#f8f5f7",
                "background-dark": "#221019",
            },
            fontFamily: {
                "display": ["Plus Jakarta Sans", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "1rem",
                "lg": "2rem",
                "xl": "3rem",
                "full": "9999px"
            },
            keyframes: {
                blobFloat: {
                    "0%": { transform: "translate(0, 0) rotate(6deg)" },
                    "100%": { transform: "translate(0, -20px) rotate(2deg)" },
                }
            },
            animation: {
                blobFloat: "blobFloat 10s ease-in-out infinite alternate",
            }
        },
    },
    plugins: [],
};
export default config;

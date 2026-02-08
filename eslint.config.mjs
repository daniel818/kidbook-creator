import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Prevent unstructured console logging — use lib/logger or lib/client-logger instead
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // Allow console in client-logger (it wraps console internally) and JS scripts (can't import pino)
    files: ["lib/client-logger.ts", "scripts/**/*.js"],
    rules: {
      "no-console": "off",
    },
  },
]);

export default eslintConfig;

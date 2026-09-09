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
    // Agent/plugin assets are versioned workspace tooling, not application code.
    ".agent/**",
    ".agents/**",
    ".claude/**",
    ".gemini/**",
    ".opencode/**",
    ".serena/**",
  ]),
  {
    // Product and store images come from API URLs and user-provided SVG data URLs.
    // Arbitrary remote hosts cannot be safely enumerated in next/image remotePatterns.
    rules: { "@next/next/no-img-element": "off" },
  },
]);

export default eslintConfig;

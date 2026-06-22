import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // React Three Fiber drives three.js by mutating live scene objects (the
  // camera, materials, meshes) inside useFrame/useThree — that is the
  // framework's intended API, not a bug. The React Compiler's immutability rule
  // can't distinguish the two, so turn it off for the 3D code only; it stays
  // enforced for regular UI components, where mutating values is a real bug.
  {
    files: [
      "src/app/page.tsx",
      "src/components/3d/**/*.tsx",
      "src/components/particles/**/*.tsx",
      "src/components/effects/**/*.tsx",
      "src/components/utils/**/*.tsx",
    ],
    rules: {
      "react-hooks/immutability": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

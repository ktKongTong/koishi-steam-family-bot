import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommend from "eslint-plugin-prettier/recommended";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettierRecommend,
  {
    ignores:["**/*.js " , "packages/*/lib/**", "packages/koishi/dev/**"]
  },
  {
    // files: ["packages/*/src/*.ts", "packages/*/src/*.tsx"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports":"off",
      "@typescript-eslint/no-unnecessary-type-constraint":"off",
      "@typescript-eslint/no-empty-object-type":"off"
    }
  },
];

module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules: {
    quotes: ["error", "single"],
    indent: ["error", 2],
    "no-unused-vars": "warn",
    "no-console": "off",
  },
  ignorePatterns: ["lib/**/*", "node_modules/**/*"],
};

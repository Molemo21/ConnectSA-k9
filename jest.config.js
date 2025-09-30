module.exports = {
  testEnvironment: "jsdom",
  preset: "ts-jest/presets/js-with-ts",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        jsx: "react-jsx"
      }
    }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(node-fetch)/)"
  ],
  testMatch: [
    "**/tests/**/*.test.ts",
    "**/tests/**/*.test.tsx",
    "**/tests/unit/**/*.test.ts",
    "**/tests/unit/**/*.test.tsx",
    "**/tests/integration/**/*.test.ts",
    "**/tests/integration/**/*.test.tsx",
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.tsx",
  ],
  collectCoverageFrom: [
    "components/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!app/**",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testTimeout: 10000,
};
import next from "eslint-config-next";

/**
 * Flat ESLint config (Next 16 removed `next lint` in favour of the ESLint CLI).
 * Run with: npm run lint
 */
export default [
  ...next,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/generated/**", // Prisma-generated client
    ],
  },
];

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["test/**/*.spec.ts"]
  },
  resolve: {
    alias: {
      "@gp/shared": path.resolve(__dirname, "../../packages/shared/src")
    }
  }
});

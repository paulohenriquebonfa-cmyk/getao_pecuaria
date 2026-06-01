import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["test-e2e/**/*.e2e-spec.ts"]
  },
  resolve: {
    alias: {
      "@gp/shared": path.resolve(__dirname, "../../packages/shared/src")
    }
  }
});

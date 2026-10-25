import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// GOAT services rely on TypeScript decorator metadata
// (design:paramtypes), which esbuild — vitest's default transform —
// does not emit. The GOAT monorepo compiles with SWC (@swc/core is a
// workspace devDependency and tsup's output carries the metadata), so
// the tests use SWC too, with the same legacy-decorator settings.
export default defineConfig({
    plugins: [
        swc.vite({
            jsc: {
                parser: { syntax: "typescript", decorators: true, dynamicImport: true },
                transform: { legacyDecorator: true, decoratorMetadata: true },
                target: "es2022",
            },
        }),
    ],
    test: {
        include: ["src/**/*.test.ts"],
    },
});

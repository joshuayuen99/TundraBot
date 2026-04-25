import * as esbuild from "esbuild";
import tg from "tiny-glob";

const options: esbuild.BuildOptions = {
    bundle: true,
    format: "cjs",
    outdir: "./dist",
    outExtension: { ".js": ".cjs" },
    platform: "node",
    sourcemap: true,
};

const [scripts] = await Promise.all([tg("./scripts/**.ts")]);

const mainOptions: esbuild.BuildOptions = {
    ...options,
    entryPoints: ["./src/TundraBot.ts"],
    outbase: "src",
};

const scriptsOptions: esbuild.BuildOptions = {
    ...options,
    entryPoints: scripts,
    outdir: "./dist/scripts",
};

await Promise.all([esbuild.build(mainOptions), esbuild.build(scriptsOptions)]);

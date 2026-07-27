import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this folder. Without it, Turbopack walks up the
  // tree to infer the root and tries to read ~/Desktop, which macOS blocks.
  turbopack: {
    root: path.resolve(__dirname),
  },
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;

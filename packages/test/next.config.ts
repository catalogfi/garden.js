import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      "tiny-secp256k1": require.resolve("@bitcoinerlab/secp256k1"),
    };
    return config;
  },
};

export default nextConfig;

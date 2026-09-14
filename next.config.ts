import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/**/*': ['./prisma/dev.db', './public/uploads/**/*'],
    '/**/*': ['./prisma/dev.db', './public/uploads/**/*'],
  },
};

export default nextConfig;

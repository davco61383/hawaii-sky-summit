import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // newsletter templates are read at runtime by /api/admin/newsletter
  outputFileTracingIncludes: { "/api/admin/newsletter": ["./newsletter/**/*"] },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;

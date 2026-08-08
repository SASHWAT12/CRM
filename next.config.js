const withNextIntl = require("next-intl/plugin")(
  "./i18n/request.ts"
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "localhost" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "minio-cwg0o4ss0scoccgwso8sk004.coolify.cz" },
      { protocol: "http", hostname: "minio" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:locale/crm/targets/:path*",
        destination: "/:locale/campaigns/targets/:path*",
        permanent: true,
      },
      {
        source: "/:locale/crm/target-lists/:path*",
        destination: "/:locale/campaigns/target-lists/:path*",
        permanent: true,
      },
      {
        source: "/:locale/crm/contacts",
        destination: "/:locale/crm/patients",
        permanent: true,
      },
      {
        source: "/:locale/crm/contacts/:path*",
        destination: "/:locale/crm/patients/:path*",
        permanent: true,
      },
      {
        source: "/:locale/crm/tasks",
        destination: "/:locale/crm/followups",
        permanent: true,
      },
      {
        source: "/:locale/crm/tasks/:path*",
        destination: "/:locale/crm/followups/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);

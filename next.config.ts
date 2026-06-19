import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking — page cannot be embedded in an iframe
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send origin in Referer header (not full URL)
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable unused browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Force HTTPS for 1 year (enable after confirming HTTPS in prod)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js App Router needs 'unsafe-inline' for style injection;
      // scripts: own origin + Paystack inline SDK
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co",
      // Allow Paystack popup iframe
      "frame-src https://checkout.paystack.com https://standard.paystack.co",
      // Styles: Next.js injects inline styles
      "style-src 'self' 'unsafe-inline'",
      // Images: own origin + CDN sources
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://*.supabase.co",
      // Fonts: own origin + Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // API + Paystack API calls
      `connect-src 'self' ${new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").origin} https://api.paystack.co https://vitals.vercel-insights.com`,
      // Only allow form submissions to own origin
      "form-action 'self'",
      // Prevent base tag hijacking
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },

  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

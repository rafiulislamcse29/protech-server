import "dotenv/config";

export const config = {
  port: process.env["PORT"] || 5000,
  nodeEnv: process.env["NODE_ENV"] || "development",

  db: {
    url: process.env["DATABASE_URL"] as string,
  },

  jwt: {
    accessSecret: process.env["JWT_ACCESS_SECRET"] || "access_secret_change_me",
    refreshSecret:
      process.env["JWT_REFRESH_SECRET"] || "refresh_secret_change_me",
    accessExpiresIn: process.env["JWT_ACCESS_EXPIRES_IN"] || "15m",
    refreshExpiresIn: process.env["JWT_REFRESH_EXPIRES_IN"] || "7d",
  },

  cloudinary: {
    cloudName: process.env["CLOUDINARY_CLOUD_NAME"] as string,
    apiKey: process.env["CLOUDINARY_API_KEY"] as string,
    apiSecret: process.env["CLOUDINARY_API_SECRET"] as string,
  },

  email: {
    host: process.env["EMAIL_HOST"] || "smtp.gmail.com",
    port: Number(process.env["EMAIL_PORT"]) || 587,
    user: process.env["EMAIL_USER"] as string,
    pass: process.env["EMAIL_PASS"] as string,
    from: process.env["EMAIL_FROM"] || "noreply@proptech.ai",
  },

  cors: {
    origin: process.env["CLIENT_URL"] || "http://localhost:3000",
  },

  openRouter: {
    apiKey: process.env["OPENROUTER_API_KEY"] as string,
    baseUrl: "https://openrouter.ai/api/v1",
    model: process.env["OPENROUTER_MODEL"] || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    siteUrl: process.env["CLIENT_URL"] || "http://localhost:3000",
    siteName: "PropTech AI",
  },
} as const;

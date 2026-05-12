# PropTech AI: Backend  
A production-grade, AI-powered backend engine for the PropTech ecosystem, built with Node.js, Express 5, and Prisma.

---

## Table of Contents

- [About the Project](#about-the-project)
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Dependencies](#dependencies)
- [Installation️ & Setup](#installation--setup)
- [Folder Structure](#folder-structure)
- [How to Contribute](#how-to-contribute)
- [License](#license)
- [Contact](#contact)

---

## About the Project 
The PropTech AI Backend is the core intelligence engine that drives the platform's advanced features. It handles secure authentication, multi-role access control, and complex AI pipeline orchestration. By integrating GPT-4 models with a structured PostgreSQL database, it provides the "brains" for natural language property search, neighborhood analysis, and automated content generation.

---

## Project Overview  
This backend is architected for scalability, type safety, and production readiness. It implements advanced patterns like modular routing, centralized error handling, and structured AI prompt engineering. It serves as a robust API layer that ensures data integrity and high-performance processing for all real estate interactions.

---

## Key Features  
- **AI Pipeline Orchestration** — Sophisticated handling of OpenAI GPT models to parse natural language, analyze neighborhood data, and generate marketing copy.
- **Robust RBAC System** — Secure, multi-tiered access control for Buyers, Agents, and Administrators using JWT and custom middleware.
- **Modular Data Schema** — A scalable PostgreSQL architecture managed via Prisma, featuring optimized indexes and JSONB fields for AI metadata.
- **Automated Media Management** — Seamless integration with Cloudinary for property image and video uploads.
- **Smart Analytics & Auditing** — Comprehensive tracking of AI token usage and costs to ensure system profitability and oversight.
- **Transactional Lead System** — Efficient inquiry management and lead tracking between buyers and agents.

---

## Tech Stack  
**Runtime:** Node.js (v20+)  
**Framework:** Express.js 5 · TypeScript  
**Database:** PostgreSQL · Prisma ORM  
**AI Integration:** OpenAI API (via OpenRouter)  
**Security:** JWT · Bcryptjs · Zod (Validation)  
**Infrastructure:** Cloudinary (Media) · Nodemailer (SMTP)

---

## Dependencies  
Core libraries driving the backend engine:

```json
{
  "express": "^5.2.1",
  "prisma": "^7.8.0",
  "@prisma/client": "^7.8.0",
  "jsonwebtoken": "^9.0.x",
  "zod": "^4.4.x",
  "cloudinary": "^2.10.x",
  "bcryptjs": "^3.0.x",
  "nodemailer": "^8.0.x"
}
```

---

## Installation️ & Setup
1. Clone the repo and navigate to the server directory:

```bash
git clone https://github.com/rafiulislamcse29/protech-server.git
cd proptech-server
npm install
```

2. Set up environment variables by creating a `.env` file:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENROUTER_API_KEY=your_openrouter_key
```

3. Initialize the database and run migrations:

```bash
npx prisma migrate dev
npm run dev
```

---

## Folder Structure

```plaintext
proptech-server/
│
├── src/
│   ├── app/
│   │   ├── module/       # Business logic organized by feature (Auth, Property, AI, etc.)
│   │   ├── routes/       # Centralized API route definitions
│   │   ├── middleware/   # Auth, Authorize, Validation, and Error middlewares
│   │   └── config/       # Environment and tool configurations
│   ├── server.ts         # Entry point for the Express application
│   └── shared/           # Shared utilities and constants
│
├── prisma/
│   ├── schema/           # Modular Prisma schema files
│   └── seed.ts           # Initial database seeding script
│
└── package.json          # Server dependencies and build scripts
```

---

## How to Contribute (Optional)

  - Fork the Project
  - Create a branch (`git checkout -b feature/AmazingFeature`)
  - Commit changes (`git commit -m 'Add some AmazingFeature'`)
  - Push the branch (`git push origin feature/AmazingFeature`)
  - Open a Pull Request

---

## License (Optional)
Distributed under the MIT License.

---

## Contact

**Live API:** [API Endpoint](https://proptech-server.vercel.app/api)
**Email:** [rafiulislam29@gmail.com](mailto:rafiulislam29@gmail.com)
**Portfolio:** [Portfolio](https://rafiul-islam-dev.vercel.app/)

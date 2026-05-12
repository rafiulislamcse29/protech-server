import app from "./app.js";
import { Server } from "http";
import { config } from "./app/config/index.js";
import { prisma } from "./app/lib/index.js";

let server: Server;

const bootstrap = async () => {
  try {
    // Test DB connection
    await prisma.$connect();
    console.log("✅ Database connected");

    server = app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📦 Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log("💤 Server closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};




// SIGTERM signal handler
process.on("SIGTERM", () => {
    console.log("SIGTERM signal received. Shutting down server...");

    if (server) {
        server.close(() => {
            console.log("Server closed gracefully.");
            process.exit(1);
        });
    }

    process.exit(1);

})

// SIGINT signal handler
process.on("SIGINT", () => {
    console.log("SIGINT signal received.");
    if (server) {
        server.close(() => {
            console.log("Server closed gracefully.");
            process.exit(0);
        });
    } else {
        process.exit(1);
    }
});

//uncaught exception handler
process.on('uncaughtException', (error) => {
    console.log("Uncaught Exception Detected... Shutting down server", error);

    if (server) {
        server.close(() => {
            process.exit(1);
        })
    }

    process.exit(1);
})

process.on("unhandledRejection", (error) => {
    console.log("Unhandled Rejection Detected... Shutting down server", error);

    if (server) {
        server.close(() => {
            process.exit(1);
        })
    }

    process.exit(1);
})


bootstrap();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Turso client setup
const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url: dbUrl && dbUrl.trim() !== "" ? dbUrl : "file:local.db",
  authToken: dbToken && dbToken.trim() !== "" ? dbToken : undefined,
});

console.log(`Database client initialized. Mode: ${dbUrl && dbUrl.trim() !== "" ? 'Remote' : 'Local (file:local.db)'}`);

async function initDb() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount TEXT NOT NULL,
        status TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        tx_hash TEXT NOT NULL,
        user_address TEXT
      )
    `);
    console.log("Database initialized");
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  await initDb();

  // API Routes
  app.get("/api/transactions", async (req, res) => {
    const { address } = req.query;
    try {
      let query = "SELECT * FROM transactions";
      let args: any[] = [];
      
      if (address) {
        query += " WHERE user_address = ?";
        args.push(address);
      }
      
      query += " ORDER BY timestamp DESC";
      
      const result = await client.execute({
        sql: query,
        args: args
      });

      const transactions = result.rows.map(row => ({
        id: row.id,
        type: row.type,
        amount: row.amount,
        status: row.status,
        timestamp: row.timestamp,
        txHash: row.tx_hash
      }));
      res.json(transactions);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    const { id, type, amount, status, timestamp, txHash, userAddress } = req.body;
    try {
      await client.execute({
        sql: "INSERT INTO transactions (id, type, amount, status, timestamp, tx_hash, user_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [id, type, amount, status, timestamp, txHash, userAddress]
      });
      res.status(201).json({ success: true });
    } catch (err) {
      console.error("Error saving transaction:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

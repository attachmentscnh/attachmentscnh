// server.js
import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";




dotenv.config();

const app = express();
app.use(express.json());

// ========================
// CORS - Allow any Live Server origin (dev only)
// ========================
app.use(cors()); // DEV: allows http://127.0.0.1:5500, http://localhost:5500, etc.

// ========================
// Firebase Setup
// ========================
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

// ========================
// Firestore Helper Function
// ========================
async function updateAllDocs(callback) {
  const snapshot = await db.collection("Attachments").get();
  let count = 0;

  for (const doc of snapshot.docs) {
    await callback(doc);
    count++;
  }

  return count;
}

// ========================
// Firestore Maintenance APIs
// ========================
app.post("/add", async (req, res) => {
  try {
    const { fieldName, defaultValue } = req.body;
    const updated = await updateAllDocs(doc =>
      doc.ref.update({ [fieldName]: defaultValue ?? null })
    );
    res.send(`Added field "${fieldName}" to ${updated} docs.`);
  } catch (err) {
    res.status(500).send("Error adding field: " + err.message);
  }
});

app.post("/edit", async (req, res) => {
  try {
    const { fieldName, newValue } = req.body;
    const updated = await updateAllDocs(doc =>
      doc.ref.update({ [fieldName]: newValue })
    );
    res.send(`Updated field "${fieldName}" in ${updated} docs.`);
  } catch (err) {
    res.status(500).send("Error editing field: " + err.message);
  }
});

app.post("/rename", async (req, res) => {
  try {
    const { oldName, newName } = req.body;
    const updated = await updateAllDocs(async doc => {
      const data = doc.data();
      if (data.hasOwnProperty(oldName)) {
        const value = data[oldName];
        await doc.ref.update({ [newName]: value });
        await doc.ref.update({ [oldName]: admin.firestore.FieldValue.delete() });
      }
    });
    res.send(`Renamed field "${oldName}" to "${newName}" in ${updated} docs.`);
  } catch (err) {
    res.status(500).send("Error renaming field: " + err.message);
  }
});

app.post("/delete", async (req, res) => {
  try {
    const { fieldName } = req.body;
    const updated = await updateAllDocs(doc =>
      doc.ref.update({ [fieldName]: admin.firestore.FieldValue.delete() })
    );
    res.send(`Deleted field "${fieldName}" from ${updated} docs.`);
  } catch (err) {
    res.status(500).send("Error deleting field: " + err.message);
  }
});

// ========================
// OpenAI Proxy Endpoint
// ========================
app.post("/api/proxy", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();

    console.log("FULL OPENAI RESPONSE:");
    console.log(JSON.stringify(data, null, 2));

    res.json({
      reply: data?.choices?.[0]?.message?.content ?? "No response."
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ reply: "Server error" });
  }
});


// ========================
// Start Server
// ========================
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

// server.js
import express from "express";
import cors from "cors";
import admin from "firebase-admin";

const app = express();
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

async function updateAllDocs(callback) {
  const snapshot = await db.collection("Attachments").get();
  let count = 0;
  for (const doc of snapshot.docs) {
    await callback(doc);
    count++;
  }
  return count;
}

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

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

app.post("/api/proxy", async (req, res) => {
  try {
    console.log("Request from frontend:", req.body);

    const response = await fetch(
      "https://cnhattachments.app.n8n.cloud/webhook/attachments-ai",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();
    console.log("Raw response from n8n:", data);

    // Normalize response: pick first string value or fallback
    let reply = "Sorry, no response received.";

    if (data) {
      // Try known keys
      reply = data.reply || data.message || data.output;

      // If still undefined, use first string value from JSON
      if (!reply) {
        for (const key in data) {
          if (typeof data[key] === "string") {
            reply = data[key];
            break;
          }
        }
      }
    }

    res.json({ reply });
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ reply: "Proxy failed: could not connect to assistant." });
  }
});

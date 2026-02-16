import Message from "../models/Message.js";

export const submitContactForm = async (req, res) => {
  try {
    console.log("📩 Request body received:", req.body); // Debug incoming data

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    const msg = await Message.create({ name, email, message });
    console.log("📩 New message saved:", msg);

    res.json({ success: true, message: "Message sent successfully!" });
  } catch (err) {
    console.error("❌ Error in submitContactForm:", err); // Log full error
    res.status(500).json({ success: false, message: "Failed to send message", error: err.message });
  }
};

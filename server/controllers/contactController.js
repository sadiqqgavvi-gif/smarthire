import Message from "../models/Message.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

export const submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "All fields are required.",
      });
    }

    await Message.create({ name, email, message });
    return sendSuccess(res, { message: "Message sent successfully!" });
  } catch (err) {
    console.error("Error in submitContactForm:", err);
    return sendError(res, {
      status: 500,
      code: "CONTACT_SUBMISSION_FAILED",
      message: "Failed to send message",
    });
  }
};

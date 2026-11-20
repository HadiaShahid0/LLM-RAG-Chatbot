import transporter from "../config/email.js";

export const sendEmailService = async ({
  to,
  subject,
  html,
}) => {
  try {
    const result = await transporter.sendMail({
      from: process.env.EMAIL,
      to,
      subject,
      html,
    });

    return result;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("Failed to send email");
  }
};
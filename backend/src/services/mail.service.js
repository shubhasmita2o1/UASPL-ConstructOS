const env = require("../config/env");

/**
 * Dev-mode stub: logs the email to the console instead of sending it.
 * Swap the body of sendMail() for a real transport (nodemailer/SES/SendGrid)
 * when credentials are available — callers never need to change.
 */
async function sendMail({ to, subject, text }) {
  console.log("\n[mail] ---------------------------------------------");
  console.log(`[mail] To: ${to}`);
  console.log(`[mail] Subject: ${subject}`);
  console.log(`[mail] ${text}`);
  console.log("[mail] ---------------------------------------------\n");
}

async function sendPasswordResetEmail(user, rawToken) {
  const link = `${env.CLIENT_URL}/auth/reset-password?token=${rawToken}`;
  await sendMail({
    to: user.email,
    subject: "Reset your ConstructOS password",
    text: `Hi ${user.name}, reset your password using this link (expires in ${env.PASSWORD_RESET_TOKEN_MINUTES} minutes): ${link}`,
  });
}

module.exports = { sendMail, sendPasswordResetEmail };

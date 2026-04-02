import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Decoration Rental" <noreply@decorationrental.com>',
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error };
  }
};

export const emailTemplates = {
  welcome: (name: string) => ({
    subject: "Welcome to Decoration Rental",
    html: `<h1>Welcome, ${name}!</h1><p>Thank you for registering with us.</p>`,
  }),
  bookingConfirmation: (date: string, price: number) => ({
    subject: "Booking Confirmation",
    html: `<h1>Booking Confirmed</h1><p>Your event on ${date} is confirmed. Total price: $${price}.</p>`,
  }),
  paymentReceipt: (amount: number, balance: number) => ({
    subject: "Payment Receipt",
    html: `<h1>Payment Received</h1><p>Amount paid: $${amount}. Remaining balance: $${balance}.</p>`,
  }),
};

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Premium HTML Template Generator
 * Creates a "company-grade" look with brand colors and responsive design.
 */
const generateEmailHtml = (title: string, message: string, buttonText?: string, buttonUrl?: string) => {
  const brandColor = "#6366f1"; // Indigo-600

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        .body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .header { background-color: ${brandColor}; padding: 48px 40px; text-align: center; color: #ffffff; }
        .content { padding: 48px 40px; color: #334155; line-height: 1.6; }
        .footer { background-color: #f1f5f9; padding: 24px 40px; text-align: center; color: #64748b; font-size: 12px; }
        .button { display: inline-block; padding: 16px 32px; background-color: ${brandColor}; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 24px; }
        h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
        p { margin-bottom: 16px; font-size: 16px; }
        .highlight { color: ${brandColor}; font-weight: 700; }
      </style>
    </head>
    <body class="body">
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
          ${buttonText && buttonUrl ? `<a href="${buttonUrl}" class="button">${buttonText}</a>` : ''}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Decoration Rental System. All rights reserved.</p>
          <p>Mogadishu, Somalia</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendEmail = async ({
  to,
  subject,
  message,
  html,
}: {
  to: string;
  subject?: string;
  message: string;
  html?: string;
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"Decoration Rental" <${process.env.EMAIL_USER}>`,
      to,
      subject: subject || "System Notification",
      text: message,
      html: html || generateEmailHtml(subject || "Notification", message),
    });

    console.log("Email sent successfully:", info.messageId);
    return { success: true };
  } catch (error: any) {
    console.error("Nodemailer Error:", error);
    return { success: false, error: error.message };
  }
};

export const emailTemplates = {
  welcome: (name: string) => ({
    subject: "Welcome to Decoration Rental!",
    message: `Hi ${name},\n\nWelcome to our platform! We are thrilled to have you here. You can now browse our premium decorations and start booking for your special events.`,
    html: generateEmailHtml(
      "Welcome Aboard!",
      `Hi <span class="highlight">${name}</span>,\n\nWelcome to our platform! We are thrilled to have you here. You can now browse our premium decorations and start booking for your special events.`,
      "Start Browsing",
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/decorations`
    )
  }),
  bookingConfirmation: (id: string, date: string, price: number) => ({
    subject: `Booking Confirmed #${id.slice(-6).toUpperCase()}`,
    message: `Your booking for ${date} has been successfully confirmed. Total Amount: $${price}.`,
    html: generateEmailHtml(
      "Booking Confirmed",
      `Your booking for <span class="highlight">${date}</span> has been successfully confirmed.\n\nBooking ID: #${id.slice(-6).toUpperCase()}\nTotal Amount: $${price}`,
      "View Booking Details",
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bookings`
    )
  }),
  bookingReport: (data: {
    bookingId: string;
    eventDate: string;
    endDate: string;
    location: string;
    totalPrice: number;
    paidAmount: number;
    balance: number;
    items: Array<{ name: string; quantity: number; price: number }>;
  }) => {
    const itemsTable = data.items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px;">${item.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: right;">$${item.price.toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
          </tr>`
      )
      .join("");

    const messageHtml = `
      <div style="margin-bottom: 24px;">
        <p>Thank you for your booking! Below is your full booking and transaction report.</p>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Booking ID:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #0f172a;">#${data.bookingId.slice(-6).toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Event Dates:</td>
              <td style="padding: 6px 0; text-align: right; color: #0f172a;">${data.eventDate} to ${data.endDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Location:</td>
              <td style="padding: 6px 0; text-align: right; color: #0f172a;">${data.location}</td>
            </tr>
          </table>
        </div>

        <h3 style="font-size: 16px; margin-bottom: 12px; font-weight: 700; color: #0f172a;">Reserved Items</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Item Name</th>
              <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Qty</th>
              <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Unit Price</th>
              <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTable}
          </tbody>
        </table>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Subtotal Price:</td>
              <td style="padding: 6px 0; text-align: right; color: #0f172a; font-weight: bold;">$${data.totalPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Amount Paid Now:</td>
              <td style="padding: 6px 0; text-align: right; color: #059669; font-weight: bold;">$${data.paidAmount.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 12px 0 0 0; color: #64748b; font-weight: bold; font-size: 16px;">Remaining Balance:</td>
              <td style="padding: 12px 0 0 0; text-align: right; color: #d97706; font-weight: bold; font-size: 16px;">$${data.balance.toFixed(2)}</td>
            </tr>
          </table>
        </div>
      </div>
    `;

    return {
      subject: `Booking & Transaction Report #${data.bookingId.slice(-6).toUpperCase()}`,
      message: `Thank you for your booking! ID: #${data.bookingId.slice(-6).toUpperCase()}. Total: $${data.totalPrice.toFixed(2)}, Paid: $${data.paidAmount.toFixed(2)}, Balance: $${data.balance.toFixed(2)}.`,
      html: generateEmailHtml(
        "Booking Transaction Report",
        messageHtml,
        "View Booking Details",
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bookings`
      )
    };
  },
  paymentReceipt: (id: string, amount: number, balance: number) => ({
    subject: `Payment Received - Booking #${id.slice(-6).toUpperCase()}`,
    message: `We have received your payment of $${amount}. Your remaining balance is $${balance}.`,
    html: generateEmailHtml(
      "Payment Received",
      `Thank you for your payment! We have received <span class="highlight">$${amount}</span> for your booking.\n\nBooking ID: #${id.slice(-6).toUpperCase()}\nRemaining Balance: $${balance}`,
      "Go to Dashboard",
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
    )
  }),
  otp: (code: string) => ({
    subject: "Your Verification Code",
    message: `Your verification code is: ${code}. It will expire in 10 minutes.`,
    html: generateEmailHtml(
      "Email Verification",
      `Your verification code is: <span style="font-size: 32px; letter-spacing: 5px; color: #6366f1; font-weight: 900; display: block; margin: 20px 0;">${code}</span>\n\nThis code will expire in <span class="highlight">10 minutes</span>. If you did not request this, please ignore this email.`
    )
  }),
};


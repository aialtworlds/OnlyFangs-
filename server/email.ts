import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email via Resend
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("[Email] RESEND_API_KEY not configured. Email would be sent to:", payload.to);
      return { success: true }; // Silently succeed in dev mode
    }

    const result = await resend.emails.send({
      from: "Only Fangs <noreply@onlyfangs.social>",
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });

    if (result.error) {
      console.error("[Email] Failed to send email:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log("[Email] Sent successfully to", payload.to);
    return { success: true };
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  patronEmail: string,
  patronName: string,
  creatorName: string,
  tierName: string,
  amount: number,
  currency: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #e0e0e0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a1a; border: 1px solid #c41e3a; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #c41e3a; font-size: 28px; margin: 0; }
          .content { line-height: 1.6; }
          .tier-info { background-color: #2a2a2a; padding: 15px; border-left: 3px solid #c41e3a; margin: 20px 0; }
          .amount { font-size: 24px; color: #c41e3a; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #333; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Payment Confirmed</h1>
          </div>
          <div class="content">
            <p>Hello ${patronName},</p>
            <p>Your subscription to <strong>${creatorName}</strong> has been successfully activated!</p>
            
            <div class="tier-info">
              <p><strong>Tier:</strong> ${tierName}</p>
              <p><strong>Amount:</strong> <span class="amount">${currency.toUpperCase()} ${(amount / 100).toFixed(2)}</span></p>
              <p><strong>Status:</strong> Active</p>
            </div>

            <p>You now have access to exclusive content from ${creatorName}. Visit your profile to start exploring!</p>
            
            <p>If you have any questions, feel free to contact us.</p>
            
            <p>Welcome to Only Fangs! 🖤</p>
          </div>
          <div class="footer">
            <p>© 2026 Only Fangs. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: patronEmail,
    subject: `Welcome to ${creatorName}'s ${tierName} tier - Only Fangs`,
    html,
  });
}

/**
 * Send subscription renewal email
 */
export async function sendSubscriptionRenewalEmail(
  patronEmail: string,
  patronName: string,
  creatorName: string,
  tierName: string,
  amount: number,
  currency: string,
  nextRenewalDate: Date
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #e0e0e0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a1a; border: 1px solid #c41e3a; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #c41e3a; font-size: 28px; margin: 0; }
          .content { line-height: 1.6; }
          .renewal-info { background-color: #2a2a2a; padding: 15px; border-left: 3px solid #c41e3a; margin: 20px 0; }
          .amount { font-size: 24px; color: #c41e3a; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #333; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Subscription Renewed</h1>
          </div>
          <div class="content">
            <p>Hello ${patronName},</p>
            <p>Your subscription to <strong>${creatorName}</strong> has been successfully renewed!</p>
            
            <div class="renewal-info">
              <p><strong>Tier:</strong> ${tierName}</p>
              <p><strong>Amount Charged:</strong> <span class="amount">${currency.toUpperCase()} ${(amount / 100).toFixed(2)}</span></p>
              <p><strong>Next Renewal:</strong> ${nextRenewalDate.toLocaleDateString()}</p>
            </div>

            <p>Thank you for your continued support of ${creatorName}!</p>
            
            <p>If you have any questions or need to manage your subscription, visit your profile.</p>
          </div>
          <div class="footer">
            <p>© 2026 Only Fangs. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: patronEmail,
    subject: `Your subscription to ${creatorName} has been renewed`,
    html,
  });
}

/**
 * Send subscription cancellation email
 */
export async function sendSubscriptionCancellationEmail(
  patronEmail: string,
  patronName: string,
  creatorName: string,
  tierName: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #e0e0e0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a1a; border: 1px solid #c41e3a; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #c41e3a; font-size: 28px; margin: 0; }
          .content { line-height: 1.6; }
          .cancellation-info { background-color: #2a2a2a; padding: 15px; border-left: 3px solid #c41e3a; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #333; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Cancelled</h1>
          </div>
          <div class="content">
            <p>Hello ${patronName},</p>
            <p>Your subscription to <strong>${creatorName}</strong> has been cancelled.</p>
            
            <div class="cancellation-info">
              <p><strong>Tier:</strong> ${tierName}</p>
              <p><strong>Status:</strong> Cancelled</p>
              <p>You will no longer have access to exclusive content from this creator.</p>
            </div>

            <p>We're sorry to see you go! If you change your mind, you can resubscribe anytime from the creator's profile.</p>
            
            <p>If you have any feedback or questions, feel free to contact us.</p>
          </div>
          <div class="footer">
            <p>© 2026 Only Fangs. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: patronEmail,
    subject: `Your subscription to ${creatorName} has been cancelled`,
    html,
  });
}

/**
 * Send creator notification email for new subscription
 */
export async function sendCreatorNotificationEmail(
  creatorEmail: string,
  creatorName: string,
  patronName: string,
  tierName: string,
  amount: number,
  currency: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #e0e0e0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a1a; border: 1px solid #c41e3a; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #c41e3a; font-size: 28px; margin: 0; }
          .content { line-height: 1.6; }
          .subscriber-info { background-color: #2a2a2a; padding: 15px; border-left: 3px solid #c41e3a; margin: 20px 0; }
          .amount { font-size: 24px; color: #c41e3a; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #333; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 New Subscriber!</h1>
          </div>
          <div class="content">
            <p>Hello ${creatorName},</p>
            <p>You have a new subscriber!</p>
            
            <div class="subscriber-info">
              <p><strong>Subscriber:</strong> ${patronName}</p>
              <p><strong>Tier:</strong> ${tierName}</p>
              <p><strong>Amount:</strong> <span class="amount">${currency.toUpperCase()} ${(amount / 100).toFixed(2)}</span></p>
            </div>

            <p>Visit your admin panel to view subscriber details and manage your content.</p>
          </div>
          <div class="footer">
            <p>© 2026 Only Fangs. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: creatorEmail,
    subject: `New subscriber: ${patronName} joined your ${tierName} tier`,
    html,
  });
}

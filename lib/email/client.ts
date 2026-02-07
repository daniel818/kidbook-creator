// ============================================
// Email Service with Resend
// ============================================

import { Resend } from 'resend';
import { env } from '@/lib/env';

const resend = new Resend(env.RESEND_API_KEY);

const FROM_EMAIL = env.EMAIL_FROM;

export interface OrderEmailData {
  orderId: string;
  customerEmail: string;
  customerName: string;
  bookTitle: string;
  childName: string;
  format: string;
  size: string;
  quantity: number;
  total: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface ShippingEmailData extends OrderEmailData {
  trackingNumber: string;
  trackingUrl: string;
  carrier: string;
  estimatedDelivery: string;
}

export interface DigitalUnlockEmailData {
  bookId: string;
  customerEmail: string;
  customerName: string;
  bookTitle: string;
  childName: string;
}

// Send order confirmation email
export async function sendOrderConfirmation(data: OrderEmailData) {
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Order Confirmed! Your "${data.bookTitle}" is being prepared 📚`,
      html: generateOrderConfirmationHtml(data),
    });

    if (error) {
      console.error('Failed to send order confirmation:', error);
      return { success: false, error };
    }

    console.log('Order confirmation sent:', result?.id);
    return { success: true, id: result?.id };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}

// Send shipping notification email
export async function sendShippingNotification(data: ShippingEmailData) {
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Your book is on its way! 🚚 Track your "${data.bookTitle}"`,
      html: generateShippingNotificationHtml(data),
    });

    if (error) {
      console.error('Failed to send shipping notification:', error);
      return { success: false, error };
    }

    console.log('Shipping notification sent:', result?.id);
    return { success: true, id: result?.id };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}

// Send delivery confirmation email
export async function sendDeliveryConfirmation(data: OrderEmailData) {
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Your "${data.bookTitle}" has been delivered! 🎉`,
      html: generateDeliveryConfirmationHtml(data),
    });

    if (error) {
      console.error('Failed to send delivery confirmation:', error);
      return { success: false, error };
    }

    console.log('Delivery confirmation sent:', result?.id);
    return { success: true, id: result?.id };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}

// Send digital unlock email
export async function sendDigitalUnlockEmail(data: DigitalUnlockEmailData) {
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Your digital book "${data.bookTitle}" is ready ✨`,
      html: generateDigitalUnlockHtml(data),
    });

    if (error) {
      console.error('Failed to send digital unlock email:', error);
      return { success: false, error };
    }

    console.log('Digital unlock email sent:', result?.id);
    return { success: true, id: result?.id };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}

// ============================================
// HTML Email Templates
// ============================================

function generateOrderConfirmationHtml(data: OrderEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
          <tr>
            <td>
              <div style="font-size: 48px; margin-bottom: 16px;">📚</div>
              <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0;">Order Confirmed!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 12px 0 0 0;">Thank you for your order, ${data.customerName}</p>
            </td>
          </tr>
        </table>

        <!-- Order Details -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <tr>
            <td>
              <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0;">Order #${data.orderId.slice(0, 8)}</p>
              
              <!-- Book Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td style="width: 80px; vertical-align: top;">
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 32px; text-align: center; line-height: 70px;">📖</div>
                  </td>
                  <td style="vertical-align: top; padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 18px; color: #1e293b;">${data.bookTitle}</h3>
                    <p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px;">For ${data.childName}</p>
                    <p style="margin: 0; color: #64748b; font-size: 14px;">${data.format} · ${data.size} · Qty: ${data.quantity}</p>
                  </td>
                  <td style="vertical-align: top; text-align: right;">
                    <p style="margin: 0; font-size: 20px; font-weight: 700; color: #1e293b;">$${data.total.toFixed(2)}</p>
                  </td>
                </tr>
              </table>

              <!-- Shipping Address -->
              <h3 style="font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 12px 0;">Shipping To</h3>
              <p style="color: #1e293b; font-size: 15px; line-height: 1.6; margin: 0;">
                ${data.shippingAddress.fullName}<br>
                ${data.shippingAddress.addressLine1}<br>
                ${data.shippingAddress.addressLine2 ? data.shippingAddress.addressLine2 + '<br>' : ''}
                ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
                ${data.shippingAddress.country}
              </p>

              <!-- Timeline -->
              <h3 style="font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin: 32px 0 12px 0;">What's Next?</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="display: inline-block; width: 24px; height: 24px; background: #10b981; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 12px;">✓</span>
                    <span style="color: #1e293b; margin-left: 12px;">Order received</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="display: inline-block; width: 24px; height: 24px; background: #6366f1; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 12px;">2</span>
                    <span style="color: #1e293b; margin-left: 12px;">Preparing for print (1-2 days)</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="display: inline-block; width: 24px; height: 24px; background: #e2e8f0; border-radius: 50%; text-align: center; line-height: 24px; color: #64748b; font-size: 12px;">3</span>
                    <span style="color: #64748b; margin-left: 12px;">Printing (2-3 days)</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="display: inline-block; width: 24px; height: 24px; background: #e2e8f0; border-radius: 50%; text-align: center; line-height: 24px; color: #64748b; font-size: 12px;">4</span>
                    <span style="color: #64748b; margin-left: 12px;">Shipped to you (5-7 days)</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="${env.NEXT_PUBLIC_APP_URL}/orders" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px;">Track Your Order</a>
              </div>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px; text-align: center;">
          <tr>
            <td>
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">Questions? Reply to this email or contact us at support@kidbookcreator.com</p>
              <p style="color: #94a3b8; font-size: 13px; margin: 12px 0 0 0;">© ${new Date().getFullYear()} KidBook Creator. Made with ❤️ for parents.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateDigitalUnlockHtml(data: DigitalUnlockEmailData): string {
  const appUrl = env.NEXT_PUBLIC_APP_URL || '';
  const bookUrl = `${appUrl}/book/${data.bookId}`;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Digital Book Is Ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
          <tr>
            <td>
              <div style="font-size: 48px; margin-bottom: 16px;">✨</div>
              <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0;">Your book is ready!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 12px 0 0 0;">Hi ${data.customerName}, your digital copy is unlocked.</p>
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <tr>
            <td>
              <h3 style="margin: 0 0 8px 0; font-size: 20px; color: #1e293b;">${data.bookTitle}</h3>
              <p style="margin: 0 0 16px 0; color: #64748b; font-size: 15px;">For ${data.childName}</p>
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Your book is ready to view and download. The digital PDF is available inside the viewer.
              </p>

              <div style="text-align: center; margin: 24px 0 16px 0;">
                <a href="${bookUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px;">View & Download</a>
              </div>

              <p style="color: #94a3b8; font-size: 13px; margin: 0; text-align: center;">
                If the button doesn’t work, copy and paste this link:<br>
                ${bookUrl}
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px; text-align: center;">
          <tr>
            <td>
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">Questions? Reply to this email or contact us at support@kidbookcreator.com</p>
              <p style="color: #94a3b8; font-size: 13px; margin: 12px 0 0 0;">© ${new Date().getFullYear()} KidBook Creator</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateShippingNotificationHtml(data: ShippingEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Book Has Shipped!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
          <tr>
            <td>
              <div style="font-size: 48px; margin-bottom: 16px;">🚚</div>
              <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0;">Your Book is On Its Way!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 12px 0 0 0;">Estimated delivery: ${data.estimatedDelivery}</p>
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <tr>
            <td>
              <!-- Tracking Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="color: #166534; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">Tracking Number</p>
                    <p style="color: #166534; font-size: 18px; font-weight: 700; margin: 0;">${data.trackingNumber}</p>
                    <p style="color: #64748b; font-size: 14px; margin: 8px 0 0 0;">Carrier: ${data.carrier}</p>
                  </td>
                </tr>
              </table>

              <!-- Track Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${data.trackingUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px;">Track Package →</a>
              </div>

              <!-- Book Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 12px; padding: 16px;">
                <tr>
                  <td style="width: 60px;">
                    <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); border-radius: 8px; text-align: center; line-height: 50px; font-size: 24px;">📖</div>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1e293b;">${data.bookTitle}</p>
                    <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Order #${data.orderId.slice(0, 8)}</p>
                  </td>
                </tr>
              </table>

              <!-- Shipping Address -->
              <h3 style="font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 12px 0;">Delivering To</h3>
              <p style="color: #1e293b; font-size: 15px; line-height: 1.6; margin: 0;">
                ${data.shippingAddress.fullName}<br>
                ${data.shippingAddress.addressLine1}<br>
                ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px; text-align: center;">
          <tr>
            <td>
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">© ${new Date().getFullYear()} KidBook Creator</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateDeliveryConfirmationHtml(data: OrderEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Book Has Been Delivered!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
          <tr>
            <td>
              <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0;">Your Book Has Arrived!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 12px 0 0 0;">We hope ${data.childName} loves it!</p>
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <tr>
            <td>
              <p style="color: #1e293b; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
                Great news! Your personalized book <strong>"${data.bookTitle}"</strong> has been delivered to your address.
              </p>

              <!-- Share the Joy -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">📸 Share the Magic!</p>
                    <p style="color: #a16207; font-size: 14px; margin: 0;">Take a photo of your little one with their new book and share it with us!</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Buttons -->
              <div style="text-align: center; margin: 24px 0;">
                <a href="${env.NEXT_PUBLIC_APP_URL}/create" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; margin: 0 8px 8px 0;">Create Another Book</a>
                <a href="${env.NEXT_PUBLIC_APP_URL}/create/${data.orderId}/order" style="display: inline-block; padding: 14px 32px; background: #f1f5f9; color: #475569; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; margin: 0 0 8px 8px;">Order Another Copy</a>
              </div>

              <!-- Feedback -->
              <p style="color: #64748b; font-size: 14px; text-align: center; margin: 24px 0 0 0;">
                How was your experience? <a href="mailto:support@kidbookcreator.com" style="color: #6366f1;">Let us know!</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px; text-align: center;">
          <tr>
            <td>
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">Thank you for choosing KidBook Creator! ❤️</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

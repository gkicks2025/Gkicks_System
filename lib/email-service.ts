import nodemailer from 'nodemailer';

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Order data interface for email
interface OrderEmailData {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  orderDate: string;
}

// Staff notification data interface
interface StaffNotificationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  itemCount: number;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
  }>;
}

// Create email transporter
function createTransporter() {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };

  return nodemailer.createTransport(config);
}

// Generate HTML email template for order receipt
function generateOrderReceiptHTML(orderData: OrderEmailData): string {
  const itemsHTML = orderData.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <div style="font-weight: 600; color: #333;">${item.name}</div>
            ${item.size ? `<div style="font-size: 14px; color: #666;">Size: ${item.size}</div>` : ''}
            ${item.color ? `<div style="font-size: 14px; color: #666;">Color: ${item.color}</div>` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₱${item.price.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">₱${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Receipt - GKICKS</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">GKICKS</h1>
        <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Your Premium Shoe Destination</p>
      </div>

      <!-- Order Confirmation -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #667eea; margin-bottom: 10px;">Order Confirmation</h2>
        <p style="font-size: 18px; margin: 0;">Thank you for your purchase, <strong>${orderData.customerName}</strong>!</p>
        <p style="color: #666; margin: 10px 0;">Your order has been successfully placed and is being processed.</p>
      </div>

      <!-- Order Details -->
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin-top: 0; color: #333;">Order Details</h3>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span><strong>Order Number:</strong></span>
          <span style="color: #667eea; font-weight: 600;">${orderData.orderNumber}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span><strong>Order Date:</strong></span>
          <span>${orderData.orderDate}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span><strong>Email:</strong></span>
          <span>${orderData.customerEmail}</span>
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px;">Items Ordered</h3>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: #667eea; color: white;">
              <th style="padding: 15px; text-align: left;">Item</th>
              <th style="padding: 15px; text-align: center;">Qty</th>
              <th style="padding: 15px; text-align: right;">Price</th>
              <th style="padding: 15px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>

      <!-- Order Summary -->
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 30px;">
        <h3 style="margin-top: 0; color: #333;">Order Summary</h3>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span>Subtotal:</span>
          <span>₱${orderData.subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span>Tax:</span>
          <span>₱${orderData.tax.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
          <span>Shipping:</span>
          <span>₱${orderData.shipping.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #667eea;">
          <span>Total:</span>
          <span>₱${orderData.total.toFixed(2)}</span>
        </div>
      </div>

      <!-- Shipping Address -->
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin-top: 0; color: #333;">Shipping Address</h3>
        <div style="color: #666;">
          <div style="font-weight: 600; color: #333; margin-bottom: 5px;">${orderData.shippingAddress.fullName}</div>
          <div>${orderData.shippingAddress.address}</div>
          <div>${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.postalCode}</div>
          <div>${orderData.shippingAddress.country}</div>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; color: #666;">
        <p style="margin: 0 0 10px 0;">Thank you for choosing GKICKS!</p>
        <p style="margin: 0; font-size: 14px;">If you have any questions, please contact us at support@gkicks.com</p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="margin: 0; font-size: 12px; color: #999;">© 2024 GKICKS. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send order receipt email
export async function sendOrderReceipt(orderData: OrderEmailData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    
    const mailOptions = {
      from: {
        name: 'GKICKS',
        address: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@gkicks.com',
      },
      to: orderData.customerEmail,
      subject: `Order Confirmation - ${orderData.orderNumber} | GKICKS`,
      html: generateOrderReceiptHTML(orderData),
      text: `
Order Confirmation - GKICKS

Thank you for your purchase, ${orderData.customerName}!

Order Number: ${orderData.orderNumber}
Order Date: ${orderData.orderDate}
Total: ₱${orderData.total.toFixed(2)}

Your order has been successfully placed and is being processed.

Thank you for choosing GKICKS!
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Order receipt email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send order receipt email:', error);
    return false;
  }
}

// Generate HTML email template for staff notification
function generateStaffNotificationHTML(notificationData: StaffNotificationData): string {
  const itemsHTML = notificationData.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            <div style="font-weight: 600; color: #333;">${item.name}</div>
            ${item.size ? `<div style="font-size: 12px; color: #666;">Size: ${item.size}</div>` : ''}
            ${item.color ? `<div style="font-size: 12px; color: #666;">Color: ${item.color}</div>` : ''}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₱${item.price.toFixed(2)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order Alert - GKICKS</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; border-radius: 10px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🚨 NEW ORDER ALERT</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">GKICKS Staff Notification</p>
      </div>

      <!-- Order Alert -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #dc2626; margin-bottom: 10px;">New Order Received!</h2>
        <p style="font-size: 16px; margin: 0;">A new order has been placed and requires your attention.</p>
      </div>

      <!-- Order Summary -->
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #333;">Order Summary</h3>
        <div style="margin-bottom: 10px;">
          <span><strong>Order Number:</strong></span>
          <span style="color: #dc2626; font-weight: 600; margin-left: 10px;">${notificationData.orderNumber}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <span><strong>Customer:</strong></span>
          <span style="margin-left: 10px;">${notificationData.customerName}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <span><strong>Email:</strong></span>
          <span style="margin-left: 10px;">${notificationData.customerEmail}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <span><strong>Order Date:</strong></span>
          <span style="margin-left: 10px;">${notificationData.orderDate}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <span><strong>Total Items:</strong></span>
          <span style="margin-left: 10px;">${notificationData.itemCount}</span>
        </div>
        <div>
          <span><strong>Total Amount:</strong></span>
          <span style="color: #dc2626; font-weight: 600; font-size: 18px; margin-left: 10px;">₱${notificationData.total.toFixed(2)}</span>
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569;">Item</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #475569;">Qty</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; color: #475569;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>

      <!-- Action Required -->
      <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #92400e;">⚠️ Action Required</h3>
        <p style="margin: 0; color: #92400e;">Please log in to the admin panel to process this order and update its status.</p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
        <p style="margin: 0;">This is an automated notification from GKICKS Order Management System.</p>
        <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
}

// Send staff notification email
export async function sendStaffNotification(notificationData: StaffNotificationData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    
    const mailOptions = {
      from: {
        name: 'GKICKS Order System',
        address: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@gkicks.com',
      },
      to: 'gkicksstaff@gmail.com',
      subject: `🚨 New Order Alert: ${notificationData.orderNumber} - ₱${notificationData.total.toFixed(2)}`,
      html: generateStaffNotificationHTML(notificationData),
      text: `
NEW ORDER ALERT - GKICKS

Order Number: ${notificationData.orderNumber}
Customer: ${notificationData.customerName}
Email: ${notificationData.customerEmail}
Total: ₱${notificationData.total.toFixed(2)}
Items: ${notificationData.itemCount}
Date: ${notificationData.orderDate}

Please log in to the admin panel to process this order.
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Staff notification email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send staff notification email:', error);
    return false;
  }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return false;
  }
}
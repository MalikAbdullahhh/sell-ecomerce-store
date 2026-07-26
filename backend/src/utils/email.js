import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

function money(n) {
  return `Rs ${Number(n || 0).toLocaleString("en-PK")}`;
}

export function buildOrderEmailHtml(order, settings) {
  const items = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;">
          <strong>${i.name}</strong><br/>
          <span style="color:#666;font-size:12px;">${[i.color, i.size].filter(Boolean).join(" · ")} · Qty ${i.qty}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;text-align:right;">${money(i.price * i.qty)}</td>
      </tr>`,
    )
    .join("");

  const contact = settings?.contact || {};
  const payNote =
    order.paymentMethod === "online"
      ? `<p style="margin-top:16px;padding:12px;border:1px solid #111;font-size:13px;">
          Online payment selected. Please transfer <strong>${money(order.total)}</strong> using the QR / bank details shown at checkout.
         </p>`
      : `<p style="margin-top:16px;font-size:13px;color:#444;">Payment method: Cash on Delivery</p>`;

  return `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#111;background:#fafafa;padding:32px;">
    <h1 style="font-size:28px;letter-spacing:-0.03em;margin:0 0 8px;">Order confirmed</h1>
    <p style="font-family:monospace;font-size:12px;color:#666;margin:0 0 24px;">
      ${order.orderNumber} · ${new Date(order.createdAt).toLocaleString("en-PK")}
    </p>
    <table style="width:100%;border-collapse:collapse;">${items}</table>
    <table style="width:100%;margin-top:16px;font-family:monospace;font-size:13px;">
      <tr><td style="color:#666;">Subtotal</td><td style="text-align:right;">${money(order.subtotal)}</td></tr>
      <tr><td style="color:#666;">Gift wrapping</td><td style="text-align:right;">${money(order.giftTotal)}</td></tr>
      <tr><td style="color:#666;">Shipping</td><td style="text-align:right;">${order.shippingFee === 0 ? "Free" : money(order.shippingFee)}</td></tr>
      <tr><td style="padding-top:10px;border-top:1px solid #111;"><strong>Total</strong></td>
          <td style="padding-top:10px;border-top:1px solid #111;text-align:right;"><strong>${money(order.total)}</strong></td></tr>
    </table>
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #ddd;font-size:13px;">
      <p style="margin:0 0 4px;"><strong>Ship to</strong></p>
      <p style="margin:0;color:#444;">
        ${order.shipping.name}<br/>
        ${order.shipping.address}<br/>
        ${order.shipping.city}${order.shipping.postalCode ? `, ${order.shipping.postalCode}` : ""}<br/>
        ${order.shipping.phone}
      </p>
    </div>
    ${payNote}
    <div style="margin-top:28px;padding:16px;background:#111;color:#fafafa;font-size:13px;">
      <p style="margin:0 0 8px;font-family:monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.7;">Need help?</p>
      <p style="margin:0;">Call ${contact.phone || ""} · WhatsApp ${contact.whatsapp || contact.phone || ""}</p>
      <p style="margin:6px 0 0;">${contact.email || ""}</p>
    </div>
  </div>`;
}

export async function sendOrderConfirmation(order, settings) {
  const to = order.shipping?.email?.trim();
  if (!to) {
    console.log("[email] Skipped — no customer email on order", order.orderNumber);
    return { sent: false, reason: "no_email" };
  }

  const tx = getTransporter();
  if (!tx) {
    console.log(
      "[email] SMTP not configured — logging confirmation for",
      order.orderNumber,
      "→",
      to,
    );
    return { sent: false, reason: "smtp_not_configured" };
  }

  await tx.sendMail({
    from: process.env.SMTP_FROM || "Aperture <noreply@aperture.tech>",
    to,
    subject: `Order confirmed — ${order.orderNumber}`,
    html: buildOrderEmailHtml(order, settings),
  });

  return { sent: true };
}

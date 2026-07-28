import { money } from "@/lib/store";

export type WhatsAppOrderDetails = {
  productName: string;
  productSlug: string;
  qty: number;
  unitPrice: number;
  color?: string;
  size?: string;
  gift?: boolean;
  giftMessage?: string;
  brandName?: string;
};

/** Digits only for wa.me — keeps leading country code if present. */
export function normalizeWhatsAppNumber(raw: string | undefined | null): string {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits;
}

export function buildWhatsAppOrderMessage(details: WhatsAppOrderDetails): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = origin ? `${origin}/product/${details.productSlug}` : `/product/${details.productSlug}`;
  const total = details.unitPrice * details.qty;
  const lines = [
    `Hi${details.brandName ? ` ${details.brandName}` : ""}! I'd like to order via WhatsApp:`,
    "",
    `*Product:* ${details.productName}`,
    `*Link:* ${link}`,
    `*Quantity:* ${details.qty}`,
  ];
  if (details.color) lines.push(`*Color:* ${details.color}`);
  if (details.size) lines.push(`*Size:* ${details.size}`);
  lines.push(`*Unit price:* ${money(details.unitPrice)}`);
  lines.push(`*Total:* ${money(total)}`);
  if (details.gift) {
    lines.push(`*Gift wrap:* Yes`);
    if (details.giftMessage?.trim()) lines.push(`*Gift message:* ${details.giftMessage.trim()}`);
  }
  lines.push("", "Please confirm availability and delivery. Thank you!");
  return lines.join("\n");
}

export function buildWhatsAppOrderUrl(
  phone: string | undefined | null,
  details: WhatsAppOrderDetails,
): string | null {
  const number = normalizeWhatsAppNumber(phone);
  if (!number) return null;
  const text = buildWhatsAppOrderMessage(details);
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

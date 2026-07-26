import { Router } from "express";
import nodemailer from "nodemailer";
import { NewsletterSubscriber, NewsletterCampaign } from "../models/Newsletter.js";
import SiteSettings from "../models/SiteSettings.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/helpers.js";

const router = Router();

function getTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

router.post(
  "/subscribe",
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || "")
      .toLowerCase()
      .trim();
    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Valid email is required" });
    }
    const existing = await NewsletterSubscriber.findOne({ email });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.name = req.body.name || existing.name;
        await existing.save();
      }
      return res.json({ message: "Already subscribed", subscriber: existing });
    }
    const subscriber = await NewsletterSubscriber.create({
      email,
      name: req.body.name || "",
      source: req.body.source || "website",
    });

    const settings = await SiteSettings.findOne({ key: "main" });
    const tx = getTransporter();
    if (tx) {
      try {
        await tx.sendMail({
          from: process.env.SMTP_FROM || "Aperture <noreply@aperture.tech>",
          to: email,
          subject: "You're on the Aperture list",
          html: `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:24px;">
            <h1 style="font-size:24px;">Welcome</h1>
            <p>${settings?.newsletter?.successMessage || "Thanks for subscribing."}</p>
          </div>`,
        });
      } catch (err) {
        console.error("[newsletter welcome]", err.message);
      }
    }

    res.status(201).json({ message: "Subscribed", subscriber });
  }),
);

router.get(
  "/subscribers",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const subscribers = await NewsletterSubscriber.find().sort({ createdAt: -1 });
    res.json({ subscribers });
  }),
);

router.delete(
  "/subscribers/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await NewsletterSubscriber.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  }),
);

router.get(
  "/campaigns",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const campaigns = await NewsletterCampaign.find().sort({ createdAt: -1 });
    res.json({ campaigns });
  }),
);

router.post(
  "/send",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const subject = req.body.subject?.trim();
    const bodyHtml = req.body.bodyHtml?.trim();
    if (!subject || !bodyHtml) {
      return res.status(400).json({ message: "Subject and body are required" });
    }

    const subscribers = await NewsletterSubscriber.find({ isActive: true });
    const campaign = await NewsletterCampaign.create({
      subject,
      bodyHtml,
      status: "draft",
    });

    const tx = getTransporter();
    if (!tx) {
      campaign.status = "failed";
      await campaign.save();
      return res.status(400).json({
        message: "SMTP is not configured. Fill SMTP_USER and SMTP_PASS in backend/.env",
        campaign,
      });
    }

    let sent = 0;
    for (const sub of subscribers) {
      try {
        await tx.sendMail({
          from: process.env.SMTP_FROM || "Aperture <noreply@aperture.tech>",
          to: sub.email,
          subject,
          html: bodyHtml,
        });
        sent += 1;
      } catch (err) {
        console.error("[newsletter send]", sub.email, err.message);
      }
    }

    campaign.sentCount = sent;
    campaign.status = sent > 0 ? "sent" : "failed";
    campaign.sentAt = new Date();
    await campaign.save();

    res.json({
      message: `Sent to ${sent} of ${subscribers.length} subscribers`,
      campaign,
    });
  }),
);

export default router;

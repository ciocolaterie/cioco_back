import { BrevoClient } from '@getbrevo/brevo';
import { asyncHandler } from '../middleware/error.middleware.js';
import { Settings } from '../models/Settings.js';

const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

export const sendContact = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
  }

  const s = await Settings.findOne() || {};
  const storeName = s.storeName || process.env.BREVO_FROM_NAME || 'Magazin';
  const adminEmail = process.env.ADMIN_CONTACT_EMAIL || process.env.ADMIN_EMAIL;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const key = process.env.BREVO_API_KEY;

  if (key && fromEmail && adminEmail) {
    try {
      const brevo = new BrevoClient({ apiKey: key });
      await brevo.transactionalEmails.sendTransacEmail({
        subject: `Mesaj nou de la ${name} — ${storeName}`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
            <h2 style="color:#1C1410;">Mesaj nou de contact</h2>
            <p><strong>De la:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p>
            <div style="background:#F5F0EB;border-radius:10px;padding:16px 20px;margin:16px 0;white-space:pre-wrap;">${esc(message)}</div>
            <p style="color:#A0918A;font-size:12px;">Trimis de pe formularul de contact ${esc(storeName)}.</p>
          </div>
        `,
        sender: {
          name: process.env.BREVO_FROM_NAME || 'Ciocolaterie',
          email: fromEmail,
        },
        to: [{ email: adminEmail }],
        replyTo: { email, name },
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[CONTACT] Email error:', err?.message);
      }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    console.log(`[CONTACT] From: ${name} <${email}>\n${message}`);
  }

  res.json({ ok: true });
});

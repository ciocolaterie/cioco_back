import { BrevoClient } from '@getbrevo/brevo';

const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const STATUS_TEXT = {
  noua: 'Comanda ta a fost primită',
  in_pregatire: 'Comanda ta este în pregătire',
  gata: 'Comanda ta este gata! Poți veni să o ridici.',
  livrata: 'Comanda ta a fost livrată. Poftă bună!',
  anulata: 'Comanda ta a fost anulată.',
};

const STATUS_EMOJI = {
  noua: '🍫',
  in_pregatire: '👨‍🍳',
  gata: '✅',
  livrata: '🎉',
  anulata: '❌',
};

function getBrevoClient() {
  const key = process.env.BREVO_API_KEY;
  if (!key) return null;
  return new BrevoClient({ apiKey: key });
}

const DEFAULT_LOGO = 'https://res.cloudinary.com/do3wzvgto/image/upload/v1780763493/ciocolaterie/logo-email.svg';

function logoHtml(storeLogo, storeName) {
  const src = storeLogo || DEFAULT_LOGO;
  return `<img src="${src}" width="88" height="88" alt="${esc(storeName)}" style="display:inline-block;margin-bottom:16px;"/>`;
}

function orderCreatedHtml(order, store) {
  const storeName = store.storeName || 'Magazin';
  const storeAddress = store.storeAddress || '';
  const storeEmail = store.storeEmail || '';
  const storeLogo = store.storeLogo || '';
  const itemsHtml = order.items.map(i =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #EDE8E1;">${esc(i.qty)} × ${esc(i.name)}</td>
      <td style="padding:8px 0;border-bottom:1px solid #EDE8E1;text-align:right;font-weight:600;">${(i.price * i.qty).toFixed(2)} lei</td>
    </tr>`
  ).join('');

  const discountRow = order.discount > 0
    ? `<tr><td style="padding:4px 0;color:#059669;">Discount (${esc(order.promoCode)})</td><td style="text-align:right;color:#059669;">−${order.discount.toFixed(2)} lei</td></tr>`
    : '';

  const deliveryRow = order.deliveryFee > 0
    ? `<tr><td style="padding:4px 0;">Livrare</td><td style="text-align:right;">${order.deliveryFee.toFixed(2)} lei</td></tr>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(28,20,16,.08);">
    <div style="background:#1C1410;padding:44px 40px 36px;text-align:center;">
      ${logoHtml(storeLogo, storeName)}
      <div style="color:#fff;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:400;letter-spacing:5px;text-transform:uppercase;margin-bottom:14px;">${esc(storeName)}</div>
      <div>
        <span style="display:inline-block;width:28px;height:1px;background:#C9821A;opacity:.5;vertical-align:middle;"></span>
        <span style="color:#C9821A;font-size:9px;letter-spacing:.18em;font-family:Arial,sans-serif;vertical-align:middle;padding:0 10px;">CIOCOLATERIE ARTIZANALĂ</span>
        <span style="display:inline-block;width:28px;height:1px;background:#C9821A;opacity:.5;vertical-align:middle;"></span>
      </div>
    </div>
    <div style="padding:40px;">
      <h2 style="font-size:22px;color:#1C1410;margin:0 0 8px;">Bună ${esc(order.customer.name)}! 🍫</h2>
      <p style="color:#6B5E55;margin:0 0 28px;">Comanda ta a fost primită și este în curs de procesare.</p>

      <div style="background:#F5F0EB;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          ${itemsHtml}
        </table>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
          ${deliveryRow}
          ${discountRow}
          <tr>
            <td style="padding:8px 0;font-weight:700;font-size:16px;border-top:2px solid #1C1410;">Total</td>
            <td style="text-align:right;font-weight:700;font-size:16px;border-top:2px solid #1C1410;">${order.total.toFixed(2)} lei</td>
          </tr>
        </table>
      </div>

      <div style="border:1px solid #E0D8CE;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-weight:600;color:#1C1410;">${order.method === 'livrare' ? '🚚 Livrare la adresă' : '🏪 Ridicare din magazin'}</p>
        <p style="margin:0;color:#6B5E55;font-size:14px;">${esc(order.address)}</p>
        ${order.pickupTime ? `<p style="margin:4px 0 0;color:#6B5E55;font-size:14px;">Ora estimată: ${esc(order.pickupTime)}</p>` : ''}
      </div>

      ${storeEmail ? `<p style="color:#A0918A;font-size:13px;margin:0;">Vei primi un email când comanda ta este gata. Dacă ai întrebări, ne găsești la <a href="mailto:${esc(storeEmail)}" style="color:#8B3E2A;">${esc(storeEmail)}</a>.</p>` : ''}
    </div>
    <div style="background:#F5F0EB;padding:20px 40px;text-align:center;">
      <p style="color:#A0918A;font-size:12px;margin:0;">© ${new Date().getFullYear()} ${esc(storeName)}${storeAddress ? ` · ${esc(storeAddress)}` : ''}</p>
    </div>
  </div>
</body>
</html>`;
}

function statusChangedHtml(order, store) {
  const storeName = store.storeName || 'Magazin';
  const storeAddress = store.storeAddress || '';
  const storeEmail = store.storeEmail || '';
  const storeLogo = store.storeLogo || '';
  const statusText = STATUS_TEXT[order.status] || 'Starea comenzii s-a schimbat';
  const emoji = STATUS_EMOJI[order.status] || '📦';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(28,20,16,.08);">
    <div style="background:#1C1410;padding:44px 40px 36px;text-align:center;">
      ${logoHtml(storeLogo, storeName)}
      <div style="color:#fff;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:400;letter-spacing:5px;text-transform:uppercase;margin-bottom:14px;">${esc(storeName)}</div>
      <div>
        <span style="display:inline-block;width:28px;height:1px;background:#C9821A;opacity:.5;vertical-align:middle;"></span>
        <span style="color:#C9821A;font-size:9px;letter-spacing:.18em;font-family:Arial,sans-serif;vertical-align:middle;padding:0 10px;">CIOCOLATERIE ARTIZANALĂ</span>
        <span style="display:inline-block;width:28px;height:1px;background:#C9821A;opacity:.5;vertical-align:middle;"></span>
      </div>
    </div>
    <div style="padding:40px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">${emoji}</div>
      <h2 style="font-size:22px;color:#1C1410;margin:0 0 12px;">${esc(statusText)}</h2>
      <p style="color:#6B5E55;margin:0 0 28px;">Bună ${esc(order.customer.name)}, iată un update despre comanda ta.</p>

      ${order.status === 'gata' && order.method === 'ridicare' && storeAddress ? `
      <div style="background:#D1FAE5;border-radius:12px;padding:16px 24px;margin-bottom:24px;">
        <p style="margin:0;color:#065F46;font-weight:600;">Vino să ridici comanda de la:<br>
        <span style="font-weight:400;">${esc(storeAddress)}</span></p>
      </div>` : ''}

      ${storeEmail ? `<p style="color:#A0918A;font-size:13px;margin:0;">Dacă ai întrebări, scrie-ne la <a href="mailto:${esc(storeEmail)}" style="color:#8B3E2A;">${esc(storeEmail)}</a>.</p>` : ''}
    </div>
    <div style="background:#F5F0EB;padding:20px 40px;text-align:center;">
      <p style="color:#A0918A;font-size:12px;margin:0;">© ${new Date().getFullYear()} ${esc(storeName)}${storeAddress ? ` · ${esc(storeAddress)}` : ''}</p>
    </div>
  </div>
</body>
</html>`;
}

export const sendEmail = async ({ to, subject, html }) => {
  const brevo = getBrevoClient();
  if (!brevo) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📧 [EMAIL-stub] Towards ${to.email}: ${subject}`);
    }
    return { ok: true };
  }
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent: html,
      sender: {
        name: process.env.BREVO_FROM_NAME || 'Ciocolaterie',
        email: process.env.BREVO_FROM_EMAIL || 'noreply@ciocolaterie.ro',
      },
      to: [{ email: to.email, name: to.name }],
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('📧 [EMAIL] Error:', err?.response?.body || err.message);
    }
  }
  return { ok: true };
};

export const sendOrderNotification = async (order, event, store = {}) => {
  const { customer } = order;
  const brevo = getBrevoClient();
  const storeName = store.storeName || process.env.BREVO_FROM_NAME || 'Magazin';

  const isCreated = event === 'created';
  const subject = isCreated
    ? `Comanda ta la ${storeName} a fost primită 🍫`
    : (STATUS_TEXT[order.status] || 'Update comandă');
  const html = isCreated ? orderCreatedHtml(order, { ...store, storeName }) : statusChangedHtml(order, { ...store, storeName });

  if (!brevo) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📧 [EMAIL-stub] Towards ${customer.email}: ${subject}`);
    }
    return { ok: true };
  }

  try {
    await brevo.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent: html,
      sender: {
        name: process.env.BREVO_FROM_NAME || 'Ciocolaterie',
        email: process.env.BREVO_FROM_EMAIL || 'noreply@ciocolaterie.ro',
      },
      to: [{ email: customer.email, name: customer.name }],
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('📧 [EMAIL] Error:', err?.response?.body || err.message);
    }
  }

  return { ok: true };
};

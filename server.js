import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '.env') });

const {
  NOTIFICATIONS_SERVICE_URL,
  NOTIFICATIONS_SERVICE_API_KEY,
  PORT = 3000,
} = process.env;

const CAMPSITE_NAME = 'Camping Brazesti Apuseni';

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/booking-request', async (req, res) => {
  if (!NOTIFICATIONS_SERVICE_URL || !NOTIFICATIONS_SERVICE_API_KEY) {
    return res.status(500).json({
      error: 'Serviciul de notificari nu este configurat (NOTIFICATIONS_SERVICE_URL / NOTIFICATIONS_SERVICE_API_KEY).',
    });
  }
  const { name, email, phone, checkIn, checkOut, numberOfGuests, notes } = req.body ?? {};

  if (!name || !email || !checkIn || !checkOut || !numberOfGuests) {
    return res.status(400).json({
      error: 'Campuri obligatorii lipsa: nume, email, sosire, plecare, numar de oaspeti.',
    });
  }

  // Demo mode: the person testing the form plays both guest and campsite
  // owner, so both notification recipients are the same person.
  const recipient = {
    name,
    email,
    ...(phone ? { phone } : {}),
  };

  const payload = {
    bookingReference: `BK-${Date.now()}`,
    guest: recipient,
    owner: recipient,
    booking: {
      campsiteName: CAMPSITE_NAME,
      checkIn,
      checkOut,
      numberOfGuests: Number(numberOfGuests),
      ...(notes ? { notes } : {}),
    },
  };

  try {
    const upstream = await fetch(
      `${NOTIFICATIONS_SERVICE_URL.replace(/\/$/, '')}/api/notifications/booking-request`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': NOTIFICATIONS_SERVICE_API_KEY,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: 'Serviciul de notificari a refuzat cererea.',
        details: data,
      });
    }

    res.json(data);
  } catch (err) {
    console.error('Failed to reach notifications service:', err);
    res.status(502).json({ error: 'Nu am putut contacta serviciul de notificari.' });
  }
});

app.listen(PORT, () => {
  console.log(`Camping demo running at http://localhost:${PORT}`);
});

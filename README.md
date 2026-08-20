# Camping booking demo

Static campsite page (styled after a typical camping-listing page: green accents, Mulish/Roboto
fonts, pill-style facility tags, raised buttons) with a "SOLICITĂ REZERVARE" button that opens a
booking-request form. Submissions are forwarded server-side to the Rear.ro notifications API,
which emails/texts both the guest and the campsite owner.

Demo mode: the notifications API expects a `guest` and an `owner` recipient. Since this is a demo
for testing the notification flow, both are set to whatever the person fills into the form — you're
testing as your own guest and your own campsite owner.

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

- `NOTIFICATIONS_SERVICE_URL` — base URL of the notifications service (`https://booking-api.rear.ro`).
- `NOTIFICATIONS_SERVICE_API_KEY` — API key sent as the `X-API-Key` header.

## Run

```bash
npm start
```

Open http://localhost:3000, click **Solicită rezervare**, fill in the form, and submit. The browser
posts to `POST /api/booking-request` on this server, which builds a `BookingNotificationRequest` and
calls `POST {NOTIFICATIONS_SERVICE_URL}/api/notifications/booking-request` (schema:
https://booking-api.rear.ro/swagger-ui/index.html#/notification-controller/notifyBookingRequest).
The API key never reaches the browser.

Note: the notifications service is hosted on Render's free tier and may take 30–60s to wake up on
the first request after being idle.

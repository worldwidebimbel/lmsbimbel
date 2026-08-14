import { db } from "@/lib/db";
import { createInvoice, getCallbackUrl, isDuitkuConfigured, getCallbackBaseUrl } from "@/lib/payment-gateway";

export async function createEventPayment(
  registrationId: string,
  eventId: string,
  _userId: string
): Promise<string | null> {
  const registration = await db.eventRegistration.findUnique({
    where: { id: registrationId },
    include: { event: true, user: { select: { name: true, email: true, profile: { select: { phone: true } } } } },
  });
  if (!registration) return null;
  if (!registration.event.isPaid || registration.price === 0) return null;
  if (registration.paymentStatus === "PAID") return null;

  const baseUrl = getCallbackBaseUrl();
  const orderId = `EVT-${registration.id}-${Date.now()}`;

  // Try Duitku first
  const duitkuReady = await isDuitkuConfigured();
  if (duitkuReady) {
    try {
      const result = await createInvoice({
        paymentAmount: Math.round(registration.price),
        merchantOrderId: orderId,
        productDetails: `Pembayaran ${registration.event.title}`,
        customerVaName: registration.user.name,
        email: registration.user.email,
        phoneNumber: registration.user.profile?.phone || undefined,
        itemDetails: [
          {
            name: registration.event.title,
            price: Math.round(registration.price),
            quantity: 1,
          },
        ],
        customerDetail: {
          firstName: registration.user.name,
          email: registration.user.email,
          phoneNumber: registration.user.profile?.phone || undefined,
        },
        returnUrl: `${baseUrl}/events/${eventId}?payment=done`,
        callbackUrl: getCallbackUrl(),
        expiryPeriod: 1440,
      });

      await db.eventRegistration.update({
        where: { id: registration.id },
        data: { paymentMethod: "DUITKU", externalId: orderId },
      });

      return result.paymentUrl;
    } catch (err: unknown) {
      console.error("[event-payment] Duitku error:", err instanceof Error ? err.message : String(err));
    }
  }

  // Fallback to Midtrans if configured
  const midtransKey = process.env.MIDTRANS_SERVER_KEY;
  if (midtransKey) {
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    try {
      const snap = await import("midtrans-client").then((m) => m.default);
      const s = new snap.Snap({
        isProduction,
        serverKey: midtransKey,
        clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
      });

      const parameter = {
        transaction_details: { order_id: orderId, gross_amount: registration.price },
        customer_details: { first_name: registration.user.name, email: registration.user.email },
        callbacks: { finish: `${baseUrl}/events/${eventId}`, error: `${baseUrl}/events/${eventId}` },
      };

      const token = await s.createTransactionToken(parameter);
      await db.eventRegistration.update({
        where: { id: registration.id },
        data: { paymentMethod: "MIDTRANS", paymentToken: token, externalId: orderId },
      });

      return (
        isProduction
          ? "https://app.midtrans.com/snap/v2/vtweb/"
          : "https://app.sandbox.midtrans.com/snap/v2/vtweb/"
      ) + token;
    } catch (err: unknown) {
      console.error("[event-payment] Midtrans error:", err instanceof Error ? err.message : String(err));
    }
  }

  // Fallback to Xendit
  const xenditKey = process.env.XENDIT_API_KEY;
  if (xenditKey) {
    try {
      const res = await fetch("https://api.xendit.co/v2/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + Buffer.from(xenditKey + ":").toString("base64"),
        },
        body: JSON.stringify({
          external_id: orderId,
          amount: registration.price,
          payer_email: registration.user.email,
          description: `Pembayaran ${registration.event.title}`,
          success_redirect_url: `${baseUrl}/events/${eventId}`,
          failure_redirect_url: `${baseUrl}/events/${eventId}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await db.eventRegistration.update({
          where: { id: registration.id },
          data: { paymentMethod: "XENDIT", externalId: orderId },
        });
        return data.invoice_url as string;
      }
    } catch (err: unknown) {
      console.error("[event-payment] Xendit error:", err instanceof Error ? err.message : String(err));
    }
  }

  return null;
}

import { db } from "@/lib/db";

export async function createEventPayment(
  registrationId: string,
  eventId: string,
  _userId: string
): Promise<string | null> {
  const registration = await db.eventRegistration.findUnique({
    where: { id: registrationId },
    include: { event: true, user: { select: { name: true, email: true } } },
  });
  if (!registration) return null;
  if (!registration.event.isPaid || registration.price === 0) return null;
  if (registration.paymentStatus === "PAID") return null;

  const baseUrl = (process.env.NEXTAUTH_URL ?? "https://lmsbimbel.digsan.id").replace(/\/$/, "");
  const orderId = `EVT-${registration.id}-${Date.now()}`;
  const provider = process.env.DEFAULT_PAYMENT_GATEWAY === "XENDIT" ? "XENDIT" : "MIDTRANS";

  if (provider === "MIDTRANS") {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    if (!serverKey) return null;

    const snap = await import("midtrans-client").then((m) => m.default);
    const s = new snap.Snap({
      isProduction,
      serverKey,
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
  }

  const apiKey = process.env.XENDIT_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(apiKey + ":").toString("base64"),
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

  if (!res.ok) return null;
  const data = await res.json();
  await db.eventRegistration.update({
    where: { id: registration.id },
    data: { paymentMethod: "XENDIT", externalId: orderId },
  });

  return data.invoice_url as string;
}

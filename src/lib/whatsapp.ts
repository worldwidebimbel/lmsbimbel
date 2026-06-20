export interface WhatsAppPayload {
  to: string;
  message: string;
}

export async function sendWhatsApp({ to, message }: WhatsAppPayload): Promise<{ ok: boolean; detail?: string }> {
  const provider = process.env.WA_PROVIDER?.toLowerCase();
  if (!provider || provider === "none") {
    return { ok: true, detail: "WhatsApp gateway tidak diaktifkan" };
  }

  const normalizedPhone = to.startsWith("0") ? `62${to.slice(1)}` : to;

  try {
    if (provider === "wablas") {
      const token = process.env.WA_WABLAS_TOKEN;
      const server = process.env.WA_WABLAS_SERVER;
      if (!token || !server) throw new Error("WABLAS token/server belum diatur");
      await fetch(`${server}/api/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({ phone: normalizedPhone, message }),
      });
      return { ok: true };
    }

    if (provider === "fonnte") {
      const token = process.env.WA_FONNTE_TOKEN;
      if (!token) throw new Error("Fonnte token belum diatur");
      await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: { Authorization: token, "Content-Type": "application/json" },
        body: JSON.stringify({ target: normalizedPhone, message }),
      });
      return { ok: true };
    }

    if (provider === "twilio") {
      const sid = process.env.WA_TWILIO_SID;
      const authToken = process.env.WA_TWILIO_AUTH_TOKEN;
      const from = process.env.WA_TWILIO_FROM;
      if (!sid || !authToken || !from) throw new Error("Twilio credentials belum diatur");
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: { Authorization: `Basic ${Buffer.from(`${sid}:${authToken}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ From: from, To: `whatsapp:${normalizedPhone}`, Body: message }),
      });
      return { ok: true };
    }

    return { ok: false, detail: `Provider ${provider} tidak didukung` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "Unknown error" };
  }
}

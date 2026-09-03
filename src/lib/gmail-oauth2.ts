/**
 * GmailOAuth2 — TypeScript Gmail API mailer
 * Source: https://github.com/digsanid-26/google-oauth2-smtp/blob/main/typescript/gmail-oauth2.ts
 *
 * Token exchange uses node:https (bypasses Next.js fetch patching).
 * Gmail API send uses native fetch.
 */
import { request as httpsRequest } from "node:https";

export interface GmailTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export interface SendOptions {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string;
  bcc?: string;
}

export interface GmailSendResult {
  id: string;
  threadId: string;
  labelIds: string[];
}

export class GmailOAuth2 {
  private static readonly AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth";
  private static readonly TOKEN_URL = "https://oauth2.googleapis.com/token";
  private static readonly SEND_URL  = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
  private static readonly SCOPE     = "https://mail.google.com/";

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly redirectUri: string,
  ) {}

  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id:     this.clientId,
      redirect_uri:  this.redirectUri,
      response_type: "code",
      scope:         GmailOAuth2.SCOPE,
      access_type:   "offline",
      prompt:        "consent",
      ...(state ? { state } : {}),
    });
    return `${GmailOAuth2.AUTH_URL}?${params}`;
  }

  async exchangeCode(code: string): Promise<GmailTokens> {
    return this.postForm(GmailOAuth2.TOKEN_URL, {
      code,
      client_id:     this.clientId,
      client_secret: this.clientSecret,
      redirect_uri:  this.redirectUri,
      grant_type:    "authorization_code",
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<GmailTokens> {
    return this.postForm(GmailOAuth2.TOKEN_URL, {
      refresh_token: refreshToken,
      client_id:     this.clientId,
      client_secret: this.clientSecret,
      grant_type:    "refresh_token",
    });
  }

  async send(accessToken: string, options: SendOptions): Promise<GmailSendResult> {
    const raw = this.buildMimeMessage(options);
    const response = await fetch(GmailOAuth2.SEND_URL, {
      method:  "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });
    const data = await response.json() as GmailSendResult & { error?: unknown };
    if (data.error) {
      console.error("[GmailOAuth2] send failed:", response.status, data.error);
      throw new Error(`Gmail API error: ${JSON.stringify(data.error)}`);
    }
    return data;
  }

  async refreshAndSend(refreshToken: string, options: SendOptions): Promise<GmailSendResult> {
    const tokens = await this.refreshAccessToken(refreshToken);
    if (!tokens.access_token) {
      console.error("[GmailOAuth2] refreshAccessToken did not return access_token:", tokens);
      throw new Error("OAuth2 refresh failed: no access_token returned");
    }
    return this.send(tokens.access_token, options);
  }

  async getConnectedEmail(accessToken: string): Promise<string | null> {
    try {
      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json() as { emailAddress?: string; error?: unknown };
      if (data.error) return null;
      return data.emailAddress ?? null;
    } catch {
      return null;
    }
  }

  private buildMimeMessage({ from, to, subject, text = "", html = "", cc = "", bcc = "" }: SendOptions): string {
    const boundary = `boundary_${Date.now()}`;
    const lines: string[] = [
      `From: ${from}`,
      `To: ${to}`,
      ...(cc  ? [`Cc: ${cc}`]  : []),
      ...(bcc ? [`Bcc: ${bcc}`] : []),
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
    ];

    let body: string;
    if (html && text) {
      lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
      body = [
        "",
        `--${boundary}`,
        "Content-Type: text/plain; charset=UTF-8",
        "",
        text,
        "",
        `--${boundary}`,
        "Content-Type: text/html; charset=UTF-8",
        "",
        html,
        "",
        `--${boundary}--`,
      ].join("\r\n");
    } else if (html) {
      lines.push("Content-Type: text/html; charset=UTF-8");
      body = "\r\n" + html;
    } else {
      lines.push("Content-Type: text/plain; charset=UTF-8");
      body = "\r\n" + text;
    }

    const raw = lines.join("\r\n") + "\r\n" + body;
    return btoa(unescape(encodeURIComponent(raw)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  private postForm(url: string, data: Record<string, string>): Promise<GmailTokens> {
    return new Promise((resolve, reject) => {
      const body = new URLSearchParams(data).toString();
      const { hostname, pathname, search } = new URL(url);
      const req = httpsRequest(
        {
          hostname,
          path: pathname + search,
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(body),
          },
        },
        (res) => {
          const status = res.statusCode ?? 0;
          let raw = "";
          res.on("data", (chunk: Buffer) => { raw += chunk.toString(); });
          res.on("end", () => {
            try {
              const json = JSON.parse(raw) as GmailTokens & { error?: string; error_description?: string };
              if (json.error) {
                console.error(`[GmailOAuth2] token request error (HTTP ${status}):`, json.error, json.error_description, "| raw:", raw.slice(0, 300));
                const detail = json.error_description || json.error;
                reject(new Error(`OAuth error (HTTP ${status}, ${json.error}): ${detail}`));
              } else {
                resolve(json);
              }
            } catch {
              console.error(`[GmailOAuth2] token request invalid JSON (HTTP ${status}):`, raw.slice(0, 300));
              reject(new Error(`Invalid JSON from Google (HTTP ${status}): ${raw.slice(0, 300)}`));
            }
          });
        }
      );
      req.setTimeout(15_000, () => {
        req.destroy(new Error(`Timeout 15 detik: server tidak dapat menjangkau ${hostname}:443. Cek firewall/outbound HTTPS server.`));
      });
      req.on("error", (err) => reject(err));
      req.write(body);
      req.end();
    });
  }
}

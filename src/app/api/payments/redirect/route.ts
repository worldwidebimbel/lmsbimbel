import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const merchantOrderId = searchParams.get("merchantOrderId");
  const resultCode = searchParams.get("resultCode");
  const reference = searchParams.get("reference");

  const success = resultCode === "00";

  if (!merchantOrderId) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  const prefix = merchantOrderId.split("-")[0];

  let redirectUrl: string;
  if (prefix === "INV") {
    const parts = merchantOrderId.split("-");
    const invoiceId = parts.slice(1, -1).join("-");
    redirectUrl = `/siswa/tagihan?payment=${success ? "success" : "failed"}&id=${invoiceId}`;
  } else if (prefix === "EVT") {
    const parts = merchantOrderId.split("-");
    const registrationId = parts.slice(1, -1).join("-");
    redirectUrl = `/events?payment=${success ? "success" : "failed"}&ref=${registrationId}`;
  } else if (prefix === "PPDB") {
    const parts = merchantOrderId.split("-");
    const registrationId = parts.slice(1, -1).join("-");
    redirectUrl = `/ppdb/status?id=${registrationId}&payment=${success ? "success" : "failed"}`;
  } else {
    redirectUrl = "/admin";
  }

  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || new URL(req.url).origin;
  return NextResponse.redirect(new URL(redirectUrl, baseUrl));
}

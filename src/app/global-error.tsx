"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backgroundColor: "#f9fafb",
          }}
        >
          <div
            style={{
              maxWidth: "400px",
              textAlign: "center",
              padding: "32px",
              borderRadius: "16px",
              border: "1px solid #e5e7eb",
              backgroundColor: "#fff",
            }}
          >
            <h1 style={{ margin: "0 0 8px", fontSize: "18px", color: "#111827" }}>
              Terjadi Kesalahan Sistem
            </h1>
            <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#6b7280" }}>
              Maaf, aplikasi mengalami gangguan. Silakan coba muat ulang halaman.
            </p>
            <button
              onClick={reset}
              style={{
                minHeight: "44px",
                padding: "0 20px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#4f46e5",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

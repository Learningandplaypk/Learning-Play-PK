/**
 * Certificates — jsPDF generated in the browser, verifiable at /verify/[code].
 *
 * The code is deterministic (uid + language + level) so a re-download produces
 * the same code, and it is recorded server-side in `certificates/{code}` so the
 * public verification page can confirm it is genuine.
 */

export type CertificateInput = {
  name: string;
  language: string;
  level: number;
  /** ISO date "YYYY-MM-DD" */
  date: string;
  uid: string;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1

/** Small deterministic hash → 10-char code, formatted LPK-XXXX-XXXX. */
export function verificationCode(input: Pick<CertificateInput, "uid" | "language" | "level">): string {
  const seed = `${input.uid}|${input.language}|${input.level}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < seed.length; i++) {
    h1 = Math.imul(h1 ^ seed.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 + seed.charCodeAt(i) * (i + 7), 2246822519) >>> 0;
  }
  let out = "";
  let x = h1;
  let y = h2;
  for (let i = 0; i < 8; i++) {
    if (i === 4) {
      x = y;
    }
    out += ALPHABET[x % ALPHABET.length];
    x = Math.floor(x / ALPHABET.length) || Math.imul(x ^ (i + 1), 2654435761) >>> 0;
  }
  return `LPK-${out.slice(0, 4)}-${out.slice(4, 8)}`;
}

export function isValidCodeFormat(code: string): boolean {
  return /^LPK-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(code.toUpperCase());
}

/** Minimum level at which a certificate is meaningful. */
export const CERTIFICATE_MIN_LEVEL = 5;

export function canIssueCertificate(level: number, premium: boolean): { ok: boolean; reason?: string } {
  if (!premium) return { ok: false, reason: "Certificate premium feature hai." };
  if (level < CERTIFICATE_MIN_LEVEL)
    return { ok: false, reason: `Level ${CERTIFICATE_MIN_LEVEL} par certificate khul jata hai. Abhi level ${level}.` };
  return { ok: true };
}

export function certificateFileName(i: CertificateInput): string {
  return `learnplaypk-${i.language.toLowerCase()}-level-${i.level}.pdf`;
}

/**
 * Build the PDF. Dynamic import keeps jsPDF (~350 KB) out of the main bundle.
 * Returns the verification code that was stamped on the document.
 */
export async function generateCertificatePdf(input: CertificateInput, siteUrl = "https://learnplaypk.com"): Promise<string> {
  const { jsPDF } = await import("jspdf");
  const code = verificationCode(input);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297;
  const H = 210;

  // colours mirrored from the design tokens
  const brand = [21, 128, 79] as const;
  const ink = [26, 26, 24] as const;
  const muted = [110, 110, 102] as const;
  const accent = [245, 165, 36] as const;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, "F");

  doc.setDrawColor(...brand);
  doc.setLineWidth(2);
  doc.rect(10, 10, W - 20, H - 20);
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.6);
  doc.rect(14, 14, W - 28, H - 28);

  doc.setTextColor(...brand);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("LEARN & PLAY PK", W / 2, 34, { align: "center" });

  doc.setTextColor(...muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Certificate of Achievement", W / 2, 43, { align: "center" });

  doc.setTextColor(...ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.text(input.name || "Learner", W / 2, 74, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...muted);
  doc.text("has completed", W / 2, 88, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...brand);
  doc.text(`${input.language} — Level ${input.level}`, W / 2, 104, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...muted);
  doc.text(
    "Awarded for consistent practice on Learn & Play PK — Pakistan's free learning + games platform.",
    W / 2,
    118,
    { align: "center", maxWidth: W - 80 }
  );

  doc.setDrawColor(220, 220, 214);
  doc.setLineWidth(0.4);
  doc.line(38, 158, 108, 158);
  doc.line(W - 108, 158, W - 38, 158);

  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("Date", 73, 164, { align: "center" });
  doc.text("Verification code", W - 73, 164, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ink);
  doc.text(input.date, 73, 153, { align: "center" });
  doc.text(code, W - 73, 153, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...muted);
  doc.text(`Verify at ${siteUrl}/verify/${code}`, W / 2, 182, { align: "center" });

  doc.save(certificateFileName(input));
  return code;
}

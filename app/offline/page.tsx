import Link from "next/link";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="page-pad flex min-h-[100dvh] flex-col items-center justify-center pb-24 text-center">
      <div className="text-7xl animate-float">📡</div>
      <h1 className="mt-6 font-display text-3xl font-black">
        <span className="text-gradient">Offline ho tum!</span>
      </h1>
      <p className="mt-3 max-w-sm text-muted">
        Internet nahi chal raha. Pehlay khelay huay games phir bhi available hain — jaise hi net aayega, progress sync ho jayegi.
      </p>
      <Link href="/" className="btn btn-neon mt-8">
        🏠 Home
      </Link>
    </div>
  );
}

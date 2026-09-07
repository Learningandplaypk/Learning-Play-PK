import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Ustad } from "@/components/brand/ustad";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="page-pad container-page flex min-h-[100dvh] max-w-md flex-col justify-center pb-24 pt-8">
      <div className="card p-6 text-left sm:p-8">
        <div className="flex items-center gap-4">
          <Ustad mood="think" className="h-20 w-20 shrink-0" />
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-muted">
            <WifiOff size={22} strokeWidth={2.2} />
          </span>
        </div>
        <h1 className="mt-4 font-display text-2xl font-black text-fg">Offline ho tum</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Internet nahi chal raha. Pehlay khelay huay games phir bhi available hain — jaise hi net aayega, progress sync
          ho jayegi.
        </p>
        <Link href="/" className="btn btn-primary mt-6">
          Home wapas jao
        </Link>
      </div>
    </div>
  );
}

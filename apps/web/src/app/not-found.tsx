import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-azable-mid-dark p-10 text-center shadow-[0_0_50px_rgba(130,86,255,0.15)]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-azable-purple-2/20 via-transparent to-white/5" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-center">
            <Image
              src="/azable_logo.svg"
              alt="Azable"
              width={140}
              height={32}
              priority
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-azable-light-grey">
              404 Error
            </p>
            <h1 className="text-3xl font-semibold text-white">
              We couldn&apos;t find that page
            </h1>
            <p className="text-azable-light-grey">
              The link may be outdated or the page might have moved. You can head back to the dashboard to keep building.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button asChild variant="gradient" size="lg">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

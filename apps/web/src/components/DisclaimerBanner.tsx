import { AlertTriangle } from "lucide-react";

interface DisclaimerBannerProps {
  title?: string;
  message?: string;
}

export function DisclaimerBanner({
  title = "Catatan Batasan & Transparansi",
  message = "Segmentasi lahan bersifat eksploratif (silhouette 0,2233) dan seluruh rekomendasi merupakan panduan awal, bukan keputusan agronomi mutlak. Konsultasikan dengan PPL kalurahan sebelum perubahan besar.",
}: DisclaimerBannerProps) {
  return (
    <div
      role="note"
      className="rounded-2xl border border-amber-300 bg-[#FEF3C7] p-4 text-[#92400E]"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#B45309]" />
        <div className="text-sm leading-relaxed">
          <p className="font-bold">{title}</p>
          <p className="mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}

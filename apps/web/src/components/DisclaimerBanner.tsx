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
      className="rounded-[4px] border border-dashed border-[#8D6E63] bg-[#F2EADA] p-4 text-[#303030]"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#B45309]" />
        <div className="text-sm leading-relaxed">
          <p className="font-semibold tracking-wide uppercase text-[11px] text-[#8D6E63]">
            {title}
          </p>
          <p className="mt-1 text-[#303030]">{message}</p>
        </div>
      </div>
    </div>
  );
}

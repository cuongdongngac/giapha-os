import Link from "next/link";
import Introduction from "@/components/Introduction";
import DongNgac from "@/components/dongngac";
import AudioPlayer from "@/components/AudioPlayer";
import MiniVideoPlayer from "@/components/MiniVideoPlayer";
export default function Page() {
  return (
    <div>
      <Link href="/dashboard">← Quay lại Dashboard</Link>
      <div className="fixed left-4 bottom-6 z-50">
        <AudioPlayer
          title="Giới thiệu làng Kẻ Vẽ"
          src="https://mediaserver.huph.edu.vn/vod/nas1videos/phahe/gioithieudongngac.mp3"
        />
      </div>

     
      <Introduction />

    </div>
  );
}

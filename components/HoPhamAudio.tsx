
'use client'
import { useRef, useState } from "react"

type AudioPlayerProps = {
  src: string
  title?: string
}

export default function HoPhamAudio({ src, title = "Nghe giới thiệu Họ Phạm" }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }

    setPlaying(!playing)
  }

  return (
    <>
      <div className="mini-audio-hopham" onClick={togglePlay}>
        <span className="icon">
          {playing ? "⏸" : "▶"}
        </span>

        <span className="label">{title}</span>
      </div>

      <audio ref={audioRef} src={src} preload="none" />

      <style jsx>{`
        .mini-audio-hopham {
          display: flex;
          align-items: center;
          gap: 8px;

          width: fit-content;
          margin: 32px auto;

          background: rgba(37, 99, 235, 0.9);
          color: white;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 14px;
          cursor: pointer;

          backdrop-filter: blur(6px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.2);
          transition: all 0.2s ease;
        }

        .mini-audio-hopham:hover {
          transform: translateY(-1px);
          background: rgba(29, 78, 216, 0.95);
        }

        .icon {
          font-size: 16px;
        }

        .label {
          white-space: nowrap;
        }

        @media (max-width: 640px) {
          .label {
            display: none;
          }
        }
      `}</style>
    </>
  )
}


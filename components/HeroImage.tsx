import Image from "next/image";

interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function HeroImage({
  src,
  alt,
  className = "",
}: HeroImageProps) {
  return (
    <div className={`flex justify-center my-4 ${className}`}>
      <div className="relative max-w-2xl w-full">
        <div className="rounded-xl overflow-hidden shadow-lg border border-stone-200/50">
          <Image
            src={src}
            alt={alt}
            width={800}
            height={250}
            className="w-full h-auto object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";

import { isAllowedImageUrl } from "@/lib/utils/image-host";

const SEGMENT_SECONDS = 5;
const FADE_SECONDS = 1.2;

/**
 * Fundo do hero da home: faz um crossfade (só CSS, sem JS) entre fotos
 * reais de produtos cadastrados, sempre com manchas decorativas lilás por
 * baixo — assim a seção nunca fica "vazia" mesmo sem nenhum produto com
 * foto ainda, e vai ficando mais bonita conforme o catálogo cresce.
 */
export function HeroBackground({ images }: { images: string[] }) {
  const photos = images.filter(isAllowedImageUrl).slice(0, 6);
  const totalDuration = Math.max(photos.length, 1) * SEGMENT_SECONDS;
  const fadePercent = (FADE_SECONDS / totalDuration) * 100;
  const segmentPercent = 100 / Math.max(photos.length, 1);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Manchas decorativas — sempre visíveis, garantem um fundo bonito mesmo sem fotos */}
      <div className="absolute -left-24 -top-24 size-96 rounded-full bg-lilac-300/40 blur-3xl" />
      <div className="absolute -right-16 top-10 size-80 rounded-full bg-lilac-400/30 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 size-72 rounded-full bg-lilac-200/50 blur-3xl" />

      {photos.length > 0 && (
        <>
          <style>{`
            @keyframes hero-crossfade {
              0% { opacity: 0; }
              ${fadePercent.toFixed(2)}% { opacity: 1; }
              ${(segmentPercent - fadePercent).toFixed(2)}% { opacity: 1; }
              ${segmentPercent.toFixed(2)}% { opacity: 0; }
              100% { opacity: 0; }
            }
          `}</style>
          {photos.map((src, index) => (
            <div
              key={src}
              className="absolute inset-0 opacity-0"
              style={{
                animation: `hero-crossfade ${totalDuration}s ease-in-out infinite`,
                animationDelay: `${index * SEGMENT_SECONDS}s`,
              }}
            >
              <Image
                src={src}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
        </>
      )}

      {/* Véu claro por cima das fotos para o texto continuar legível */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/90" />
    </div>
  );
}

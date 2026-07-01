import React, {useState} from 'react';

interface EvidenceImage {
  src: string;
  alt: string;
}

interface Props {
  images: EvidenceImage[];
}

/* Carrossel estático (sem autoplay) para evidências de RF/RNF: mostra uma
   screenshot por vez em vez de empilhar todas verticalmente, evitando scroll
   quando um requisito tem mais de uma evidência. Navegação finita — as setas
   desabilitam nas pontas em vez de dar a volta. */
function ChevronLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export default function EvidenceCarousel({images}: Props): React.ReactElement | null {
  const [index, setIndex] = useState(0);

  if (!images || images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="crianex-evidence-carousel crianex-evidence-carousel--single">
        <img src={images[0].src} alt={images[0].alt} />
      </div>
    );
  }

  const isFirst = index === 0;
  const isLast = index === images.length - 1;

  return (
    <div className="crianex-evidence-carousel">
      <div className="crianex-evidence-carousel__viewport">
        <img src={images[index].src} alt={images[index].alt} />

        <button
          type="button"
          className="crianex-evidence-carousel__arrow crianex-evidence-carousel__arrow--prev"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={isFirst}
          aria-label="Ver screenshot anterior"
          title="Ver screenshot anterior"
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          className="crianex-evidence-carousel__arrow crianex-evidence-carousel__arrow--next"
          onClick={() => setIndex((i) => Math.min(images.length - 1, i + 1))}
          disabled={isLast}
          aria-label="Ver próxima screenshot"
          title="Ver próxima screenshot"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className="crianex-evidence-carousel__dots" role="tablist" aria-label="Screenshots desta evidência">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Ver screenshot ${i + 1} de ${images.length}`}
            className={`crianex-evidence-carousel__dot ${i === index ? 'is-active' : ''}`}
            onClick={() => setIndex(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

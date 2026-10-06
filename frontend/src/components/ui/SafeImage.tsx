import React, { useState } from 'react';

interface SafeImageProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'onError'
> {
  src: string;
  fallbackSrc?: string;
  alt: string;
  onFinalError?: () => void;
}

export function SafeImage({
  src,
  fallbackSrc,
  alt,
  onFinalError,
  srcSet,
  sizes,
  ...imgProps
}: SafeImageProps): React.ReactElement | null {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  // Reacciona al cambio de `src` durante el render (patrón oficial de React
  // para "ajustar estado cuando cambia una prop", sin cascada de efectos).
  if (prevSrc !== src) {
    setPrevSrc(src);
    setCurrentSrc(src);
    setFailed(false);
  }

  const usingFallback = fallbackSrc !== undefined && currentSrc === fallbackSrc;

  const handleError = (): void => {
    if (fallbackSrc !== undefined && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    setFailed(true);
    onFinalError?.();
  };

  if (failed) {
    return null;
  }

  return (
    <img
      {...imgProps}
      {...(usingFallback ? {} : { srcSet, sizes })}
      src={currentSrc}
      alt={alt}
      onError={handleError}
    />
  );
}

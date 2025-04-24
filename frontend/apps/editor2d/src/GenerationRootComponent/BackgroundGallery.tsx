import { useEffect, useState } from "react";
// import { Marquee } from "@devnomic/marquee";
import "@devnomic/marquee/dist/index.css";

function getRandomImages(count: number) {
  const images = Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    src: `/images/generate/image${i + 1}.png`,
    alt: `Generated image ${i + 1}`,
  }));

  // Shuffle the array
  return [...images].sort(() => Math.random() - 0.5);
}

interface ImageColumnProps {
  images: Array<{ id: number; src: string; alt: string }>;
  delay: number;
  reverse?: boolean;
  isLoaded: boolean;
  duration?: number;
}

function ImageColumn(
  {
    // images,
    // delay,
    // reverse = false,
    // duration = 100,
    // isLoaded,
  }: ImageColumnProps,
) {
  return (
    <div className="flex h-screen flex-col gap-6">
      {/* <Marquee
        fade={false}
        direction="up"
        reverse={reverse}
        pauseOnHover={false}
        className={`h-full gap-[24px]`}
        style={{ "--duration": `${duration}s` } as React.CSSProperties}
        innerClassName="gap-[24px] [--gap:24px]"
        numberOfCopies={2}
      >
        {images.map((image, i) => (
          <div
            key={`${image.id}-${i}`}
            className={`relative aspect-[4/5] w-full overflow-hidden rounded-lg shadow-lg transition-all duration-700 ease-out ${
              isLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-12 opacity-0"
            }`}
            style={{
              transitionDelay: `${delay + i * 50}ms`,
            }}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full object-cover"
            />
          </div>
        ))}
      </Marquee> */}
    </div>
  );
}

export default function GalleryBackground() {
  const [images, _setImages] = useState(() => getRandomImages(20));
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // delay for smooth animation
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Columns for masonry layout
  const columns = {
    col1: images.filter((_, i) => i % 5 === 0),
    col2: images.filter((_, i) => i % 5 === 1),
    col3: images.filter((_, i) => i % 5 === 2),
    col4: images.filter((_, i) => i % 5 === 3),
    col5: images.filter((_, i) => i % 5 === 4),
  };

  return (
    <>
      <div className="fixed inset-0 z-[1] overflow-hidden bg-[radial-gradient(50%_50%_at_50%_50%,rgba(0,0,0,0.00)_49%,rgba(0,0,0,0.60)_100%)]" />
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div
          className={`h-full w-full transition-opacity duration-1000 ${isLoaded ? "opacity-50" : "opacity-0"}`}
        >
          <div className="absolute inset-0 grid grid-cols-5 gap-6 px-6 opacity-35">
            <ImageColumn
              images={columns.col1}
              delay={0}
              isLoaded={isLoaded}
              duration={100}
            />
            <ImageColumn
              images={columns.col2}
              delay={columns.col1.length * 50}
              isLoaded={isLoaded}
              reverse={true}
              duration={100}
            />
            <ImageColumn
              images={columns.col3}
              delay={(columns.col1.length + columns.col2.length) * 50}
              isLoaded={isLoaded}
              duration={125}
            />
            <ImageColumn
              images={columns.col4}
              delay={
                (columns.col1.length +
                  columns.col2.length +
                  columns.col3.length) *
                50
              }
              isLoaded={isLoaded}
              reverse={true}
              duration={160}
            />
            <ImageColumn
              images={columns.col5}
              delay={
                (columns.col1.length +
                  columns.col2.length +
                  columns.col3.length +
                  columns.col4.length) *
                50
              }
              isLoaded={isLoaded}
              duration={110}
            />
          </div>
        </div>
      </div>
    </>
  );
}

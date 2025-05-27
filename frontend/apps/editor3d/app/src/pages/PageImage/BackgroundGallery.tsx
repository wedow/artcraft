import { useState } from "react";
import "./Background.css";

function getStaticImages(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    src: `resources/images/generate/image${i + 1}.png`,
    alt: `Generated image ${i + 1}`,
  }));
}

export default function GalleryBackground() {
  const [frozen] = useState(false); // change this to true to make it static if it impacts pc performance - BFlat
  const [images] = useState(() => {
    const imgs = getStaticImages(20);
    for (let i = imgs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    }
    return imgs;
  });
  // Distribute images into 5 columns
  const columns = [[], [], [], [], []] as Array<typeof images>;
  images.forEach((img, i) => {
    columns[i % 5].push(img);
  });

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden bg-[radial-gradient(50%_50%_at_50%_50%,rgba(0,0,0,0.00)_49%,rgba(0,0,0,0.60)_100%)]" />
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="h-full w-full">
          <div className="pointer-events-none absolute inset-0 grid grid-cols-5 gap-6 px-6 opacity-15">
            {columns.map((col, colIdx) => {
              // Vertical offset classes for each column
              const offsetClasses = [
                "-mt-20", // col 0
                "mt-5", // col 1
                "-mt-48", // col 2
                "mt-3", // col 3
                "-mt-16", // col 4
              ];
              // Alternate marquee direction
              const marqueeClass =
                colIdx % 2 === 0 ? "column-marquee-up" : "column-marquee-down";
              return (
                <div
                  key={colIdx}
                  className={`flex flex-col gap-6 ${offsetClasses[colIdx]} ${!frozen ? marqueeClass : ""}`}
                >
                  {col.map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-[4/5] w-full overflow-hidden rounded-lg shadow-lg"
                    >
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="image-fade-in h-full w-full object-cover"
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

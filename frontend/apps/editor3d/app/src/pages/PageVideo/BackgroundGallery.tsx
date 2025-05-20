import "./Background.css";

export default function GalleryBackground() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden bg-[radial-gradient(50%_50%_at_50%_50%,rgba(0,0,0,0.00)_49%,rgba(0,0,0,0.60)_100%)]" />
      <div className="fixed inset-0 z-0 overflow-hidden  tile-background-animation">
        <div
          className={`h-full w-full transition-opacity duration-1000 opacity-30`}
        >
          <div className="absolute inset-0 grid grid-cols-5 gap-6 px-6 opacity-35">
          </div>
        </div>
      </div>
    </>
  );
}

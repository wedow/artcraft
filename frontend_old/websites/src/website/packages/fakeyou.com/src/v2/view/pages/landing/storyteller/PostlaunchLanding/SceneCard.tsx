import React from "react";

interface SceneCardProps {
  image: string;
  alt: string;
  title?: string;
  token?: string;
  small?: boolean;
  allowHover?: boolean;
}

export default function SceneCard({
  image,
  alt,
  title,
  token,
  small,
}: SceneCardProps) {
  return (
    <div
      className="position-relative overflow-hidden rounded"
      style={{
        width: "max-content",
        marginRight: small ? "24px" : "32px",
        aspectRatio: "16 / 9",
      }}
    >
      {/* <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="position-absolute w-100 h-100 p-2"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="d-flex justify-content-end w-100">
              <Button
                label="View"
                variant="action"
                small={true}
                icon={faArrowRight}
                iconFlip={true}
                to={`/media/${token}`}
              />
            </div>
            <motion.p
              className="position-absolute bottom-0 left-0 ps-2 pb-2 fw-medium"
              style={{
                textShadow: "2px 2px 10px rgba(0, 0, 0, 0.7)",
                maxWidth: "240px",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              exit={{ y: 10 }}
              transition={{ duration: 0.2 }}
            >
              {title}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence> */}
      <img
        src={image}
        alt={alt}
        width={small ? 180 : 340}
        className="object-fit-cover w-100 h-100"
      />
    </div>
  );
}

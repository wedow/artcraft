import { Panel } from "components/common";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import { Swiper as SwiperType } from "swiper/types";
import "./SdBatchMediaPanel.scss";

interface ImageWithToken {
  url: string;
  token: string;
}

interface SdBatchMediaPanelProps {
  images: ImageWithToken[];
  onActiveSlideChange: (image: ImageWithToken) => void;
}

export default function SdBatchMediaPanel({
  images,
  onActiveSlideChange,
}: SdBatchMediaPanelProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);
  const [initialSlide, setInitialSlide] = useState(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const currentToken = currentUrl.pathname.split("/media/")[1].split("?")[0];
    const initialSlideIndex = images.findIndex(
      image => image.token === currentToken
    );
    if (initialSlideIndex !== -1) {
      setInitialSlide(initialSlideIndex);
    }
    setIsFirstLoad(false);
  }, [images]);

  useEffect(() => {
    images.forEach(image => {
      const img = new Image();
      img.onload = () => {
        if (img.height > img.width && !isPortrait) {
          setIsPortrait(true);
        }
      };
      img.src = image.url;
    });
  }, [images, isPortrait]);

  useEffect(() => {
    if (images.length > 0) {
      setForceUpdateKey(prevKey => prevKey + 1);
    }
  }, [images]);

  const handleSwiper = (swiper: SwiperType) => {
    setThumbsSwiper(swiper);
  };

  const handleSlideChange = (swiper: SwiperType) => {
    if (!isFirstLoad) {
      // Only update URL if it's not the first load
      const currentSlideIndex = swiper.realIndex;
      const currentImage = images[currentSlideIndex];
      const currentImageToken = images[currentSlideIndex].token;
      const baseUrl = window.location.href.split("/media/")[0]; // Get the base URL before the token
      const queryParams = window.location.search; // Get query parameters if any
      const newUrl = `${baseUrl}/media/${currentImageToken}${queryParams}`; // Construct the new URL
      window.history.replaceState(null, "", newUrl); // Replace the current history state
      onActiveSlideChange(currentImage);
    }
  };

  const secondSwiperClass = `secondSwiper ${
    isPortrait ? "portrait" : "landscape"
  }`;

  return (
    <Panel padding={false} clear className="d-flex flex-column gap-3">
      <Swiper
        key={forceUpdateKey}
        loop={images.length > 1}
        spaceBetween={10}
        navigation={images.length > 1}
        thumbs={{ swiper: images.length > 1 ? thumbsSwiper : null }}
        modules={[FreeMode, Navigation, Thumbs]}
        className={secondSwiperClass}
        slidesPerView={1}
        initialSlide={initialSlide}
        onSlideChange={handleSlideChange}
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <img src={image.url} alt={`Slide ${index + 1}`} />
          </SwiperSlide>
        ))}
      </Swiper>
      {images.length > 1 && (
        <Swiper
          onSwiper={handleSwiper}
          loop={false}
          spaceBetween={10}
          slidesPerView={5}
          freeMode={true}
          watchSlidesProgress={true}
          modules={[FreeMode, Navigation, Thumbs]}
          className="firstSwiper"
          initialSlide={initialSlide}
        >
          {images.map((image, index) => (
            <SwiperSlide key={index}>
              <img src={image.url} alt={`Thumbnail ${index + 1}`} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </Panel>
  );
}

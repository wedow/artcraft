import { useSession } from "hooks";
import React, { useEffect, useRef, useState } from "react";

interface AdBannerProps {
  dataAdSlot: string;
  dataAdFormat: string;
  dataFullWidthResponsive: boolean;
  className?: string;
  style?: React.CSSProperties;
  fallbackContent?: React.ReactNode;
  tall?: boolean;
}

export function AdBanner({
  dataAdSlot,
  dataAdFormat,
  dataFullWidthResponsive,
  className = "",
  style = {},
  fallbackContent,
  tall = false,
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [adFailed, setAdFailed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { loggedIn, sessionSubscriptions } = useSession();
  const hasPremium = loggedIn && sessionSubscriptions?.hasPaidFeatures();

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
      // Clean up ad element before unmounting
      if (adRef.current) {
        try {
          const parent = adRef.current.parentNode;
          if (parent) {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            parent.removeChild(adRef.current);
          }
        } catch (error) {
          console.error("Error cleaning up ad:", error);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!mounted || hasPremium) {
      return;
    }

    // Check if adsbygoogle is blocked or not loaded
    if (typeof window === "undefined" || !(window as any).adsbygoogle) {
      setAdFailed(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (
        adRef.current &&
        (!adRef.current.innerHTML || adRef.current.innerHTML.trim() === "")
      ) {
        setAdFailed(true);
      }
    }, 2000);

    try {
      // Only push new ad if adsbygoogle exists and component is mounted
      if ((window as any).adsbygoogle && mounted) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
          {}
        );
      }
    } catch (err) {
      console.error("Error loading ad:", err);
      setAdFailed(true);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [hasPremium, mounted]);

  if (hasPremium) {
    return null;
  }

  if (adFailed) {
    if (fallbackContent) {
      return <>{fallbackContent}</>;
    }
    return (
      // <div
      //   className="text-center p-3 d-flex justify-content-center align-items-center"
      //   style={{
      //     height: "100px",
      //     backgroundColor: "#ffffff08",
      //     width: "100%",
      //   }}
      // >
      //   <div className="opacity-75">Ad failed to load</div>
      // </div>
      null
    );
  }

  return mounted ? (
    <ins
      ref={adRef}
      className={`adsbygoogle text-center ${className}`.trim()}
      style={{
        display: "block",
        minWidth: "400px",
        maxWidth: "1200px",
        width: "100%",
        height: tall ? "auto" : "90px",
        ...style,
      }}
      data-ad-client="ca-pub-5350229982172647"
      data-ad-slot={dataAdSlot}
      data-ad-format={dataAdFormat}
      data-full-width-responsive={dataFullWidthResponsive.toString()}
    />
  ) : null;
}

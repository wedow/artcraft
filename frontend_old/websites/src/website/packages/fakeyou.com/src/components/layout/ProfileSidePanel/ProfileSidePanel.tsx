import React, { useEffect, useState } from "react";
import { FakeYouFrontendEnvironment } from "@storyteller/components/src/env/FakeYouFrontendEnvironment";
import "./ProfileSidePanel.scss";
import UserProfileInfo from "./UserProfileInfo";
import { useLocation } from "react-router-dom";

export default function ProfileSidePanel() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const fakeYouFrontendEnv = FakeYouFrontendEnvironment.getInstance();
  const location = useLocation();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isDevelopmentEnv = fakeYouFrontendEnv.isDevelopment();
  const isOnProfilePage = location.pathname.includes("/profile/");

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const wrapper = document.getElementById("wrapper");
      const overlay = document.getElementById("overlay");

      if (
        (!wrapper?.contains(event.target as Node) ||
          overlay?.contains(event.target as Node)) &&
        window.innerWidth < 992
      ) {
        wrapper?.classList.remove("toggled");
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    // Update window width on resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      // Cleanup listener on unmount
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const shouldNotShowSidebar = !isOnProfilePage;
  const shouldShowSidebar = windowWidth >= 992 && !shouldNotShowSidebar;
  const sidebarClassName = `sidebar d-none d-lg-block ${
    shouldShowSidebar ? "visible" : ""
  }`.trim();

  useEffect(() => {
    const contentWrapper = document.getElementById("wrapper");

    if (shouldShowSidebar && isOnProfilePage) {
      contentWrapper?.classList.remove("no-padding");
    } else {
      contentWrapper?.classList.add("no-padding");
    }
  }, [shouldShowSidebar, isOnProfilePage]);

  return (
    <>
      <div id="profile-sidebar-wrapper" className={sidebarClassName}>
        <div className="py-3 ps-3 h-100">
          <div className="profile-sidebar-panel">
            <UserProfileInfo />
          </div>
        </div>
      </div>
    </>
  );
}

import {
  faBars,
  faFaceViewfinder,
  faMessageDots,
  faSearch,
  faStar,
  faWandMagicSparkles,
  faWaveformLines,
  faXmark,
  faClipboardList,
  faPortalEnter,
  faCompass,
  faCloudUpload,
  faTrophy,
  faBookOpen,
  faFilms,
  faUser,
  faSignOutAlt,
  faScrewdriverWrench,
  faImageUser,
  faSparkles,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "components/common";
import SearchBar from "components/common/SearchBar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useHistory } from "react-router-dom";
import { Logout } from "@storyteller/components/src/api/session/Logout";
import { useLocalize, useModal, usePageLocation, useSession } from "hooks";
import { InferenceJobsModal } from "components/modals";
import NavItem from "../../common/NavItem/NavItem";
import ProfileDropdown from "components/common/ProfileDropdown";
import "./TopNav.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { GetDiscordLink } from "@storyteller/components/src/env/GetDiscordLink";
import { WebUrl } from "common/WebUrl";
import {
  GetWebsite,
  Website,
} from "@storyteller/components/src/env/GetWebsite";
import RemoveAdsButton from "components/common/RemoveAdsButton";
import { useFeatureFlags } from "hooks/useFeatureFlags";

export default function TopNav() {
  const { queryAppState, sessionWrapper, user } = useSession();
  const domain = GetWebsite();
  const history = useHistory();
  const [isMobileSearchBarVisible, setIsMobileSearchBarVisible] =
    useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [menuButtonIcon, setMenuButtonIcon] = useState(faBars);
  const { t } = useLocalize("SideNav");
  const { isVideoToolsEnabled } = useFeatureFlags();
  const {
    isOnLandingPage,
    isOnLoginPage,
    isOnSignUpPage,
    isOnStudioPage,
    isOnBetaKeyRedeemPage,
    isOnWaitlistSuccessPage,
    isOnCreatorOnboardingPage,
    isOnWelcomePage,
    isOnTtsPage,
    isOnVcPage,
    isOnBetaForm,
  } = usePageLocation();
  const { open } = useModal();
  const openModal = () =>
    open({ component: InferenceJobsModal, props: { scroll: true } });
  const [isScrolled, setIsScrolled] = useState(false);
  const loggedIn = sessionWrapper.isLoggedIn();
  const showNavItem =
    (!loggedIn && (isOnLandingPage || isOnLoginPage || isOnSignUpPage)) ||
    domain.website === Website.StorytellerAi;
  const [mobileMenu, setMobileMenu] = useState("d-none");
  const topBarWrapperRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const handleSearchButtonClick = useCallback(() => {
    setIsMobileSearchBarVisible(true);
    setMenuButtonIcon(faBars);
    if (window.innerWidth < 1200 && wrapperRef.current) {
      wrapperRef.current.classList.remove("toggled");
    }
  }, []);

  const onFocusHandler = useCallback(() => {
    setIsFocused(true);
  }, []);

  const onBlurHandler = useCallback(() => {
    setTimeout(() => {
      setIsFocused(false);
      if (isMobileSearchBarVisible) {
        setIsMobileSearchBarVisible(false);
      }
    }, 100);
  }, [isMobileSearchBarVisible]);

  useEffect(() => {
    const handleMenuToggle = (event: any) => {
      setMenuButtonIcon(event.detail.isOpen ? faXmark : faBars);
      if (topBarWrapperRef.current) {
        topBarWrapperRef.current.classList.toggle(
          "topbar-wrapper-transparent",
          !event.detail.isOpen
        );
      }
    };

    window.addEventListener("menuToggle", handleMenuToggle);
    return () => {
      window.removeEventListener("menuToggle", handleMenuToggle);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const logoutHandler = useCallback(async () => {
    await Logout("", {});
    queryAppState();
    history.push("/");
  }, [history, queryAppState]);

  let profileDropdown = <></>;

  if (sessionWrapper.isLoggedIn()) {
    let displayName = user.display_name;
    let username = user.username;
    let emailHash = user.email_gravatar_hash;
    let avatarIndex = user.core_info?.default_avatar?.image_index || 0;
    let backgroundColorIndex = user.core_info?.default_avatar?.color_index || 0;

    profileDropdown = (
      <ProfileDropdown
        username={username || ""}
        displayName={displayName || ""}
        avatarIndex={avatarIndex}
        backgroundColorIndex={backgroundColorIndex}
        emailHash={emailHash || ""}
        logoutHandler={logoutHandler}
      />
    );
  }

  const topBarWrapper = document.getElementById("topbar-wrapper");

  useEffect(() => {
    const pageContentWrapper = document.getElementById("wrapper");

    if (pageContentWrapper) {
      if (
        (domain.website === Website.StorytellerAi && isOnLandingPage) ||
        isOnBetaKeyRedeemPage ||
        isOnCreatorOnboardingPage ||
        isOnLoginPage ||
        isOnSignUpPage ||
        isOnWelcomePage ||
        isOnBetaForm
      ) {
        pageContentWrapper.style.padding = "0px";
      } else {
        pageContentWrapper.style.padding = "";
      }
    }
  }, [
    isOnLandingPage,
    isOnBetaKeyRedeemPage,
    isOnWaitlistSuccessPage,
    isOnCreatorOnboardingPage,
    isOnLoginPage,
    isOnSignUpPage,
    isOnWelcomePage,
    isOnBetaForm,
    domain.website,
  ]);

  if (
    topBarWrapper &&
    domain.website === Website.StorytellerAi &&
    isOnLandingPage
  ) {
    topBarWrapper.classList.add("topbar-bg-transparent");
  } else {
    topBarWrapper?.classList.remove("topbar-bg-transparent");
  }

  useEffect(() => {
    const handleScroll = () => {
      if (
        topBarWrapper &&
        domain.website === Website.StorytellerAi &&
        isOnLandingPage
      ) {
        if (window.scrollY > 500) {
          topBarWrapper.classList.remove("topbar-bg-transparent");
        } else {
          topBarWrapper.classList.add("topbar-bg-transparent");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [domain.website, isOnLandingPage, topBarWrapper]);

  const handleNavLinkClick = useCallback(() => {
    setMobileMenu("d-none");
    setMenuButtonIcon(faBars);
  }, []);

  const handleMenuButtonClick = useCallback(() => {
    setMobileMenu(prev => (prev === "d-none" ? "d-block" : "d-none"));
    setMenuButtonIcon(prev => (prev === faBars ? faXmark : faBars));
  }, []);

  if (
    isOnBetaKeyRedeemPage ||
    isOnWaitlistSuccessPage ||
    isOnCreatorOnboardingPage ||
    isOnSignUpPage ||
    isOnLoginPage ||
    isOnWelcomePage ||
    isOnBetaForm
  ) {
    return null;
  }

  let userOrLoginButton = (
    <>
      <Button
        label="Login"
        small
        variant="secondary"
        onClick={() => {
          history.push("/login");
          handleNavLinkClick();
        }}
      />
    </>
  );

  let signupOrLogOutButton = (
    <>
      <Button
        label="Sign Up"
        small
        onClick={() => {
          history.push("/signup");
          handleNavLinkClick();
        }}
      />
    </>
  );

  if (loggedIn) {
    let displayName = sessionWrapper.getDisplayName();

    if (displayName === undefined) {
      displayName = "My Account";
    }

    let url = WebUrl.userProfilePage(displayName);
    userOrLoginButton = (
      <>
        <Button
          icon={faUser}
          label="My Profile"
          small
          variant="secondary"
          onClick={() => {
            history.push(url);
            handleNavLinkClick();
          }}
        />
      </>
    );

    signupOrLogOutButton = (
      <>
        <Button
          icon={faSignOutAlt}
          label="Logout"
          small
          variant="danger"
          onClick={async () => {
            await logoutHandler();
            handleNavLinkClick();
          }}
        />
      </>
    );
  }

  if (sessionWrapper.isLoggedIn()) {
    let displayName = sessionWrapper.getDisplayName();
    if (displayName === undefined) {
      displayName = "My Account";
    }
    let url = WebUrl.userProfilePage(displayName);
    userOrLoginButton = (
      <Button
        icon={faUser}
        label="My Profile"
        small
        variant="secondary"
        onClick={() => {
          history.push(url);
          handleNavLinkClick();
        }}
        className="d-block d-lg-none"
      />
    );
  }

  const newBadge = (
    <div className="d-flex align-items-center ms-2">
      <span className={"badge-new d-inline-flex align-items-center py-0 px-1"}>
        <FontAwesomeIcon icon={faSparkles} className="me-1" />
        NEW
      </span>
    </div>
  );

  return (
    <>
      <div
        id="topbar-wrapper"
        className={`position-fixed ${
          domain.titlePart !== "FakeYou"
            ? "topbar-bg-transparent"
            : !loggedIn &&
                isOnLandingPage &&
                !isScrolled &&
                mobileMenu === "d-none"
              ? "topbar-bg-dark"
              : ""
        }`.trim()}
      >
        <div className="topbar-nav">
          <div className="topbar-nav-left">
            <div className="d-flex gap-1 align-items-center">
              <Link to="/" className="me-3">
                <img
                  src={domain.logo}
                  alt={`${domain.titlePart}: Cartoon and Celebrity Text to Speech`}
                  height="36"
                  width={domain.website === Website.FakeYou ? "155" : "222"}
                  className="mb-1 d-none d-lg-block"
                />
                <img
                  src="/fakeyou/FakeYou-Logo-Mobile.png"
                  alt={`${domain.titlePart}: Cartoon and Celebrity Text to Speech`}
                  height="36"
                  width="26"
                  className="mb-0 d-block d-lg-none"
                />
              </Link>

              {domain.website === Website.FakeYou && (
                <div className="d-none d-lg-block no-wrap">
                  <NavItem
                    icon={faScrewdriverWrench}
                    label="Creator Tools"
                    link="/tools"
                  />
                </div>
              )}

              <NavItem
                icon={faCompass}
                label="Explore"
                link="/explore"
                className="d-none d-lg-block no-wrap"
              />
              <NavItem
                icon={faStar}
                label="Pricing"
                link="/pricing"
                className="me-3 d-none d-lg-block no-wrap"
              />
            </div>
          </div>

          <div className="topbar-nav-center">
            {/* Search Bar */}
            <div className="d-none d-lg-block">
              {domain.website === Website.FakeYou && (
                <>
                  {(!isOnLandingPage &&
                    !isOnLoginPage &&
                    !isOnSignUpPage &&
                    !isOnStudioPage &&
                    !isOnTtsPage &&
                    !isOnVcPage) ||
                  (loggedIn &&
                    !isOnLoginPage &&
                    !isOnSignUpPage &&
                    !isOnStudioPage &&
                    !isOnTtsPage &&
                    !isOnVcPage) ||
                  (isOnLandingPage &&
                    isScrolled &&
                    !isOnLoginPage &&
                    !isOnSignUpPage &&
                    !isOnStudioPage) ? (
                    <SearchBar
                      onFocus={onFocusHandler}
                      onBlur={onBlurHandler}
                      isFocused={isFocused}
                    />
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="topbar-nav-right">
            {domain.website === Website.StorytellerAi &&
              sessionWrapper.canAccessStudio() && (
                <div className="d-none d-lg-block">
                  <Button
                    icon={faPortalEnter}
                    label="Enter Storyteller Studio"
                    href="https://studio.storyteller.ai/"
                    small={true}
                    className="me-2"
                  />
                </div>
              )}

            <div className="d-flex align-items-center gap-2">
              {domain.website === Website.FakeYou && (
                <RemoveAdsButton small={true} />
              )}

              <div className="d-none d-lg-flex gap-2">
                {(domain.website === Website.FakeYou ||
                  (sessionWrapper.isLoggedIn() &&
                    domain.website === Website.StorytellerAi)) && (
                  <Button
                    {...{
                      icon: faClipboardList,
                      label: "My Jobs",
                      onClick: openModal,
                      variant: "secondary",
                      small: true,
                    }}
                  />
                )}

                {loggedIn ? (
                  profileDropdown
                ) : (
                  <>
                    <Button
                      label="Login"
                      small
                      variant="secondary"
                      onClick={() => {
                        history.push("/login");
                      }}
                    />
                    <Button
                      label="Sign Up"
                      small
                      onClick={() => {
                        history.push("/signup");
                      }}
                    />
                  </>
                )}
              </div>
              {!showNavItem && (
                <>
                  <Button
                    icon={faClipboardList}
                    variant="secondary"
                    small={true}
                    label="My Jobs"
                    onClick={openModal}
                    className="d-lg-none"
                  />
                  <Button
                    icon={faSearch}
                    variant="secondary"
                    small={true}
                    square={true}
                    onClick={handleSearchButtonClick}
                    className="d-lg-none"
                  />
                </>
              )}

              <Button
                icon={menuButtonIcon}
                variant="secondary"
                small={true}
                square={true}
                onClick={handleMenuButtonClick}
                className="d-lg-none"
              />
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`${mobileMenu} d-lg-none`}
          style={{ height: "calc(100vh - 65px)" }}
        >
          <ul className="sidebar-nav overflow-auto">
            <li>
              <NavLink
                exact={true}
                to="/tools"
                activeClassName="active-link"
                onClick={handleNavLinkClick}
              >
                <FontAwesomeIcon
                  icon={faScrewdriverWrench}
                  className="sidebar-heading-icon"
                />
                Creator Tools
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/pricing"
                activeClassName="active-link"
                onClick={handleNavLinkClick}
              >
                <FontAwesomeIcon
                  icon={faStar}
                  className="sidebar-heading-icon"
                />
                {t("infoPricing")}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/explore"
                activeClassName="active-link"
                onClick={handleNavLinkClick}
              >
                <FontAwesomeIcon
                  icon={faCompass}
                  className="sidebar-heading-icon"
                />
                Explore
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/inference-jobs-list"
                activeClassName="active-link"
                onClick={handleNavLinkClick}
              >
                <FontAwesomeIcon
                  icon={faClipboardList}
                  className="sidebar-heading-icon"
                />
                My Jobs
              </NavLink>
            </li>

            {isVideoToolsEnabled() && (
              <>
                <li className="sidebar-heading">{t("videoTitle")}</li>

                <li>
                  <NavLink
                    to="/style-video"
                    activeClassName="active-link"
                    onClick={handleNavLinkClick}
                    className="d-flex align-items-center"
                  >
                    <FontAwesomeIcon
                      icon={faFilms}
                      className="sidebar-heading-icon"
                    />
                    {t("videoStyleTransfer")}
                    {newBadge}
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/ai-live-portrait"
                    activeClassName="active-link"
                    onClick={handleNavLinkClick}
                    className="d-flex align-items-center"
                  >
                    <FontAwesomeIcon
                      icon={faImageUser}
                      className="sidebar-heading-icon"
                    />
                    Live Portrait
                    {newBadge}
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/face-animator"
                    activeClassName="active-link"
                    onClick={handleNavLinkClick}
                  >
                    <FontAwesomeIcon
                      icon={faFaceViewfinder}
                      className="sidebar-heading-icon"
                    />
                    {t("lipsync")}
                  </NavLink>
                </li>
              </>
            )}

            <li className="sidebar-heading">{t("speechTitle")}</li>

            <li>
              <NavLink
                to="/tts"
                activeClassName="active-link"
                onClick={handleNavLinkClick}
              >
                <FontAwesomeIcon
                  icon={faMessageDots}
                  className="sidebar-heading-icon"
                />
                {t("speechTts")}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/voice-conversion"
                activeClassName="active-link"
                onClick={handleNavLinkClick}
              >
                <FontAwesomeIcon
                  icon={faWaveformLines}
                  className="sidebar-heading-icon"
                />
                {t("speechVc")}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/voice-designer"
                activeClassName="active-link"
                onClick={handleNavLinkClick}
              >
                <FontAwesomeIcon
                  icon={faWandMagicSparkles}
                  className="sidebar-heading-icon"
                />
                {"Voice Designer"}
              </NavLink>
            </li>

            {/* {maybeImageGeneration}

          {maybeBetaFeatures} */}

            <li className="sidebar-heading">{t("communityTitle")}</li>
            <li>
              <NavLink
                to="/contribute"
                activeClassName="active-link"
                onClick={handleNavLinkClick}
              >
                <FontAwesomeIcon
                  icon={faCloudUpload}
                  className="sidebar-heading-icon"
                />
                {t("communityUploadModels")}
              </NavLink>
            </li>
            <li className="mb-3">
              <a href={GetDiscordLink()} target="_blank" rel="noreferrer">
                <FontAwesomeIcon
                  icon={faDiscord}
                  className="sidebar-heading-icon"
                />
                {t("communityDiscord")}
              </a>
              <NavLink
                to="/leaderboard"
                activeClassName="active-link"
                onClick={handleNavLinkClick}
              >
                <FontAwesomeIcon
                  icon={faTrophy}
                  className="sidebar-heading-icon"
                />
                {t("communityLeaderboard")}
              </NavLink>
              <NavLink
                to="/guide"
                activeClassName="active-link"
                onClick={handleNavLinkClick}
              >
                <FontAwesomeIcon
                  icon={faBookOpen}
                  className="sidebar-heading-icon"
                />
                {t("communityGuide")}
              </NavLink>
            </li>

            <div className="px-4 d-flex d-lg-none gap-2 mb-5 pb-3">
              {userOrLoginButton}
              {signupOrLogOutButton}
            </div>
          </ul>
        </div>

        {/* Mobile Searchbar */}
        {isMobileSearchBarVisible && (
          <div className="topbar-mobile-search-bar-container">
            <div className="topbar-mobile-search-bar">
              <SearchBar
                onFocus={onFocusHandler}
                onBlur={onBlurHandler}
                isFocused={isFocused}
                autoFocus={true}
              />

              <Button
                icon={faXmark}
                className="close-search-button"
                onClick={() => {
                  setIsMobileSearchBarVisible(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

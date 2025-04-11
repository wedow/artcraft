import { useLocomotiveScroll } from "react-locomotive-scroll";
import React, { useState, useEffect } from "react";

interface Props {}

function TopNav(props: Props) {
  const { scroll } = useLocomotiveScroll();
  const [isScrolling, setIsScrolling] = useState(false);
  const [showTopBtn, setTopBtn] = useState(false);

  useEffect(() => {
    if (!!scroll) {
      scroll.on("scroll", (position: { scroll: { y: number } }) => {
        if (position.scroll.y > 50) {
          // console.log(">> scroll > 50");
          if (!isScrolling) {
            setIsScrolling(true);
          }
        } else {
          // console.log(">> scroll < 50 ");
          if (isScrolling) {
            setIsScrolling(false);
          }
        }

        if (position.scroll.y > 400) {
          // console.log(">> scroll > 50");
          if (!showTopBtn) {
            setTopBtn(true);
          }
        } else {
          // console.log(">> scroll < 50 ");
          if (showTopBtn) {
            setTopBtn(false);
          }
        }
      });
    }
  }, [isScrolling, scroll, showTopBtn]);

  // Add .active class to the current button on click (highlight it)

  const navClassNames = isScrolling
    ? "container-fluid nav-scroll"
    : "container-fluid";

  // const backToTop = showTopBtn
  //   ? "btn-to-top nav-link show"
  //   : "btn-to-top nav-link";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  const hamburgerClassNames = mobileMenuOpen
    ? "button_container active"
    : "button_container";
  const menuClassNames = mobileMenuOpen ? "overlay open" : "overlay";

  useEffect(() => {
    const overlay = document.getElementById("navbar");
    if (mobileMenuOpen) {
      document.body.classList.add("lock-scroll");
      overlay?.classList.add("h-100");
    } else {
      document.body.classList.remove("lock-scroll");
      overlay?.classList.remove("h-100");
    }
  }, [mobileMenuOpen]);

  // Add .active class on nav links when scrolling (highlight it)

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add("lock-scroll");
    } else {
      document.body.classList.remove("lock-scroll");
    }
  }, [mobileMenuOpen]);

  // window.addEventListener("load", () => {
  //   const navBtn1 = document.getElementById("nav-btn-1");
  //   const navBtn2 = document.getElementById("nav-btn-2");
  //   const navBtn3 = document.getElementById("nav-btn-3");
  //   // const navBtn4 = document.getElementById("nav-btn-4");

  //   // Add .active class on buttons when scrolling (highlight it)
  //   scroll.on("call", (callValue: string) => {
  //     if (callValue === "home") {
  //       navBtn1?.classList.add("active");
  //       console.log(callValue);
  //     } else {
  //       navBtn1?.classList.remove("active");
  //     }

  //     if (callValue === "film") {
  //       navBtn2?.classList.add("active");
  //       console.log(callValue);
  //     } else {
  //       navBtn2?.classList.remove("active");
  //     }

  //     if (callValue === "music") {
  //       navBtn3?.classList.add("active");
  //       console.log(callValue);
  //     } else {
  //       navBtn3?.classList.remove("active");
  //     }
  //   });
  // });

  return (
    <>
      <nav
        id="navbar"
        className={navClassNames}
        data-scroll-container
        data-scroll-sticky
      >
        <div className="d-none d-lg-flex flex-wrap align-items-center justify-content-center justify-content-md-between">
          <a
            href="/"
            className="d-flex align-items-center col-md-3 mb-2 mb-md-0 text-dark text-decoration-none"
          >
            <img
              id="logo"
              src="/logo/storytellerai-logo.png"
              alt="Storyteller Logo"
              height="34"
            />
          </a>

          <ul className="nav col-12 col-md-auto mb-2 justify-content-center mb-md-0">
            <li>
              <a
                href="#home"
                id="nav-btn-1"
                className="nav-link"
                data-scroll-to
              >
                Home
              </a>
            </li>
            <li>
              <a
                id="nav-btn-4"
                href="#vision"
                className="nav-link"
                data-scroll-to
              >
                Vision
              </a>
            </li>
            <li>
              <a
                id="nav-btn-4"
                href="#products"
                className="nav-link"
                data-scroll-to
              >
                Products
              </a>
            </li>
            <li>
              <a
                id="nav-btn-2"
                href="#research"
                className="nav-link"
                data-scroll-to
              >
                Research
              </a>
            </li>
            <li>
              <a
                id="nav-btn-5"
                href="#team"
                className="nav-link"
                data-scroll-to
              >
                Team
              </a>
            </li>
          </ul>

          <div className="col-md-3 text-end">
            <a
              id="nav-btn-6"
              href="#contact"
              className="btn btn-primary fs-6"
              data-scroll-to
            >
              Contact
            </a>
          </div>
        </div>

        <div className="d-flex d-lg-none justify-content-between">
          <a
            href="/"
            className="d-flex align-items-center text-dark text-decoration-none"
          >
            <img
              id="logo"
              src="/logo/storytellerai-logo.png"
              alt="Storyteller Logo"
              height="34"
            />
          </a>
          <button
            onClick={menuToggle}
            className={hamburgerClassNames}
            id="toggle"
            aria-controls="primary-menu"
            aria-expanded="false"
          >
            <span className="top"></span>
            <span className="middle"></span>
            <span className="bottom"></span>
          </button>
        </div>

        <div className={menuClassNames}>
          <div className="overlay-menu">
            <ul>
              <li className="nav-link">
                <a onClick={menuToggle} href="#home" data-scroll-to>
                  Home
                </a>
              </li>
              <li className="nav-link">
                <a onClick={menuToggle} href="#vision" data-scroll-to>
                  Vision
                </a>
              </li>
              <li className="nav-link">
                <a onClick={menuToggle} href="#products" data-scroll-to>
                  Products
                </a>
              </li>
              <li className="nav-link">
                <a onClick={menuToggle} href="#research" data-scroll-to>
                  Research
                </a>
              </li>
              <li className="nav-link">
                <a onClick={menuToggle} href="#team" data-scroll-to>
                  Team
                </a>
              </li>
              <li className="mt-4">
                <a
                  onClick={menuToggle}
                  href="#contact"
                  data-scroll-to
                  className="btn btn-primary"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* <a href="#home" className={backToTop} data-scroll-to>
        <div className="btt-shape"></div>
        Back to Top
      </a> */}
    </>
  );
}

export { TopNav };

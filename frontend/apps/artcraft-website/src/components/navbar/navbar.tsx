import { Disclosure } from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";
import { DiscordButton } from "../discord-button";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Disclosure
      as="nav"
      className={twMerge(
        "z-20 fixed top-0 left-0 w-full transition-colors duration-200 bg-transparent",
        scrolled
          ? "bg-[#1b1b1f]/70 backdrop-blur-lg lg:bg-transparent lg:backdrop-blur-none"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-screen sm:px-6 lg:px-8 px-6 md:px-16 xl:px-4">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex shrink-0 items-center">
              <a href="/">
                <img
                  alt="ArtCraft"
                  src="/images/artcraft-logo.png"
                  className="h-7 w-auto"
                />
              </a>
            </div>
            {/* <div className="hidden md:ml-7 md:flex md:items-center md:space-x-3">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  aria-current={item.current ? "page" : undefined}
                  className={twMerge(
                    item.current
                      ? "text-white/80 hover:text-white"
                      : "text-white/80 hover:text-white",
                    "rounded-md px-3 py-2 text-[15px] font-medium transition-all"
                  )}
                >
                  {item.name}
                </a>
              ))}
            </div> */}
          </div>
          <div className="flex items-center">
            <div className="hidden md:ml-4 md:flex md:shrink-0 md:items-center">
              {/* <Button as="link" href="/download">
                Download
              </Button> */}
              <DiscordButton
                small
                className="bg-white text-black hover:bg-white/90"
              />
            </div>
            <div className="-ml-2 flex items-center md:hidden">
              {/* Mobile menu button */}
              <DiscordButton
                className="text-sm bg-white text-black hover:bg-white/90"
                small
              />
            </div>
          </div>
        </div>
      </div>

      {/* <DisclosurePanel className="md:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
          {navigation.map((item) => (
            <DisclosureButton
              key={item.name}
              as="a"
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={twMerge(
                item.current
                  ? "bg-gray-900 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white",
                "block rounded-md px-3 py-2 text-base font-medium"
              )}
            >
              {item.name}
            </DisclosureButton>
          ))}
        </div>
      </DisclosurePanel> */}
    </Disclosure>
  );
}

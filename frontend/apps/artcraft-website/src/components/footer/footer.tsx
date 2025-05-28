import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTiktok,
  faDiscord,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { SOCIAL_LINKS } from "../../config/links";

const navigation = {
  main: [
    { name: "Home", href: "/" },
    { name: "Download", href: "/download" },
  ],
  social: [
    {
      name: "Discord",
      href: SOCIAL_LINKS.DISCORD,
      icon: (props: any) => <FontAwesomeIcon icon={faDiscord} {...props} />,
    },
    {
      name: "YouTube",
      href: SOCIAL_LINKS.YOUTUBE,
      icon: (props: any) => <FontAwesomeIcon icon={faYoutube} {...props} />,
    },
    {
      name: "TikTok",
      href: SOCIAL_LINKS.TIKTOK,
      icon: (props: any) => <FontAwesomeIcon icon={faTiktok} {...props} />,
    },
  ],
};

export default function Example() {
  return (
    <footer className="bg-transparent">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-16 sm:py-16 lg:px-8 flex flex-col gap-12 items-center">
        {/* <Button
          icon={faArrowDownToLine}
          className="w-fit"
          onClick={() => window.open("/download", "_self")}
        >
          Download ArtCraft
        </Button> */}
        {/* <nav
          aria-label="Footer"
          className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm/6"
        >
          {navigation.main.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-gray-400 hover:text-white"
            >
              {item.name}
            </a>
          ))}
        </nav> */}
        <div>
          <div className="flex justify-center gap-x-10">
            {navigation.social.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                className="text-gray-400 hover:text-gray-300 transition-all"
              >
                <span className="sr-only">{item.name}</span>
                <item.icon
                  aria-hidden="true"
                  className="size-6 text-white/70"
                />
              </a>
            ))}
          </div>
          <p className="mt-10 text-center text-sm/6 text-gray-400">
            &copy; 2025 ArtCraft. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

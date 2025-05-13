import { Button } from "@storyteller/ui-button";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { SOCIAL_LINKS } from "../../config/links";

interface DiscordButtonProps {
  className?: string;
  small?: boolean;
}

export const DiscordButton = ({
  className = "",
  small = false,
}: DiscordButtonProps) => {
  const sizeClasses = small
    ? "px-4 py-2 text-md rounded-xl"
    : "text-lg px-4 py-2 md:px-8 md:py-4 md:text-2xl rounded-2xl";

  return (
    <Button
      className={`relative z-10 ${sizeClasses} font-bold transition-all duration-300 shadow-lg hover:shadow-blue-500/25 ${className}`}
      icon={faDiscord}
      as="link"
      href={SOCIAL_LINKS.DISCORD}
      target="_blank"
    >
      Join Discord
    </Button>
  );
};

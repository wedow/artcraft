import { faArrowRight } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface FeatureCardProps {
  title: string;
  description: string;
  image: string;
  gradient: string;
  isReversed?: boolean;
}

const FeatureCard = ({
  title,
  description,
  image,
  // gradient,
  isReversed,
}: FeatureCardProps) => {
  return (
    <div
      className={`flex flex-col items-center gap-12 lg:flex-row ${isReversed ? "lg:flex-row-reverse" : ""}`}
    >
      {/* Image Section */}
      <div className="group relative w-full lg:w-3/5">
        <div className="relative rounded-3xl border border-gray-100 bg-gray-100 p-1 backdrop-blur-sm">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <img
              src={image}
              alt={title}
              className="h-full w-full transform object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* <div className="absolute inset-0 bg-black/10" /> */}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="w-full space-y-6 lg:w-2/5">
        <h3 className="text-3xl font-bold tracking-tight text-gray-900">
          {title}
        </h3>
        <p className="text-lg leading-relaxed text-gray-600">{description}</p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/signup"
            className="group inline-flex items-center !text-primary-500 transition-colors hover:!text-primary-600"
          >
            Start Creating Now
            <FontAwesomeIcon
              icon={faArrowRight}
              className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;

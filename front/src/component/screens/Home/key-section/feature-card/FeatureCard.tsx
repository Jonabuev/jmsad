import Image from "next/image";
import Link from "next/link";
import { FC } from "react";

interface FeatureCardProps {
  imageSrc: string;
  title: string;
  description: string;
  link: string;
  isExternal?: boolean;
}

const FeatureCard: FC<FeatureCardProps> = ({
  imageSrc,
  title,
  description,
  link,
  isExternal = false,
}) => {
  const linkProps = {
    className: "text-blue-600 font-bold hover:text-blue-800 transition-colors",
  };

  return (
    <div className="relative overflow-hidden h-[400px] rounded-lg shadow-lg">
      <Image
        src={imageSrc}
        alt={title}
        height={400}
        width={400}
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />
      <div className="absolute bottom-8 left-8 right-8 max-w-[80%] bg-white/95 p-6 border-l-4 border-blue-600 rounded-r-md z-10">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">{title}</h3>
        <p className="text-base text-gray-600 leading-relaxed mb-5">
          {description}
        </p>
        {isExternal ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            {...linkProps}
          >
            Перейти →
          </a>
        ) : (
          <Link href={link} {...linkProps}>
            Перейти →
          </Link>
        )}
      </div>
    </div>
  );
};

export default FeatureCard;

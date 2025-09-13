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
    <div className="relative overflow-hidden h-[400px] rounded-xl shadow-lg group hover:shadow-2xl transition-all duration-500 cursor-pointer">
      {/* Background Image with Blur Effect */}
      <div 
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat z-0 transition-transform duration-500 group-hover:scale-110"
        style={{
          backgroundImage: imageSrc,
          filter: "blur(1px)"
        }}
      />
      
      {/* Dark overlay that appears on hover */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/0 group-hover:bg-black/20 transition-all duration-500 z-10"></div>
      
      {/* Title - always visible */}
      <div className="absolute top-6 left-6 right-6 z-20">
        <h3 className="text-2xl font-bold text-white drop-shadow-lg group-hover:text-white transition-colors duration-300">
          {title}
        </h3>
      </div>
      
      {/* Description and Link - slide up on hover */}
      <div className="absolute bottom-0 left-0 right-0 z-20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
        <div className="bg-white/95 backdrop-blur-sm p-6 border-l-4 border-blue-600">
          <p className="text-base text-gray-600 leading-relaxed mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
            {description}
          </p>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300">
            {isExternal ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 font-bold hover:text-blue-800 transition-colors duration-300 hover:translate-x-1"
              >
                Перейти →
              </a>
            ) : (
              <Link 
                href={link} 
                className="inline-flex items-center text-blue-600 font-bold hover:text-blue-800 transition-colors duration-300 hover:translate-x-1"
              >
                Перейти →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;

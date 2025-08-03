import Image from "next/image";
import Link from "next/link";

const Logo = () => {
  return (
    <Link href='/' className="flex items-center gap-2 sm:gap-4 text-[#0d151c] group bg-white">
      <Image 
        src="/home/logo.png" 
        alt="logo" 
        width={180} 
        height={105} 
        className="w-32 sm:w-40 md:w-44 lg:w-48 xl:w-52 h-auto object-contain transition-all duration-300 group-hover:scale-105 group-hover:opacity-80"
      />
    </Link>
  );
};

export default Logo;

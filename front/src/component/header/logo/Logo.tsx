import Image from "next/image";
import Link from "next/link";

const Logo = () => {
  return (
    <Link href='/' className="flex items-center gap-4 text-[#0d151c] group">
      <Image 
        src="/home/logo.png" 
        alt="logo" 
        width={180} 
        height={105} 
        className="object-contain transition-all duration-300 group-hover:scale-105 group-hover:opacity-80"
      />
    </Link>
  );
};

export default Logo;

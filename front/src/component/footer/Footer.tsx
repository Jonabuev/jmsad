import React from "react";
import Link from "next/link";

const Footer: React.FC = () => {
  return (
    <footer className="bg-blue-500 text-white py-6 mt-10">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
        <div className="space-x-4 mb-4 md:mb-0">
          <Link href="/rules" className="hover:underline">
            Our SIte Rules
          </Link>
        </div>
        <div className="text-sm">
          © {new Date().getFullYear()} All Copyrights saved
        </div>
      </div>
    </footer>
  );
};

export default Footer;

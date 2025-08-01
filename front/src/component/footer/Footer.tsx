import React from "react";
import Link from "next/link";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8 mt-16 shadow-lg">
      <div className="px-[114px] flex flex-col md:flex-row justify-between items-center text-center md:text-left">
        <div className="space-x-4 mb-4 md:mb-0">
          <Link href="/rules" className="hover:underline transition-colors duration-200 hover:text-blue-200">
            Our Site Rules
          </Link>
        </div>
        <div className="text-sm opacity-90">
          © {new Date().getFullYear()} All Copyrights saved
        </div>
      </div>
    </footer>
  );
};

export default Footer;

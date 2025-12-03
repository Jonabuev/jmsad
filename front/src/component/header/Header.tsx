import { FC, useState, useCallback, memo } from "react";
import Logo from "./logo/Logo";
import NavigationBar from "./navigation/NavigationBar";
import MobileMenu from "./MobileMenu";

const Header: FC = memo(() => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <header className="flex items-center justify-between border-b border-solid border-b-gray-200 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-3 sm:py-4 h-16 sm:h-20 bg-white shadow-sm backdrop-blur-sm relative z-50">
      <Logo />
      
      {/* Desktop Navigation */}
      <div className="hidden lg:block">
        <NavigationBar />
      </div>
      
      {/* Mobile Menu Button */}
      <div className="lg:hidden">
        <button
          onClick={toggleMobileMenu}
          className="flex flex-col justify-center items-center w-8 h-8 space-y-1 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg"
          aria-label="Toggle mobile menu"
        >
          <span className={`block w-6 h-0.5 bg-gray-600 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-gray-600 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-gray-600 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </button>
      </div>
      
      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
    </header>
  );
});

Header.displayName = 'Header';

export default Header;

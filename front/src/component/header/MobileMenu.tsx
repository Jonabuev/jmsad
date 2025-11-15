import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/component/store/store";
import { logout } from "@/component/store/auth/authSlice";
import { mediaUrl } from "@/utils/url";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const { profile: user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation("common");
  const router = useRouter();
  
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("resize", handleResize);
      document.body.style.overflow = 'hidden';
      document.body.style.overflowX = 'hidden';
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = 'unset';
      document.body.style.overflowX = 'unset';
    };
  }, [isOpen, onClose]);

  const handleLogout = () => {
    dispatch(logout());
    onClose();
    window.location.href = "/";
  };

  const changeLanguage = (newLocale: string) => {
    router.push(router.pathname, router.asPath, { locale: newLocale });
    setIsLanguageDropdownOpen(false);
  };

  const handleLinkClick = () => {
    onClose();
  };

  const isActiveLink = (path: string) => router.pathname === path;

  return (
    <>
             {/* Backdrop - Completely Transparent */}
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${!isOpen ? 'pointer-events-none' : ''}`}
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
        onClick={onClose}
      />
     
             {/* Mobile Menu - Right Side */}
              <div 
         ref={menuRef}
         className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
           isOpen ? 'translate-x-0' : 'translate-x-full'
         } ${!isOpen ? 'pointer-events-none' : ''}`}
         style={{ 
           width: 'min(320px, 85vw)',
           maxWidth: '85vw',
           transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
           visibility: isOpen ? 'visible' : 'hidden',
           height: '100vh'
         }}
       >
         <div className="flex flex-col h-screen">
                      {/* Header with Close Button */}
           <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
             <div className="flex items-center gap-3">
               <Image 
                 src="/home/logo.png" 
                 alt="logo" 
                 width={120} 
                 height={70} 
                 className="w-20 h-auto object-contain lg:hidden"
               />
             </div>
             <button
               onClick={onClose}
               className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
             >
               <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>

                      {/* User Profile Section */}
           {isAuthenticated && user && (
             <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <Image
                  src={user.user.avatar ? mediaUrl(user.user.avatar) : mediaUrl("/media/avatars/def.jpg")}
                  alt="Аватар"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover object-center"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = mediaUrl("/media/avatars/def.jpg");
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 font-medium text-sm truncate">{user.user.username}</h3>
                </div>
              </div>
            </div>
          )}

                      {/* Navigation Menu */}
           <div className="flex-1 py-4 bg-white overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
                          <nav className="space-y-1">
              
              <Link 
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                  isActiveLink("/search") 
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`} 
                href="/search"
                onClick={handleLinkClick}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t("navigation.registry")}
              </Link>
              
              {isAuthenticated && user?.user.role !== "tenant" && (
                <Link 
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                    isActiveLink("/faq") 
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`} 
                  href="/faq"
                  onClick={handleLinkClick}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t("navigation.faq")}
                </Link>
              )}
              
              {isAuthenticated && user?.user.is_superuser && (
                <Link 
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                    router.pathname.startsWith("/admin")
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`} 
                  href="/admin"
                  onClick={handleLinkClick}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t("navigation.admin")}
                </Link>
              )}
            </nav>
          </div>

                      {/* Language Selector */}
           <div className="px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="relative" ref={languageDropdownRef}>
              <button
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200"
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              >
                <div className="flex items-center gap-2">
                  <Image src="/home/earth.svg" alt="language" width={16} height={16} className="opacity-70" />
                  <span>Язык</span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isLanguageDropdownOpen && (
                <div className="mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                  <button 
                    onClick={() => changeLanguage("ru")}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    {t("languages.ru")}
                  </button>
                  <div className="border-t border-gray-100"></div>
                  <button 
                    onClick={() => changeLanguage("en")}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    {t("languages.en")}
                  </button>
                  <div className="border-t border-gray-100"></div>
                  <button 
                    onClick={() => changeLanguage("kz")}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    {t("languages.kz")}
                  </button>
                </div>
              )}
            </div>
          </div>

                      {/* User Actions */}
           <div className="px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
            {isAuthenticated && user ? (
              <div className="space-y-1">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200"
                  onClick={handleLinkClick}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t("navigation.profile")}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t("logout")}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/register" onClick={handleLinkClick}>
                  <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200">
                    {t("navigation.register")}
                  </button>
                </Link>
                <Link href="/login" onClick={handleLinkClick}>
                  <button className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors duration-200">
                    {t("navigation.login")}
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
   </>
  );
};

export default MobileMenu; 
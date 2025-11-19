import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/component/store/store";
import { logout } from "@/component/store/auth/authSlice";
import { mediaUrl } from "@/utils/url";
import { NotificationBell } from "@/component/notifications";

const NavigationBar: React.FC = () => {
  const { profile: user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation("common");
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLanguageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = "/";
  };

  const changeLanguage = (newLocale: string) => {
    router.push(router.pathname, router.asPath, { locale: newLocale });
    setIsLanguageDropdownOpen(false);
  };

  return (
    <div className="flex flex-1 justify-end gap-4 lg:gap-6 xl:gap-8 relative h-14 bg-white">
      <div className="flex items-center gap-6 lg:gap-8 xl:gap-12">
        <Link 
          className={`text-[#0d151c] text-sm lg:text-base font-normal transition-all duration-200 hover:text-blue-600 relative ${
            router.pathname === "/search" ? "text-blue-600" : ""
          }`} 
          href="/search"
        >
          {t("navigation.registry")}
          {router.pathname === "/search" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>
          )}
        </Link>
        {isAuthenticated && (
          <Link 
            className={`text-[#0d151c] text-sm lg:text-base font-normal transition-all duration-200 hover:text-blue-600 relative ${
              router.pathname === "/faq" ? "text-blue-600" : ""
            }`} 
            href="/faq"
          >
            {t("navigation.faq")}
            {router.pathname === "/faq" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>
            )}
          </Link>
        )}
        {isAuthenticated && user?.user.is_superuser && (
          <Link 
            className={`text-[#0d151c] text-sm lg:text-base font-normal transition-all duration-200 hover:text-blue-600 relative ${
              router.pathname.startsWith("/admin") ? "text-blue-600" : ""
            }`} 
            href="/admin"
          >
            {t("navigation.admin")}
            {router.pathname.startsWith("/admin") && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>
            )}
          </Link>
        )}
      </div>

      <div className="flex gap-2 lg:gap-4 items-center relative">
        <div className="relative" ref={languageDropdownRef}>
          <button
            className="flex items-center gap-1 text-[#0d151c] text-sm lg:text-base font-medium hover:text-blue-600 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-50"
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
          >
            <Image src="/home/earth.svg" alt="language" width={20} height={20} />
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
            <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-[60]">
              <button 
                onClick={() => changeLanguage("ru")}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
              >
                {t("languages.ru")}
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button 
                onClick={() => changeLanguage("en")}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
              >
                {t("languages.en")}
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button 
                onClick={() => changeLanguage("kz")}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
              >
                {t("languages.kz")}
              </button>
            </div>
          )}
        </div>


        {/* Уведомления */}
        {isAuthenticated && user && (
          <NotificationBell className="relative" />
        )}

        {isAuthenticated && user ? (
          <div className="relative" ref={dropdownRef}>
            <Image
              src={user.user.avatar ? mediaUrl(user.user.avatar) : mediaUrl("/media/avatars/def.jpg")}
              alt={t("common.avatar")}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover object-center cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all duration-200"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              onError={(e) => {
                (e.target as HTMLImageElement).src = mediaUrl("/media/avatars/def.jpg");
              }}
            />

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-[60]">
                <Link
                  href="/profile"
                  className="px-4 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 block"
                >
                  <span>{t("navigation.profile")}</span>
                </Link>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                >
                  {t("logout")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/register">
              <button className="h-10 px-3 lg:px-4 bg-[#2094f3] text-white rounded-xl text-sm lg:text-base font-normal hover:bg-blue-600 transition-colors duration-200">
                {t("navigation.register")}
              </button>
            </Link>
            <Link href="/login">
              <button className="h-10 px-3 lg:px-4 bg-[#e7eef4] text-[#0d151c] rounded-xl text-sm lg:text-base font-normal hover:bg-gray-200 transition-colors duration-200">
                {t("navigation.login")}
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default NavigationBar;

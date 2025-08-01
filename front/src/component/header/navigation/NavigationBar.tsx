import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/component/store/store";
import { logout } from "@/component/store/auth/authSlice";

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
    <div className="flex flex-1 justify-end gap-8 relative h-14">
      <div className="flex items-center gap-12">
        <Link 
          className={`text-[#0d151c] text-sm font-normal transition-all duration-200 hover:text-blue-600 relative ${
            router.pathname === "/search" ? "text-blue-600" : ""
          }`} 
          href="/search"
        >
          {t("navigation.registry")}
          {router.pathname === "/search" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>
          )}
        </Link>
        {isAuthenticated && user?.user.role !== "tenant" && (
          <Link 
            className={`text-[#0d151c] text-sm font-normal transition-all duration-200 hover:text-blue-600 relative ${
              router.pathname === "/forum" ? "text-blue-600" : ""
            }`} 
            href="/forum"
          >
            {t("navigation.forum")}
            {router.pathname === "/forum" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>
            )}
          </Link>
        )}
        <Link
          className={`text-[#0d151c] text-sm font-normal transition-all duration-200 hover:text-blue-600 relative ${
            router.pathname === "/rental-catalog" ? "text-blue-600" : ""
          }`}
          href="/rental-catalog"
        >
          {t("navigation.catalog")}
          {router.pathname === "/rental-catalog" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>
          )}
        </Link>
        <Link
          className={`text-[#0d151c] text-sm font-normal transition-all duration-200 hover:text-blue-600 relative ${
            router.pathname === "/analiticsML" ? "text-blue-600" : ""
          }`}
          href="/analiticsML"
        >
          {t("navigation.analytics")}
          {router.pathname === "/analiticsML" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>
          )}
        </Link>
      </div>

      <div className="flex gap-4 items-center relative">
        <div className="relative" ref={languageDropdownRef}>
          <button
            className="flex items-center gap-1 text-[#0d151c] text-sm font-medium"
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
          >
            <Image src="/home/earth.svg" alt="language" width={20} height={20} />
            <svg
              className="w-4 h-4"
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
            <div className="absolute right-0 mt-2 w-32 bg-white border rounded-lg shadow-lg py-2 z-50">
              <button onClick={() => changeLanguage("ru")}>Русский</button>
              <br />
              <button onClick={() => changeLanguage("en")}>English</button>
              <br />
              <button onClick={() => changeLanguage("kz")}>Қазақша</button>
            </div>
          )}
        </div>

        {isAuthenticated && user ? (
          <div className="relative" ref={dropdownRef}>
            <Image
              src={`http://127.0.0.1:8000${user.user.avatar}`}
              alt="Аватар"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover object-center cursor-pointer"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/default-avatar.png";
              }}
            />

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg py-2 z-50">
                <Link
                  href="/profile"
                  className="px-4 py-2 text-sm font-medium text-gray-800 cursor-default block"
                >
                  <span>{t("navigation.profile")}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                >
                  {t("logout")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
                         <Link href="/register">
               <button className="h-10 px-4 bg-[#2094f3] text-white rounded-xl text-sm font-normal">
                 {t("navigation.register")}
               </button>
             </Link>
             <Link href="/login">
               <button className="h-10 px-4 bg-[#e7eef4] text-[#0d151c] rounded-xl text-sm font-normal">
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

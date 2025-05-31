import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

interface IUser {
  user: {
    username: string;
    avatar?: string;
    role: "tenant" | "landlord";
  };
}

const NavigationBar: React.FC = () => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation("common");
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios
        .get("http://127.0.0.1:8000/api/profile/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setUser(res.data);
        })
        .catch((err) => {
          console.error("Ошибка при загрузке данных о пользователе:", err);
        });
    }
  }, [token]);

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
    localStorage.removeItem("access_token");
    setUser(null);
    window.location.href = "/";
  };

  const changeLanguage = (newLocale: string) => {
    router.push(router.pathname, router.asPath, { locale: newLocale });
    setIsLanguageDropdownOpen(false);
  };

  return (
    <div className="flex flex-1 justify-end gap-8 relative h-14)">
      <div className="flex items-center gap-9">
        <Link className="text-[#0d151c] text-sm font-medium" href="/search">
          {t("navigation.registry")}
        </Link>
        {user?.user.role !== "tenant" && (
          <Link className="text-[#0d151c] text-sm font-medium" href="/forum">
            {t("navigation.forum")}
          </Link>
        )}
        <Link
          className="text-[#0d151c] text-sm font-medium"
          href="/rental-catalog"
        >
          {t("navigation.catalog")}
        </Link>
        <Link
          className="text-[#0d151c] text-sm font-medium"
          href="/analiticsML"
        >
          {t("navigation.analytics")}
        </Link>
      </div>

      <div className="flex gap-4 items-center relative">
        <div className="relative" ref={languageDropdownRef}>
          <button
            className="flex items-center gap-1 text-[#0d151c] text-sm font-medium"
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
          >
            {t("navigation.language")}
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

        {user ? (
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
              <button className="h-10 px-4 bg-[#2094f3] text-white rounded-xl text-sm font-bold">
                {t("navigation.register")}
              </button>
            </Link>
            <Link href="/login">
              <button className="h-10 px-4 bg-[#e7eef4] text-[#0d151c] rounded-xl text-sm font-bold">
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

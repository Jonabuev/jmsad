import { FC } from "react";
import Logo from "./logo/Logo";
import NavigationBar from "./navigation/NavigationBar";

const Header: FC = () => {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-gray-200 px-[114px] py-4 h-[80px] bg-white shadow-sm backdrop-blur-sm">
      <Logo />
      <NavigationBar />
    </header>
  );
};

export default Header;

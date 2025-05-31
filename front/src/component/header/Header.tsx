import { FC } from "react";
import Logo from "./logo/Logo";
import NavigationBar from "./navigation/NavigationBar";

const Header: FC = () => {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e7eef4] px-10 py-3">
      <Logo />
      <NavigationBar />
    </header>
  );
};

export default Header;

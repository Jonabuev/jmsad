import { FC } from "react";
import { LuSearch } from "react-icons/lu";

const SearchBar: FC = () => {
  return (
    <label className="flex h-14 w-full max-w-[480px]">
      <div className="flex items-center border border-[#f2f2f2] bg-white rounded-l-xl pl-4 pr-4">
        <LuSearch color="black" />
      </div>
      <input
        className="w-full border border-[#d0dbe7]  px-4 rounded-r-xl bg-white focus:outline-none text-black"
        placeholder="Search"
      />
    </label>
  );
};

export default SearchBar;

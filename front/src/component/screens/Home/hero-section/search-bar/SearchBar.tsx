import { FC } from "react";
import { LuSearch } from "react-icons/lu";
import styles from "./SearchBar.module.scss";

const SearchBar: FC = () => {
  return (
    <label className={styles.searchBar}>
      <div className={styles.searchIcon}>
        <LuSearch color="black" />
      </div>
      <input
        className={styles.searchInput}
        placeholder="Search"
      />
    </label>
  );
};

export default SearchBar;

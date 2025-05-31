interface Props {
  filter: string;
  setFilter: (val: string) => void;
  t: (key: string) => string;
}

export const ForumFilter = ({ filter, setFilter, t }: Props) => (
  <div className="flex gap-2 mb-6 justify-center">
    {["popular", "new", "old"].map((type) => (
      <button
        key={type}
        onClick={() => setFilter(type)}
        className={`px-4 py-2 rounded ${
          filter === type ? "bg-blue-600 text-white" : "bg-gray-200"
        }`}
      >
        {t(`forum.filter.${type}`)}
      </button>
    ))}
  </div>
);

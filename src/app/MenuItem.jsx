export default function MenuItem({
  icon,
  text,
  open,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition
      ${
        active
          ? "bg-white text-purple-700 font-semibold"
          : "hover:bg-white/20"
      }`}
    >
      {icon}

      {open && <span>{text}</span>}
    </button>
  );
}
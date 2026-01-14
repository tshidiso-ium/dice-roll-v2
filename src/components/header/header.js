import { useState } from "react";
import logo from '../../images/dice-red.jpg';

export default function NavMobile({ userLogedOut, redirect }) {
  const [isOpen, setIsOpen] = useState(false);

  const items = [
    { name: "Logout", href: "/", key: "Logout" },
    { name: "Play", href: "/home", key: "Play" },
    { name: "Account", href: "/account", key: "Account" },
    // { name: "Contact", href: "/contact", key: "Contact" }
  ];

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuClick = (item) => {
    if (item.name === "Logout") {
      userLogedOut();
    }
    else {
        redirect(item.href);
    }
    setIsOpen(false); // close menu after click
  };

  return (
    <div className="relative w-full z-50">
      {/* Top Nav */}
      <div
        onClick={handleToggle}
        className=" bg-gradient-to-r from-black via-red-900 to-black h-[80px] flex justify-between items-center px-4 cursor-pointer"
      >
        <img src={logo} alt="Dice Logo" className="h-[60px] w-auto" />
        <p className="text-white text-[25px] font-IvyJournal font-[400]">
          Dice Roll
        </p>
        <div className="p-2">
          {/* Hamburger Menu Icon */}
          <div className="space-y-1">
            <span
              className={`block h-0.5 w-7 bg-white rounded-sm transform transition 
                ${isOpen ? "rotate-45 translate-y-1" : "-translate-y-0.5"}`}
            />
            <span
              className={`block h-0.5 w-7 bg-white rounded-sm transition 
                ${isOpen ? "opacity-0" : "opacity-100"}`}
            />
            <span
              className={`block h-0.5 w-7 bg-white rounded-sm transform transition 
                ${isOpen ? "-rotate-45 -translate-y-1" : "translate-y-0.5"}`}
            />
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      <div
        className={`transition-all duration-300 ease-in-out bg-white/80 backdrop-blur-md 
          ${isOpen ? "h-screen opacity-100" : "h-0 opacity-0 overflow-hidden"}`}
      >
        <nav className="flex flex-col w-full pt-10">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => handleMenuClick(item)}
              className="text-left px-8 py-4 text-red-800 font-bold text-lg hover:bg-red-100 transition"
            >
              {item.name.toUpperCase()}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
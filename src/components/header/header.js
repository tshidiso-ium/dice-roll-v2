import { useState, createRef } from "react";
import logo from '../../images/dice-red.jpg'

export default function NavMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const dropContainer = createRef();
  const navContainer = createRef();

  const items = [
    {
      name: "Home",
      href: "/",
      key: "Home"
    },
    {
      name: "About",
      href: "/",
      key: "About"
    },
    {
      name: "Extract",
      href: "/",
      key: "Extract"
    },
    {
      name: "Contact",
      href: "",
      key: "Contact"
    }
  ];

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      onClick={handleClick}
      className="relative flex-1 w-full h-[80px] justify-center items-center z-50 bg-transparent backdrop-blur-md"
    >

      <div className={`bg-white h-full flex justify-between w-full z-50`}>
                <img src={logo}>
        </img>
        <a
          href="/"
          passHref
          className="w-full h-full text-left pt-5"
        >
          <p className="text-red-700 text-gradient text-[25px] font-IvyJournal font-[400] ">
            Dice Role
          </p>
        </a>
        <div className={`p-2 mr-[0.5rem] mt-6`}>
          <span
            className={`bg-red-700 block transition  duration-300 ease-out h-0.5 w-7 rounded-sm ${isOpen
              ? "rotate-45 translate-y-1"
              : "-translate-y-0.5"}`}
          />
          <span
            className={`bg-red-700 block transition duration-300 ease-out h-0.5 w-9 rounded-sm my-0.5 ${isOpen
              ? "opacity-0"
              : "opacity-100 -translate-x-2"}`}
          />
          <span
            className={`bg-red-700 bg-red block transition duration-300 ease-out h-0.5 w-7 rounded-sm ${isOpen
              ? "-rotate-45 -translate-y-1"
              : "translate-y-0.5"}`}
          />
        </div>
      </div>
      <div
        ref={dropContainer}
        className={`${!isOpen
          ? "h-0 overflow-hidden fixed top-0 w-full z-50"
          : " backdrop-blur-xl bg-black bg-opacity-30"}`}
      >
<nav
  ref={navContainer}
  className={`w-full h-screen pb-[32px] z-50`}
>
  {items.map(x => {
    return (
      <a key={x.href} href={x.href} className="w-full h-full p-4 text-left pt-6">
        <p
          target="_self"
          className={`text-red-800 w-full animation fadeIn duration-300 ease-linear block text-gradient pt-[32px] pl-[32px] font-[400]`}
          onClick={handleClick}
        >
          {x.name.toUpperCase()}
        </p>
      </a>
    );
  })}
</nav>
      </div>
    </div>
  );
}

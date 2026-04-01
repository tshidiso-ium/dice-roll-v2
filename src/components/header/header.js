import { useState } from "react";
import logo from "../../images/dice-red.png";

export default function NavMobile({
  userLogedOut,
  redirect,
  currentPath,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const items = [
    { name: "Play", href: "/home", key: "Play" },
    { name: "Account", href: "/account", key: "Account" },
    { name: "Logout", href: "/", key: "Logout" },
  ];

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMenuClick = (item) => {
    if (item.name === "Logout") {
      userLogedOut();
    } else {
      redirect(item.href);
    }
    setIsOpen(false);
  };

  const isActive = (href) => currentPath === href;

  const activeItem = items.find((item) => isActive(item.href) && item.name !== "Logout");

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-neutral-950/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        <div className="flex h-[72px] items-center justify-between px-4">
          {/* Brand */}
          <button
            onClick={() => redirect("/home")}
            className="flex items-center gap-3"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl shadow-md pt-2">
              <img
                src={logo}
                alt="Dice Roll logo"
                className="h-16 w-16 object-contain "
              />
            </div>

            <div className="flex flex-col items-start leading-none">
              <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-red-500/80">
                Premium Games
              </span>
              <span className="text-[16px] font-bold tracking-wide text-white">
                Dice Roll
              </span>
            </div>
          </button>

         {activeItem && (
          <div className="px-4 sm:hidden ">
            <div className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-red-400">
                {activeItem.name}
              </span>
            </div>
          </div>
        )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {activeItem && (
              <div className="hidden rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 sm:flex">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-400">
                  {activeItem.name}
                </span>
              </div>
            )}

            <button
              onClick={handleToggle}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
              className="group flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
            >
              <div className="relative h-5 w-6">
                <span
                  className={`absolute left-0 top-0 block h-[2px] w-6 rounded-full bg-white transition-all duration-300 ${
                    isOpen ? "top-2 rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-2 block h-[2px] w-6 rounded-full bg-white transition-all duration-300 ${
                    isOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 top-4 block h-[2px] w-6 rounded-full bg-white transition-all duration-300 ${
                    isOpen ? "top-2 -rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile visible current page */}

      </div>

      {/* Mobile menu overlay */}
      <div
        className={`overflow-hidden bg-neutral-950/95 backdrop-blur-xl transition-all duration-300 ${
          isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="px-4 pb-6 pt-3">
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-2">
            {items.map((item) => {
              const isLogout = item.name === "Logout";
              const active = !isLogout && isActive(item.href);

              return (
                <button
                  key={item.key}
                  onClick={() => handleMenuClick(item)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-4 text-left text-[15px] font-semibold transition ${
                    active
                      ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span>{item.name}</span>
                  </div>

                  <span
                    className={`text-lg ${
                      active
                        ? "text-red-300"
                        : "text-white/40"
                    }`}
                  >
                    →
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
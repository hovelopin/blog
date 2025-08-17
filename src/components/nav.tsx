import Link from 'next/link';

const navItems = {
  '/blog': {
    name: 'blog'
  },
  '/log': {
    name: 'log'
  },
  '/timeline': {
    name: 'timeline'
  }
};

export function Navbar() {
  return (
    <aside className="sticky top-0 z-10 mb-8 -ml-[8px] bg-white tracking-tight">
      <div>
        <nav
          className="fade relative flex h-[70px] scroll-pr-6 flex-row items-center justify-between px-0 pb-0 md:relative md:overflow-auto"
          id="nav">
          <div className="m-1 px-2 py-1 text-[24px] font-bold italic">
            <Link href="/">Harvey.</Link>
          </div>
          <div className="flex flex-row space-x-0">
            {Object.entries(navItems).map(([path, { name }]) => {
              return (
                <Link
                  key={path}
                  href={path}
                  className="relative m-1 flex px-1 py-1 align-middle font-bold italic transition-all after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#8ffebf] after:transition-all after:duration-300 hover:text-neutral-800 hover:after:w-full">
                  {name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}

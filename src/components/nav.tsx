import Link from 'next/link';

const navItems = {
  '/blog': {
    name: 'blog'
  },
  '/log': {
    name: 'log'
  }
};

export function Navbar() {
  return (
    <aside className="mb-12 -ml-[8px] tracking-tight">
      <div className="lg:sticky lg:top-20">
        <nav
          className="fade relative flex scroll-pr-6 flex-row items-start justify-between px-0 pb-0 md:relative md:overflow-auto"
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

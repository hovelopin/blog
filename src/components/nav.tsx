import Link from 'next/link';

const navItems = {
  '/': {
    name: 'Harvey'
  },
  '/blog': {
    name: 'blog'
  },
  '/log': {
    name: 'log'
  }
};

export function Navbar() {
  return (
    <aside className="mb-16 -ml-[8px] tracking-tight">
      <div className="lg:sticky lg:top-20">
        <nav
          className="fade relative flex scroll-pr-6 flex-row items-start px-0 pb-0 md:relative md:overflow-auto"
          id="nav">
          <div className="flex flex-row space-x-0 pr-10">
            {Object.entries(navItems).map(([path, { name }]) => {
              return (
                <Link
                  key={path}
                  href={path}
                  className="relative m-1 flex px-2 py-1 align-middle transition-all hover:text-neutral-800">
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

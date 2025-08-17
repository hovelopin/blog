function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="mb-16">
      <ul className="font-sm mt-8 flex justify-center gap-6 space-y-2 space-x-0 text-neutral-600 md:flex-row md:space-y-0 md:space-x-4">
        <li>
          <a
            className="flex items-center transition-all hover:text-neutral-800"
            rel="noopener noreferrer"
            target="_blank"
            href="https://github.com/hovelopin">
            <ArrowIcon />
            <p className="ml-2 h-7">Github</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all hover:text-neutral-800"
            rel="noopener noreferrer"
            target="_blank"
            href="https://www.linkedin.com/in/hovelopin">
            <ArrowIcon />
            <p className="ml-2 h-7">LinkedIn</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all hover:text-neutral-800"
            rel="noopener noreferrer"
            target="_blank"
            href="mailto:kimhojin3714@naver.com">
            <ArrowIcon />
            <p className="ml-2 h-7">Email</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all hover:text-neutral-800"
            rel="noopener noreferrer"
            target="_blank"
            href="/rss">
            <ArrowIcon />
            <p className="ml-2 h-7">Rss</p>
          </a>
        </li>
      </ul>
      <p className="mt-8 flex justify-center text-neutral-600">
        © {new Date().getFullYear()} harvey all rights reserved.
      </p>
    </footer>
  );
}

export default function TimelinePage() {
  return (
    <section>
      <ol className="relative border-s border-gray-200 dark:border-gray-700">
        <li className="ms-4 mb-10">
          <div className="absolute -start-1.5 h-3 w-3 rounded-full border border-white bg-gray-200 dark:border-gray-900 dark:bg-gray-700"></div>
          <time className="mb-1 text-sm leading-none font-normal text-gray-400 dark:text-gray-500">
            February 2022
          </time>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Application UI code in Tailwind CSS
          </h3>
          <p className="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">
            Get access to over 20+ pages including a dashboard layout, charts, kanban board,
            calendar, and pre-order E-commerce & Marketing pages.
          </p>
          <a
            href="#"
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:text-blue-700 focus:ring-4 focus:ring-gray-100 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700">
            Learn more{' '}
            <svg
              className="ms-2 h-3 w-3 rtl:rotate-180"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 10">
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M1 5h12m0 0L9 1m4 4L9 9"
              />
            </svg>
          </a>
        </li>
        <li className="ms-4 mb-10">
          <div className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-gray-200 dark:border-gray-900 dark:bg-gray-700"></div>
          <time className="mb-1 text-sm leading-none font-normal text-gray-400 dark:text-gray-500">
            March 2022
          </time>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Marketing UI design in Figma
          </h3>
          <p className="text-base font-normal text-gray-500 dark:text-gray-400">
            All of the pages and components are first designed in Figma and we keep a parity between
            the two versions even as we update the project.
          </p>
        </li>
        <li className="ms-4">
          <div className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-gray-200 dark:border-gray-900 dark:bg-gray-700"></div>
          <time className="mb-1 text-sm leading-none font-normal text-gray-400 dark:text-gray-500">
            April 2022
          </time>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            E-Commerce UI code in Tailwind CSS
          </h3>
          <p className="text-base font-normal text-gray-500 dark:text-gray-400">
            Get started with dozens of web components and interactive elements built on top of
            Tailwind CSS.
          </p>
        </li>
      </ol>
    </section>
  );
}

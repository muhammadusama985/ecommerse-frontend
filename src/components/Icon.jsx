const iconPaths = {
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
      <path d="M3 5h2l2.2 9.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H7" />
    </>
  ),
  home: (
    <>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5V19h11v-8.5" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" />
    </>
  ),
  star: (
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.2l-5.5 3 1-6.2L3 9.6l6.2-.9Z" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </>
  ),
  heart: (
    <path d="M12 20s-6.7-4.2-8.4-8A4.9 4.9 0 0 1 12 6a4.9 4.9 0 0 1 8.4 6c-1.7 3.8-8.4 8-8.4 8Z" />
  ),
  package: (
    <>
      <path d="M4.5 8.5 12 4l7.5 4.5v7L12 20l-7.5-4.5Z" />
      <path d="M12 4v16" />
      <path d="M4.5 8.5 12 13l7.5-4.5" />
    </>
  ),
  logout: (
    <>
      <path d="M14 6V4.8A1.8 1.8 0 0 0 12.2 3H6.8A1.8 1.8 0 0 0 5 4.8v14.4A1.8 1.8 0 0 0 6.8 21h5.4a1.8 1.8 0 0 0 1.8-1.8V18" />
      <path d="M10 12h10" />
      <path d="m17 8 4 4-4 4" />
    </>
  ),
  chart: (
    <>
      <path d="M5 19V9" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
    </>
  ),
  tag: (
    <>
      <path d="M11 4H5a1 1 0 0 0-1 1v6l8.5 8.5a1.4 1.4 0 0 0 2 0l5-5a1.4 1.4 0 0 0 0-2Z" />
      <circle cx="7.5" cy="7.5" r="1" />
    </>
  ),
  fileText: (
    <>
      <path d="M8 3h6l4 4v14H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </>
  ),
  image: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m20 16-4.5-4.5L9 18" />
    </>
  ),
  message: (
    <>
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4 4v-4H7.5A2.5 2.5 0 0 1 5 12.5Z" />
    </>
  ),
};

function Icon({ name, className = "", strokeWidth = 1.8 }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name] || null}
    </svg>
  );
}

export { Icon };

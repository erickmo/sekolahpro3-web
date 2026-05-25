import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

const base: Props = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  width: "100%",
  height: "100%",
};

export const IconHome = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-6h4v6" />
  </svg>
);

export const IconUsers = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M16 14c3 0 5.5 2.3 5.5 5.5" />
  </svg>
);

export const IconBook = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H6a2 2 0 0 0-2 2V4.5Z" />
    <path d="M4 20a2 2 0 0 1 2-2h13" />
  </svg>
);

export const IconCalendar = (p: Props) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </svg>
);

export const IconCheck = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M4 12l5 5L20 6" />
  </svg>
);

export const IconWallet = (p: Props) => (
  <svg {...base} {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M16 12h3M3 9h13a2 2 0 0 1 0 4H3" />
  </svg>
);

export const IconChat = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M4 5h16v11H8l-4 4V5Z" />
  </svg>
);

export const IconSettings = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.2.6.7 1 1.4 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </svg>
);

export const IconBell = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7Z" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </svg>
);

export const IconLogout = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
    <path d="M10 17l-5-5 5-5M5 12h11" />
  </svg>
);

export const IconChart = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M3 3v18h18" />
    <path d="M7 15l4-5 3 3 5-7" />
  </svg>
);

export const IconSearch = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const IconFilter = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z" />
  </svg>
);

export const IconDownload = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M12 4v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M5 20h14" />
  </svg>
);

export const IconPlus = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconEdit = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M4 20h4l11-11-4-4L4 16v4Z" />
    <path d="m13 6 4 4" />
  </svg>
);

export const IconMore = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="6" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="18" cy="12" r="1.5" />
  </svg>
);

export const IconPhone = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </svg>
);

export const IconMail = (p: Props) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

export const IconMapPin = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13Z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

export const IconCake = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M4 11h16v9H4z" />
    <path d="M4 15c2 1 4-1 6 0s4-1 6 0 4-1 4-1" />
    <path d="M12 8V4" />
    <circle cx="12" cy="3" r="0.5" />
  </svg>
);

export const IconId = (p: Props) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="12" r="2.5" />
    <path d="M14 10h5M14 14h5M5 16c.8-1.5 2.3-2.5 4-2.5s3.2 1 4 2.5" />
  </svg>
);

export const IconFile = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
    <path d="M14 3v6h6" />
  </svg>
);

export const IconGrad = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M2 9l10-5 10 5-10 5L2 9Z" />
    <path d="M6 11v5c2 2 10 2 12 0v-5" />
    <path d="M22 9v6" />
  </svg>
);

export const IconArrowLeft = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M19 12H5" />
    <path d="m12 5-7 7 7 7" />
  </svg>
);

export const IconPrint = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M6 9V3h12v6" />
    <rect x="3" y="9" width="18" height="9" rx="2" />
    <path d="M6 18v3h12v-3" />
  </svg>
);

export const IconAlert = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M12 3 2 21h20L12 3Z" />
    <path d="M12 10v5M12 18v.5" />
  </svg>
);

export const IconClock = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

function LayoutGridIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <rect x="3" y="2.5" width="10" height="15" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 6h1M6 9h1M6 12h1M9.5 6h1M9.5 9h1M9.5 12h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 8.5h3a1 1 0 011 1V17H13" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path d="M7 5h9M7 10h9M7 15h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="3.5" cy="5" r="1" fill="currentColor" />
      <circle cx="3.5" cy="10" r="1" fill="currentColor" />
      <circle cx="3.5" cy="15" r="1" fill="currentColor" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <circle cx="7" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 16c0-2.8 2-4.5 4.5-4.5s4.5 1.7 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.8 11.7c2.1.2 3.7 1.8 3.7 4.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <rect x="2" y="4.5" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 8h16" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export const icons = {
  dashboard: <LayoutGridIcon />,
  clients: <BuildingIcon />,
  leads: <ListIcon />,
  users: <UsersIcon />,
  billing: <CreditCardIcon />,
};

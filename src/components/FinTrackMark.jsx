import { NAVY, GREEN } from "../lib/constants";

export default function FinTrackMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill={NAVY} />
      <rect x="9" y="22" width="5.5" height="9" rx="1.6" fill="#5EEAD4" />
      <rect x="17.25" y="15" width="5.5" height="16" rx="1.6" fill={GREEN} />
      <rect x="25.5" y="9" width="5.5" height="22" rx="1.6" fill="#34D399" />
    </svg>
  );
}

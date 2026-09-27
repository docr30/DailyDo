import { Wallet, Gift, ShoppingBag, Car, Film, HeartPulse, MoreHorizontal, GraduationCap, Coffee } from "lucide-react";

const ICONS = {
  wallet: Wallet, gift: Gift, shopping: ShoppingBag, car: Car, film: Film,
  heart: HeartPulse, graduation: GraduationCap, coffee: Coffee, more: MoreHorizontal,
};

export default function CatIcon({ iconKey, size = 16, color }) {
  const Cmp = ICONS[iconKey] || MoreHorizontal;
  return <Cmp size={size} color={color} />;
}

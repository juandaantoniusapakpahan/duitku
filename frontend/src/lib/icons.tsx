import {
  Baby,
  Banknote,
  Briefcase,
  Car,
  ChartLine,
  Coffee,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  MoreHorizontal,
  PawPrint,
  Plane,
  Receipt,
  ShoppingBag,
  Smartphone,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  landmark: Landmark,
  smartphone: Smartphone,
  banknote: Banknote,
  'chart-line': ChartLine,
  wallet: Wallet,
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  film: Film,
  receipt: Receipt,
  'heart-pulse': HeartPulse,
  'more-horizontal': MoreHorizontal,
  gift: Gift,
  coffee: Coffee,
  fuel: Fuel,
  home: Home,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  plane: Plane,
  'gamepad-2': Gamepad2,
  dumbbell: Dumbbell,
  baby: Baby,
  'paw-print': PawPrint,
};

export const ICON_NAMES = Object.keys(ICONS);

export function getIcon(name: string): LucideIcon {
  return ICONS[name] ?? Wallet;
}

const COLOR_CLASSES: Record<string, { bg: string; text: string; solid: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', solid: 'bg-blue-500' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', solid: 'bg-yellow-500' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', solid: 'bg-emerald-500' },
  ink: { bg: 'bg-ink-100', text: 'text-ink-600', solid: 'bg-ink-500' },
  brand: { bg: 'bg-brand-100', text: 'text-brand-600', solid: 'bg-brand-500' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', solid: 'bg-amber-500' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', solid: 'bg-orange-500' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600', solid: 'bg-pink-500' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-600', solid: 'bg-rose-500' },
  red: { bg: 'bg-red-100', text: 'text-red-600', solid: 'bg-red-500' },
};

export function getColorClasses(color: string): { bg: string; text: string; solid: string } {
  return COLOR_CLASSES[color] ?? COLOR_CLASSES.ink;
}

export const COLOR_NAMES = Object.keys(COLOR_CLASSES);

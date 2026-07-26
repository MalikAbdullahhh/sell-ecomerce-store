import {
  Clock,
  Instagram,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";

const ICONS = {
  truck: Truck,
  package: PackageCheck,
  return: RotateCcw,
  shield: ShieldCheck,
  mail: Mail,
  phone: Phone,
  clock: Clock,
  pin: MapPin,
  star: Star,
  instagram: Instagram,
} as const;

/** Renders one of the icons an admin can pick in the Website module. */
export function CmsIcon({
  name,
  size = 20,
  className,
}: {
  name?: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[(name || "star") as keyof typeof ICONS] || Star;
  return <Icon width={size} height={size} strokeWidth={1.4} className={className} />;
}

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface ButtonProps {
  href: string;
  label?: string;
  arrow?: 'left' | 'right' | false;
}

export default function Button({ href, label = "Back", arrow = false }: ButtonProps) {
  return (
    <div>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-accent px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-accent/90 transition-colors"
      >
        {arrow === 'left' && <ArrowLeft className="h-4 w-4" />}
        {label}
        {arrow === 'right' && <ArrowRight className="h-4 w-4" />}
        {arrow === false && <span></span>}
      </Link>
    </div>
  );
}
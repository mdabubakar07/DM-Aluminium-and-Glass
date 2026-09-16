import { Phone } from 'lucide-react';

export default function FloatingContact() {
  return (
    <a
      href="tel:+916302072336"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ice-500 text-white shadow-lg shadow-ice-500/30 transition-all duration-300 hover:scale-110 hover:bg-ice-400 hover:shadow-xl hover:shadow-ice-400/40"
      aria-label="Call DM Aluminium & Glass"
    >
      <Phone size={24} />
      <span className="absolute inset-0 rounded-full bg-ice-400 opacity-60 motion-safe:animate-ping" />
    </a>
  );
}

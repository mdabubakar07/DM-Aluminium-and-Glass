import { Phone, MapPin } from 'lucide-react';

const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Grama Panchayat, Devanpally, Kamareddy, Telangana 503111')}`;

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-charcoal-950 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          {/* Brand */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-aluminum-300 via-aluminum-100 to-aluminum-400 shadow-md">
                <span className="text-sm font-bold text-charcoal-900">DM</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold tracking-wide text-white">
                  DM ALUMINIUM
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ice-300">
                  &amp; Glass
                </span>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-aluminum-400">
              Aluminium profiles, toughened glass, sliding doors, UPVC, shower
              enclosures, and main doors in Devanpally, Kamareddy.
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-aluminum-300">
              Navigate
            </h4>
            {[
              { label: 'Services', href: '#services' },
              { label: 'Process', href: '#process' },
              { label: 'Gallery', href: '#gallery' },
              { label: 'Contact', href: '#contact' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-aluminum-400 transition-colors hover:text-ice-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center gap-3 md:items-start">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-aluminum-300">
              Reach Us
            </h4>
            <a
              href="tel:+916302072336"
              className="flex items-center gap-2 text-sm text-aluminum-400 transition-colors hover:text-ice-300"
            >
              <Phone size={14} />
              Babumiya: 6302072336
            </a>
            <a
              href="tel:+917989155621"
              className="flex items-center gap-2 text-sm text-aluminum-400 transition-colors hover:text-ice-300"
            >
              <Phone size={14} />
              Dawood: 7989155621
            </a>
            <a
              href={MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 text-sm text-aluminum-400 transition-colors hover:text-ice-300"
            >
              <MapPin size={14} className="mt-0.5 flex-shrink-0" />
              Beside Grama Panchayat, Devanpally,
              <br className="hidden" /> Kamareddy — 503 111
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-xs text-aluminum-500">
            &copy; {new Date().getFullYear()} DM Aluminium &amp; Glass. All
            rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-xs text-aluminum-500 transition-colors hover:text-ice-300"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-xs text-aluminum-500 transition-colors hover:text-ice-300"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

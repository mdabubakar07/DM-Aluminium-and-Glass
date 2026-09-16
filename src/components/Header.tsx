import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Services', href: '#services' },
  { label: 'Process', href: '#process' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogoTap = () => {
    const nextCount = tapCount + 1;
    setTapCount(nextCount);

    if (nextCount >= 10) {
      setTapCount(0);
      window.location.hash = '#admin';
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-charcoal-900/95 backdrop-blur-md py-3 shadow-lg shadow-black/40'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-10">
        {/* Logo */}
        <button
          onClick={() => {
            handleLogoTap();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-3 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-aluminum-300 via-aluminum-100 to-aluminum-400 shadow-md transition-transform duration-300 group-hover:scale-110">
            <span className="text-lg font-bold text-charcoal-900">DM</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-wide text-white">
              DM ALUMINIUM
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ice-300">
              &amp; Glass
            </span>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="text-sm font-medium text-aluminum-200 transition-colors duration-200 hover:text-ice-300"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => handleNavClick('#contact')}
            className="rounded-md bg-ice-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-ice-500/20 transition-all duration-300 hover:bg-ice-400 hover:shadow-lg hover:shadow-ice-400/30"
          >
            Get a Free Quote
          </button>
        </nav>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 md:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`overflow-hidden transition-all duration-400 md:hidden ${
          menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col gap-1 bg-charcoal-800/95 px-6 py-4 backdrop-blur-md">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="rounded-md px-4 py-3 text-left text-sm font-medium text-aluminum-200 transition-colors hover:bg-white/5 hover:text-ice-300"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => handleNavClick('#contact')}
            className="mt-2 rounded-md bg-ice-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-ice-400"
          >
            Get a Free Quote
          </button>
        </nav>
      </div>
    </header>
  );
}

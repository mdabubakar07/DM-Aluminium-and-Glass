import { ArrowRight, ChevronDown } from 'lucide-react';

export default function Hero() {
  const scrollToServices = () => {
    document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.pexels.com/photos/532562/pexels-photo-532562.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280"
          alt="Modern glass facade with geometric patterns"
          className="h-full w-full object-cover"
        />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950/90 via-charcoal-900/70 to-charcoal-900/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-transparent to-charcoal-950/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-24 lg:px-10">
        <div className="max-w-3xl">
          {/* Brand badge */}
          <div className="reveal mb-6 inline-flex items-center gap-2 rounded-full border border-ice-400/30 bg-ice-500/10 px-4 py-2 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-ice-400 animate-shimmer" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-200">
              DM Aluminium &amp; Glass
            </span>
          </div>

          {/* Headline */}
          <h1 className="reveal reveal-delay-1 text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            Aluminium &amp; Glass,
            <br />
            <span className="bg-gradient-to-r from-ice-300 via-ice-200 to-aluminum-200 bg-clip-text text-transparent">
              Built for Better Spaces
            </span>
          </h1>

          {/* Tagline */}
          <p className="reveal reveal-delay-2 mt-6 max-w-xl text-base leading-relaxed text-aluminum-200 sm:text-lg lg:text-xl">
            Quality aluminium profiles, toughened glass, sliding doors, windows,
            UPVC, shower enclosures, and main doors — crafted for homes and
            businesses in Devanpally and Kamareddy.
          </p>

          {/* CTAs */}
          <div className="reveal reveal-delay-3 mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#contact"
              className="group inline-flex items-center justify-center gap-2 rounded-md bg-ice-500 px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-ice-500/25 transition-all duration-300 hover:bg-ice-400 hover:shadow-xl hover:shadow-ice-400/40 hover:scale-[1.02]"
            >
              Get a Free Quote
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href="#gallery"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-aluminum-400/40 px-7 py-4 text-sm font-semibold text-aluminum-100 backdrop-blur-sm transition-all duration-300 hover:border-ice-300/60 hover:bg-white/5 hover:text-white"
            >
              View Our Work
            </a>
          </div>

          {/* Stats bar */}
          <div className="reveal reveal-delay-4 mt-16 flex flex-wrap gap-8 border-t border-white/10 pt-8">
            {[
              { value: '6+', label: 'Core Services' },
              { value: '2', label: 'Direct Contacts' },
              { value: '100%', label: 'Custom Fitted' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-2xl font-bold text-white sm:text-3xl">
                  {stat.value}
                </span>
                <span className="mt-1 text-xs font-medium uppercase tracking-wider text-aluminum-300">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToServices}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-aluminum-300 transition-colors hover:text-ice-300"
        aria-label="Scroll down"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.2em]">
          Scroll
        </span>
        <ChevronDown size={18} className="animate-bounce" />
      </button>
    </section>
  );
}

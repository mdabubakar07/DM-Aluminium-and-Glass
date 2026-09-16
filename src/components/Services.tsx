import { Layers, Square, Building2, ArrowUpRight } from 'lucide-react';

const services = [
  {
    icon: Layers,
    title: 'Aluminium Profile',
    description:
      'Strong, clean aluminium profiles for durable frames, partitions, and modern building solutions.',
    image:
      'https://images.pexels.com/photos/30711518/pexels-photo-30711518.jpeg?auto=compress&cs=tinysrgb&w=940&h=650',
    tags: ['Profiles', 'Frames', 'Partitions'],
  },
  {
    icon: Square,
    title: 'Tuffen Glass & Sliding Door',
    description:
      'Toughened glass and smooth sliding door systems that bring more light, safety, and style to every room.',
    image:
      'https://images.pexels.com/photos/35699360/pexels-photo-35699360.jpeg?auto=compress&cs=tinysrgb&w=940&h=650',
    tags: ['Tuffen Glass', 'Sliding Doors', 'Safety'],
  },
  {
    icon: Building2,
    title: 'Aluminium Window & UPVC',
    description:
      'Low-maintenance aluminium windows and UPVC fittings for comfortable, secure, and finished interiors.',
    image:
      'https://images.pexels.com/photos/32367382/pexels-photo-32367382.jpeg?auto=compress&cs=tinysrgb&w=940&h=650',
    tags: ['Windows', 'UPVC', 'Main Doors'],
  },
];

export default function Services() {
  return (
    <section id="services" className="relative bg-charcoal-900 py-24 lg:py-32">
      {/* Section header */}
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="reveal mb-16 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ice-400">
            What We Do
          </span>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Core Services
          </h2>
          <p className="mt-4 text-base leading-relaxed text-aluminum-300 lg:text-lg">
            Three disciplines, one standard of excellence. From custom
            fabrication to architectural installation, every project is
            delivered with precision and care.
          </p>
        </div>

        {/* Service cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <article
                key={service.title}
                className={`reveal reveal-delay-${index + 1} group relative overflow-hidden rounded-xl border border-white/5 bg-charcoal-800 transition-all duration-500 hover:border-ice-400/30 hover:shadow-2xl hover:shadow-ice-500/10 [transform:perspective(1200px)_rotateX(2deg)_rotateY(0deg)] hover:[transform:perspective(1200px)_rotateX(0deg)_rotateY(-2deg)]`}
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-800 via-charcoal-800/20 to-transparent" />
                  {/* Icon badge */}
                  <div className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-lg bg-charcoal-900/80 backdrop-blur-sm ring-1 ring-ice-400/30 transition-all duration-500 group-hover:scale-110 group-hover:ring-ice-400/60 [transform:translateZ(20px)]">
                    <Icon size={22} className="text-ice-300" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-ice-200">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-aluminum-300">
                    {service.description}
                  </p>

                  {/* Tags */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {service.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-aluminum-200 ring-1 ring-white/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Link */}
                  <a
                    href="#contact"
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ice-300 transition-colors hover:text-ice-200"
                  >
                    Request a Quote
                    <ArrowUpRight
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

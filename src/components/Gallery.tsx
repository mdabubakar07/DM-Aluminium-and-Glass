import { useState } from 'react';
import { X } from 'lucide-react';

const galleryItems = [
  {
    src: 'https://images.pexels.com/photos/11861957/pexels-photo-11861957.jpeg?auto=compress&cs=tinysrgb&w=940&h=650',
    alt: 'Sleek modern architecture with curved glass facade',
    title: 'Curved Glass Facade',
    category: 'Facades',
    span: 'lg:col-span-2 lg:row-span-2',
  },
  {
    src: 'https://images.pexels.com/photos/6821513/pexels-photo-6821513.jpeg?auto=compress&cs=tinysrgb&w=940&h=650',
    alt: 'Modern glass staircase with metal handrail',
    title: 'Glass Staircase',
    category: 'Railings',
    span: '',
  },
  {
    src: 'https://images.pexels.com/photos/5483051/pexels-photo-5483051.jpeg?auto=compress&cs=tinysrgb&w=940&h=650',
    alt: 'Office with glass partition walls',
    title: 'Glass Partitions',
    category: 'Partitions',
    span: '',
  },
  {
    src: 'https://images.pexels.com/photos/32367382/pexels-photo-32367382.jpeg?auto=compress&cs=tinysrgb&w=940&h=650',
    alt: 'Modern storefront with large glass windows',
    title: 'Commercial Storefront',
    category: 'Storefronts',
    span: '',
  },
  {
    src: 'https://images.pexels.com/photos/1190902/pexels-photo-1190902.jpeg?auto=compress&cs=tinysrgb&w=940&h=650',
    alt: 'Contemporary staircase with glass railings',
    title: 'Frameless Railings',
    category: 'Railings',
    span: '',
  },
  {
    src: 'https://images.pexels.com/photos/37320179/pexels-photo-37320179.jpeg?auto=compress&cs=tinysrgb&w=940&h=650',
    alt: 'Glass skyscraper reflecting blue sky',
    title: 'Curtain Wall System',
    category: 'Facades',
    span: 'lg:col-span-2',
  },
];

export default function Gallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <section id="gallery" className="relative bg-charcoal-900 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header */}
        <div className="reveal mb-16 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ice-400">
              Our Work
            </span>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Gallery Showcase
            </h2>
            <p className="mt-4 text-base leading-relaxed text-aluminum-300 lg:text-lg">
              A selection of our recent aluminum and glass installations across
              residential and commercial projects.
            </p>
          </div>
        </div>

        {/* Gallery grid */}
        <div className="grid auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {galleryItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setLightbox(index)}
              className={`reveal reveal-delay-${(index % 5) + 1} group relative overflow-hidden rounded-xl ${item.span}`}
            >
              <img
                src={item.src}
                alt={item.alt}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/10 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-90" />
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 p-5 text-left">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ice-300 opacity-0 transition-all duration-500 group-hover:opacity-100">
                  {item.category}
                </span>
                <h3 className="text-sm font-semibold text-white opacity-0 transition-all duration-500 group-hover:opacity-100 sm:text-base">
                  {item.title}
                </h3>
              </div>
              {/* Border ring on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-ice-400/0 transition-all duration-500 group-hover:ring-ice-400/40" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal-950/90 p-6 backdrop-blur-sm animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <X size={24} />
          </button>
          <div
            className="relative max-h-[85vh] max-w-5xl overflow-hidden rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryItems[lightbox].src}
              alt={galleryItems[lightbox].alt}
              className="max-h-[85vh] w-full object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-charcoal-950/95 to-transparent p-6">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-ice-300">
                {galleryItems[lightbox].category}
              </span>
              <h3 className="mt-1 text-lg font-semibold text-white">
                {galleryItems[lightbox].title}
              </h3>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

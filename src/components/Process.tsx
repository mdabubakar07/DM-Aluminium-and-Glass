import { ClipboardList, Hammer, Wrench, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: ClipboardList,
    number: '01',
    title: 'Consultation',
    description:
      'We start with an on-site visit to understand your vision, take precise measurements, and assess structural requirements. You receive a detailed proposal with material specifications and a transparent quote.',
    features: ['Site assessment', 'Material selection', 'Detailed quote'],
  },
  {
    icon: Hammer,
    number: '02',
    title: 'Fabrication',
    description:
      'Our master fabricators craft every component in-house using premium-grade aluminum and glass. CNC precision cutting, welding, and finishing ensure each piece meets our exacting standards.',
    features: ['CNC precision cutting', 'In-house welding', 'Quality control'],
  },
  {
    icon: Wrench,
    number: '03',
    title: 'Expert Installation',
    description:
      'Our certified installation team handles delivery, fitting, and sealing with meticulous attention to detail. We test every mechanism and leave your space clean, polished, and ready to use.',
    features: ['Certified installers', 'Precision fitting', 'Final inspection'],
  },
];

export default function Process() {
  return (
    <section id="process" className="relative bg-charcoal-950 py-24 lg:py-32">
      {/* Subtle metallic texture overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-charcoal-900/50 via-transparent to-charcoal-900/50" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header */}
        <div className="reveal mb-16 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ice-400">
            How We Work
          </span>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Our Process
          </h2>
          <p className="mt-4 text-base leading-relaxed text-aluminum-300 lg:text-lg">
            A streamlined, transparent workflow from first conversation to final
            installation — no surprises, just precision.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className={`reveal reveal-delay-${index + 1} relative`}
              >
                {/* Connector line (desktop) */}
                {index < steps.length - 1 && (
                  <div className="absolute right-[-1rem] top-12 hidden h-px w-8 bg-gradient-to-r from-ice-400/40 to-transparent lg:block" />
                )}

                <div className="group h-full rounded-xl border border-white/5 bg-charcoal-800/50 p-8 transition-all duration-500 hover:border-ice-400/30 hover:bg-charcoal-800">
                  {/* Step number + icon */}
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-charcoal-700 to-charcoal-900 ring-1 ring-ice-400/20 transition-all duration-300 group-hover:ring-ice-400/50">
                      <Icon size={26} className="text-ice-300" />
                    </div>
                    <span className="text-4xl font-bold text-charcoal-600 transition-colors group-hover:text-charcoal-500">
                      {step.number}
                    </span>
                  </div>

                  {/* Title + description */}
                  <h3 className="text-xl font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-aluminum-300">
                    {step.description}
                  </p>

                  {/* Features */}
                  <ul className="mt-6 space-y-2">
                    {step.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-aluminum-200"
                      >
                        <ArrowRight size={14} className="text-ice-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

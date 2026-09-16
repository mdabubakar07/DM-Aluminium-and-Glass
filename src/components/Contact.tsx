import { useState, type FormEvent } from 'react';
import { MapPin, Clock, Phone, Send, CheckCircle2, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { saveCustomerLead } from '@/lib/firebase';

const projectTypes = [
  'Aluminium Fabrication',
  'Tuffen Glass & Sliding Door',
  'Aluminium Window & UPVC',
  'Railing',
  'Welding',
  'Steel Fitting',
  'Interior Works',
  'Other / Not Sure Yet',
];

const SHOP_ADDRESS = 'Beside Grama Panchayat, Devanpally, Kamareddy — 503 111';
const MAPS_QUERY = encodeURIComponent('Grama Panchayat, Devanpally, Kamareddy, Telangana 503111');
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;
const MAPS_EMBED_URL = 'https://www.openstreetmap.org/export/embed.html?bbox=78.3050%2C18.5230%2C78.3700%2C18.5600&layer=mapnik&marker=18.5415%2C78.3360';

const contacts = [
  { icon: Phone, label: 'Babumiya', value: '6302072336', href: 'tel:+916302072336' },
  { icon: Phone, label: 'Dawood', value: '7989155621', href: 'tel:+917989155621' },
  { icon: Phone, label: 'Farid', value: '9065578414', href: 'tel:+919065578414' },
];

const contactInfo = [
  {
    icon: MapPin,
    label: 'Location',
    value: SHOP_ADDRESS,
    href: MAPS_LINK,
  },
  {
    icon: Clock,
    label: 'Hours',
    value: 'Mon–Sat: 9:00 AM – 7:00 PM\nSun: Closed',
  },
];

type FormState = {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  message: string;
};

const initialForm: FormState = {
  name: '',
  email: '',
  phone: '',
  projectType: '',
  message: '',
};

export default function Contact() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.name === 'phone'
      ? e.target.value.replace(/\D/g, '').slice(0, 10)
      : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    if (!/^\d{10}$/.test(form.phone)) {
      setStatus('error');
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      await saveCustomerLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        projectType: form.projectType,
        message: form.message,
      });

      setStatus('success');
      setForm(initialForm);
    } catch {
      setStatus('error');
      setErrorMsg('Could not submit your request. Please try again or call us directly.');
    }
  };

  const inputClasses =
    'w-full rounded-lg border border-white/10 bg-charcoal-800 px-4 py-3 text-sm text-white placeholder-aluminum-400 transition-colors focus:border-ice-400 focus:outline-none focus:ring-1 focus:ring-ice-400';

  return (
    <section id="contact" className="relative bg-charcoal-950 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header */}
        <div className="reveal mb-16 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ice-400">
            Get In Touch
          </span>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Contact &amp; Location
          </h2>
          <p className="mt-4 text-base leading-relaxed text-aluminum-300 lg:text-lg">
            Ready to start your project? Call us directly or send a message.
            We respond to all inquiries within one business day.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
          {/* Contact info — left column (2/5) */}
          <div className="reveal lg:col-span-2">
            <div className="rounded-xl border border-white/5 bg-charcoal-800/50 p-8 [transform:perspective(1000px)_rotateX(1deg)] transition-transform duration-500 hover:[transform:perspective(1000px)_rotateX(0deg)]">
              <h3 className="text-lg font-semibold text-white">
                DM Aluminium &amp; Glass
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-aluminum-300">
                Beside Grama Panchayat, Devanpally, Kamareddy. Visit our shop
                or call us directly — we're here to help with your aluminium and
                glass needs.
              </p>

              {/* Direct phone contacts */}
              <div className="mt-8 space-y-4">
                {contacts.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className="group flex items-center gap-4 rounded-lg border border-white/5 bg-charcoal-900/50 p-3 transition-all duration-300 hover:border-ice-400/30 hover:bg-charcoal-900"
                    >
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-ice-500/10 ring-1 ring-ice-400/20 transition-all group-hover:bg-ice-500/20">
                        <Icon size={20} className="text-ice-300" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-aluminum-400">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-white transition-colors group-hover:text-ice-200">
                          {item.value}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>

              {/* Location & hours */}
              <div className="mt-4 space-y-4">
                {contactInfo.map((item) => {
                  const Icon = item.icon;
                  const content = (
                    <>
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-charcoal-900 ring-1 ring-ice-400/20">
                        <Icon size={20} className="text-ice-300" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-aluminum-400">
                          {item.label}
                        </p>
                        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-aluminum-100">
                          {item.value}
                        </p>
                      </div>
                      {item.href && (
                        <ExternalLink
                          size={16}
                          className="flex-shrink-0 text-ice-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      )}
                    </>
                  );
                  return item.href ? (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-charcoal-900/50"
                    >
                      {content}
                    </a>
                  ) : (
                    <div key={item.label} className="flex items-start gap-4 p-3">
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Google Maps embed + open link */}
            <div className="mt-6 overflow-hidden rounded-xl border border-white/5">
              <div className="relative h-56 bg-charcoal-800">
                <iframe
                  title="DM Aluminium & Glass location map"
                  src={MAPS_EMBED_URL}
                  className="h-full w-full"
                  style={{ filter: 'grayscale(0.3) contrast(1.1) brightness(0.8)' }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-charcoal-800 py-3 text-sm font-semibold text-ice-300 transition-colors hover:bg-charcoal-700 hover:text-ice-200"
              >
                <MapPin size={16} />
                Open in Google Maps
              </a>
            </div>
          </div>

          {/* Contact form — right column (3/5) */}
          <div className="reveal reveal-delay-1 lg:col-span-3">
            <div className="rounded-xl border border-white/5 bg-charcoal-800/50 p-8">
              {status === 'success' ? (
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ice-500/15 ring-1 ring-ice-400/30">
                    <CheckCircle2 size={32} className="text-ice-300" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-white">
                    Message Sent Successfully
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-aluminum-300">
                    Thank you for reaching out. Our team will review your project
                    details and get back to you within one business day.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="mt-8 rounded-md border border-aluminum-400/30 px-5 py-2.5 text-sm font-semibold text-aluminum-100 transition-colors hover:border-ice-300/50 hover:text-white"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-aluminum-300"
                      >
                        Full Name *
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-aluminum-300"
                      >
                        Email *
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="john@email.com"
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-aluminum-300"
                      >
                        Phone *
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        required
                        maxLength={10}
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Your phone number"
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="projectType"
                        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-aluminum-300"
                      >
                        Project Type
                      </label>
                      <select
                        id="projectType"
                        name="projectType"
                        value={form.projectType}
                        onChange={handleChange}
                        className={inputClasses}
                      >
                        <option value="">Select a service...</option>
                        {projectTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wider text-aluminum-300"
                    >
                      Project Details (Optional)
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us about your project — dimensions, timeline, location, and any specific requirements."
                      className={`${inputClasses} resize-none`}
                    />
                  </div>

                  {/* Error message */}
                  {status === 'error' && (
                    <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                      <AlertCircle size={20} className="flex-shrink-0 text-red-400" />
                      <p className="text-sm text-red-200">{errorMsg}</p>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="group flex w-full items-center justify-center gap-2 rounded-md bg-ice-500 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-ice-500/20 transition-all duration-300 hover:bg-ice-400 hover:shadow-xl hover:shadow-ice-400/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === 'submitting' ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send
                          size={16}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

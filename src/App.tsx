import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Process from '@/components/Process';
import Gallery from '@/components/Gallery';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import FloatingContact from '@/components/FloatingContact';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useAuth } from '@/context/AuthContext';

function PublicSite() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-charcoal-950 font-sans text-white antialiased">
      <Header />
      <main>
        <Hero />
        <Services />
        <Process />
        <Gallery />
        <Contact />
      </main>
      <Footer />
      <FloatingContact />
    </div>
  );
}

function AdminArea() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-charcoal-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ice-400 border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
}

function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const isAdminRoute = route.startsWith('#admin');

  if (isAdminRoute) {
    return <AdminArea />;
  }

  return <PublicSite />;
}

export default App;

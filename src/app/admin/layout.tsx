'use client';
import React, { useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

// Componente de layout para la página de administración
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = React.useState<boolean | null>(null);

  useEffect(() => {
    const userData = Cookies.get('user');
    const authTimeout = setTimeout(() => {
      if (!userData) {
        setAuthorized(false);
        router.replace('/');
        return;
      }
      try {
        const user = JSON.parse(userData);
        const role = typeof user === 'string' ? null : user.role;
        if (role !== 'admin') {
          setAuthorized(false);
          router.replace('/');
          return;
        }
        setAuthorized(true);
      } catch {
        setAuthorized(false);
        router.replace('/');
      }
    }, 0);
    return () => clearTimeout(authTimeout);
  }, [router]);

  // Hasta que conozcamos el estado de autorización, no renderizar nada (evita que se cargue contenido admin)
  if (authorized !== true) return null;

  return <div>{children}</div>;
}

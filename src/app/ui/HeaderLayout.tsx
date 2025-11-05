'use client';
// Importa el hook para obtener la ruta actual
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import LoginButton from './LoginButton';
import Button from './Button';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';

// Componente funcional HeaderLayout
const HeaderLayout: React.FC = () => {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const capitalize = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Efecto para inicializar y actualizar el nombre de usuario
  useEffect(() => {
    const mountTimeout = setTimeout(() => setMounted(true), 0);
    // Función para actualizar el nombre de usuario desde las cookies
    const updateUserName = () => {
      const userData = Cookies.get('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          // user may be an object { user, role }
          if (typeof user === 'string') {
            setUserName(user);
            setRole(null);
          } else {
            setUserName(user.user || null);
            setRole(user.role || null);
          }
        } catch {
          setUserName(null);
          setRole(null);
        }
      } else {
        setUserName(null);
        setRole(null);
      }
    };
    updateUserName();
    window.addEventListener('visibilitychange', updateUserName);
    const interval = setInterval(updateUserName, 500);
    return () => {
      window.removeEventListener('visibilitychange', updateUserName);
      clearInterval(interval);
      clearTimeout(mountTimeout);
    };
  }, []);

  if (!mounted) return null;
  const navLinkClass =
    'cursor-pointer font-semibold text-base tracking-wide text-[#eaeaea] px-4 py-2 transition-colors duration-200 inline-block rounded-lg hover:bg-[#23272e]/80 hover:shadow-lg';
  // Renderiza el header con el nombre de usuario, el botón de login y el boton calculadora
  return (
    <header className="relative flex items-center p-4 w-full bg-[#1e1e1e]">
      {/* Botón de inicio arriba a la izquierda, oculto solo en la página de inicio */}
      {pathname !== '/' && (
        <Button
          href="/"
          variant="ghost"
          className="p-0 rounded hover:opacity-90 transition flex items-center"
          aria-label="Ir al inicio"
        >
          <img
            src="/original-logo.jpg"
            alt="Inicio"
            className="w-28 h-auto object-contain"
          />
        </Button>
      )}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
        <Link
          href="/calculadora"
          className={navLinkClass}
          style={{ letterSpacing: '0.03em' }}
        >
          Calculadora
        </Link>
        {role === 'admin' && (
          <Link
            href="/admin"
            role="link"
            aria-label="Ir a admin"
            className={`${navLinkClass} ml-2`}
          >
            Admin
          </Link>
        )}
      </div>
      <div className="ml-auto flex items-center gap-4">
        <span className="text-white font-bold">
          {userName
            ? `${capitalize('bienvenido')} ${capitalize(userName)}`
            : ''}
        </span>
        {pathname !== '/login' &&
          (userName ? (
            <Button
              onClick={() => {
                Cookies.remove('logged');
                Cookies.remove('user');
                setUserName(null);
                setTimeout(() => window.location.reload(), 100);
              }}
              variant="danger"
            >
              Desconectarse
            </Button>
          ) : (
            <LoginButton />
          ))}
      </div>
    </header>
  );
};

export default HeaderLayout;

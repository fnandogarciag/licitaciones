"use client";
// Importa el hook para obtener la ruta actual
import { usePathname } from 'next/navigation';
import LoginButton from './LoginButton';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';

// Componente funcional HeaderLayout
const HeaderLayout: React.FC = () => {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = require('next/navigation').useRouter();

  const capitalize = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Efecto para inicializar y actualizar el nombre de usuario
  useEffect(() => {
    setMounted(true);
    // Función para actualizar el nombre de usuario desde las cookies
    const updateUserName = () => {
      const userData = Cookies.get('user'); 
      if (userData) {
        try {
          const user = JSON.parse(userData); 
          setUserName(user.user); 
        } catch {}
      } else {
        setUserName(null); 
      }
    };
    updateUserName(); 
    window.addEventListener('visibilitychange', updateUserName); 
    const interval = setInterval(updateUserName, 500); 
    return () => {
      window.removeEventListener('visibilitychange', updateUserName); 
      clearInterval(interval); 
    };
  }, []);

  if (!mounted) return null;
  // Renderiza el header con el nombre de usuario, el botón de login y el boton calculadora
  return (
    <header className="relative flex items-center p-4 w-full bg-[#1e1e1e]">
      {/* Botón de inicio arriba a la izquierda, oculto solo en la página de inicio */}
      {pathname !== '/' && (
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition font-bold"
          onClick={() => router.push('/')}
        >
          Inicio
        </button>
      )}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <span
          className="cursor-pointer font-semibold text-base tracking-wide text-[#eaeaea] px-4 py-2 transition-colors duration-200 relative inline-block rounded-lg hover:bg-[#23272e]/80 hover:shadow-lg"
          style={{ letterSpacing: '0.03em' }}
          onClick={() => router.push('/calculadora')}
        >
          Calculadora
        </span>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <span className="text-white font-bold">
          {userName ? `${capitalize('bienvenido')} ${capitalize(userName)}` : ''}
        </span>
        {pathname !== '/login' && (
          userName ? (
            <button
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              onClick={() => {
                Cookies.remove('logged');
                Cookies.remove('user');
                setUserName(null);
                setTimeout(() => window.location.reload(), 100);
              }}
            >
              Desconectarse
            </button>
          ) : (
            <LoginButton />
          )
        )}
      </div>
    </header>
  );
};

export default HeaderLayout;

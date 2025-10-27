'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Button from './Button';

// Componente funcional LoginButton
const LoginButton: React.FC = () => {
  const [logged, setLogged] = useState(false);

  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Efecto para inicializar estados al montar el componente
  useEffect(() => {
    const stored = Cookies.get('logged');
    const mountTimeout = setTimeout(() => {
      setMounted(true);
      if (stored === 'true') setLogged(true);
    }, 0);
    return () => clearTimeout(mountTimeout);
  }, []);

  // Función para redirigir al login
  const handleLogin = () => {
    router.push('/login');
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    setLogged(false);
    Cookies.remove('logged');
    Cookies.remove('user');
    setTimeout(() => window.location.reload(), 100);
  };

  // Si el componente no está montado, no renderiza nada
  if (!mounted) return null;
  // Si el usuario está logueado, muestra el botón de desconexión
  if (logged) {
    return (
      <Button variant="primary" onClick={handleLogout}>
        Desconectarse
      </Button>
    );
  }

  // Si no está logueado, muestra el botón de login
  return (
    <Button variant="primary" onClick={handleLogin}>
      Login
    </Button>
  );
};

export default LoginButton;

"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

// Componente funcional LoginButton
const LoginButton: React.FC = () => {
  const [logged, setLogged] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Efecto para inicializar estados al montar el componente
  useEffect(() => {
    setMounted(true); 
    const stored = Cookies.get('logged'); // Obtiene el estado de login de las cookies
    if (stored === 'true') setLogged(true); // Si está logueado, actualiza el estado
    const userData = Cookies.get('user');
    if (userData) {
      try {
        const user = JSON.parse(userData); 
        setUserName(user.nombre); 
      } catch {}
    } else {
      setUserName(null); 
    }
  }, [logged]);

  // Función para redirigir al login
  const handleLogin = () => {
    router.push('/login');
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    setLogged(false);
    setUserName(null);
    Cookies.remove('logged');
    Cookies.remove('user');
    setTimeout(() => window.location.reload(), 100);
  };

  // Si el componente no está montado, no renderiza nada
  if (!mounted) return null;
  // Si el usuario está logueado, muestra el botón de desconexión
  if (logged) {
    return (
      <button
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        onClick={handleLogout}
      >
        Desconectarse
      </button>
    );
  }

  // Si no está logueado, muestra el botón de login
  return (
    <button
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      onClick={handleLogin}
    >
      Login
    </button>
  );
};

export default LoginButton;

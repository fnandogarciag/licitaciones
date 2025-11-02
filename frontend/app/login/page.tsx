'use client';
import React, { useState } from 'react';
import Cookies from 'js-cookie';
import Button from '@/app/ui/Button';
import { useRouter } from 'next/navigation';

// Componente funcional para la página de login
export default function LoginPage() {
  // Hook para navegar entre páginas
  const router = useRouter();
  // Estado para el usuario, contraseña y error
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirigir si el usuario ya está logueado usando useEffect
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLogged = Cookies.get('logged');
      if (isLogged === 'true') {
        router.push('/');
      }
    }
  }, [router]);

  // Función para manejar el envío del formulario
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      // Realiza la petición al endpoint de login
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: usuario, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Cookies.set('logged', 'true', { expires: 7 });
        // data.user now contains { user, role }
        Cookies.set('user', JSON.stringify(data.user), { expires: 7 });
        router.push('/');
      } else {
        setError(data.error || 'Usuario o contraseña incorrectos');
      }
    } catch {
      setError('Error de conexión');
    }
  };
  // Renderiza el formulario de login
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      {/* Contenedor del formulario */}
      <div className="bg-transparent p-8 rounded-lg shadow-md w-full max-w-md flex flex-col items-center">
        {/* Título */}
        <h1 className="text-2xl font-bold mb-6 text-white">LOGEATE</h1>
        {/* Formulario de login */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {/* Campo usuario */}
          <div className="flex flex-col">
            <label htmlFor="usuario" className="mb-1 font-medium text-white">
              Usuario:
            </label>
            <input
              type="text"
              id="usuario"
              name="usuario"
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="border border-white bg-transparent text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white"
            />
          </div>
          {/* Campo contraseña */}
          <div className="flex flex-col">
            <label htmlFor="password" className="mb-1 font-medium text-white">
              Password:
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-white bg-transparent text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white w-full pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 px-2 py-1 text-white"
                aria-label={
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </Button>
            </div>
          </div>
          {/* Botón de login */}
          <Button type="submit" variant="primary">
            Login
          </Button>
          {/* Mensaje de error */}
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </form>
      </div>
    </div>
  );
}

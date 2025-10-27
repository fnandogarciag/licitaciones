/* eslint-disable no-console -- registros mínimos en rutas API del servidor para debugging */
// Importa los tipos y utilidades de Next.js para rutas API, el módulo de sistema de archivos
// y el módulo para manejar rutas de archivos
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Función que maneja el método POST para el login
export async function POST(req: NextRequest) {
  // Parse defensivo: leer el texto bruto primero para poder registrar errores de parseo
  let user: string | undefined;
  let password: string | undefined;
  try {
    const raw = await req.text();
    // Registro de depuración útil en los logs del contenedor si llega JSON malformado
    // (mantenerlo mínimo para evitar filtrar datos sensibles en flujos normales)
    if (!raw || raw.length === 0) {
      // cuerpo vacío
      console.error('[login] cuerpo de la petición vacío');
    }
    try {
      const parsed = raw ? JSON.parse(raw) : {};
      user = parsed.user;
      password = parsed.password;
    } catch (err) {
      console.error('[login] error al parsear JSON:', err, 'rawBody=', raw);
      return NextResponse.json(
        { error: 'JSON malformado en el cuerpo de la petición' },
        { status: 400 },
      );
    }
  } catch (err) {
    console.error('[login] error al leer el cuerpo de la petición:', err);
    return NextResponse.json(
      { error: 'Error al leer el cuerpo de la petición' },
      { status: 400 },
    );
  }
  const filePath = path.join(process.cwd(), 'apiUsers.json');
  let users: Array<{ user: string; password: string; role?: string }> = [];
  if (fs.existsSync(filePath)) {
    users = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  const found = users.find((u) => u.user === user && u.password === password);
  if (!found) {
    return NextResponse.json(
      { error: 'Usuario o contraseña incorrectos' },
      { status: 401 },
    );
  }
  // Devolver el nombre de usuario y el rol para que el frontend pueda almacenarlo en cookies
  return NextResponse.json({
    success: true,
    user: { user: found.user, role: found.role },
  });
}

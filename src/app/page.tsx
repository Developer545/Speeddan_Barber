import { redirect } from 'next/navigation';

// Redirigir raíz al dashboard (si autenticado) o login
export default function RootPage() {
  redirect('/dashboard');
}

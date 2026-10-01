import { LoadingFile } from '../personas/FileStatus'

// Pantalla completa de carga mientras se verifica la sesión
export default function FullPageLoader({ text = 'Verificando sesión...' }) {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background">
      <LoadingFile text={text} />
    </div>
  )
}

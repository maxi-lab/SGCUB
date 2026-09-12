import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      textAlign: 'center', 
      gap: '20px',
      fontFamily: 'var(--sans, system-ui, sans-serif)'
    }}>
      <h1 style={{ margin: 0, fontSize: '3rem' }}>404</h1>
      <h2 style={{ margin: 0, fontWeight: 'normal' }}>Página no encontrada</h2>
      <p style={{ color: 'var(--text-muted, #666)' }}>
        La ruta a la que intentas acceder no existe o fue movida.
      </p>
      <Link 
        to="/" 
        style={{ 
          padding: '10px 24px', 
          backgroundColor: 'var(--accent, #007bff)', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '6px', 
          fontWeight: '500',
          marginTop: '10px'
        }}
      >
        Volver a la página principal
      </Link>
    </div>
  );
}


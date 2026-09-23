import "./header.css";

export default function Header({ collapsed = false }) {
  return (
    <header className={`app-header fixed top-0 right-0 bg-surface-container-lowest border-b border-outline-variant/30 z-40 flex flex-row flex-nowrap items-center px-6 ${collapsed ? 'app-header--collapsed' : ''}`}>
      
      <div className="app-header-search min-w-0 flex-1">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-outline text-[20px]">search</span>
          <input 
            className="w-full h-10 pl-10 pr-20 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors" 
            placeholder="Buscar por DNI, Nombre, Apellido o N° de Socio..." 
            type="text" 
          />
        </div>
      </div>

      <div className="app-header-actions ml-auto flex shrink-0 items-center gap-4">
        <button className="relative p-2 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[20px]">notifications</span>

          {/* Aca el uno habria que cambiarlo por un valor real o eliminar la notificacion */}

          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-on-error font-label-sm text-[10px] font-bold">1</span>
        </button>
        
        <div className="h-6 w-px bg-outline-variant/30"></div>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[20px]">person</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-label-lg text-label-lg text-on-surface font-semibold leading-tight">Alvite Damián</span>
            <span className="font-label-sm text-label-sm text-primary font-medium">Administrativo</span>
          </div>
        </div>
        
        <div className="h-6 w-px bg-outline-variant/30"></div>
        
        <button className="flex items-center gap-1 p-2 rounded text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors" title="Cerrar sesión">
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="font-label-sm text-label-sm">Salir</span>
        </button>
      </div>

    </header>
  );
}
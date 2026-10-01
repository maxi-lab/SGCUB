export default function AuthCard({ title = 'SGCUB', subtitle = 'Sistema de Gestión Interna', children }) {
  return (
    <main className="w-full min-h-screen flex items-center justify-center p-space-lg bg-background">
      <div className="flex flex-col w-full items-center justify-center py-space-xl px-space-md min-h-[calc(100vh-4rem)]">
        <div className="relative w-full max-w-md">
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-secondary-container/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative bg-surface-container-lowest rounded-xl shadow-2xl p-space-xl flex flex-col items-center">
            <div className="flex flex-col items-center text-center w-full mb-space-lg">
              <div className="relative mb-space-md group">
                <div className="absolute inset-0 bg-primary-container/20 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                <img
                  alt="Club Universitario de Berisso"
                  className="relative w-24 h-24 object-contain drop-shadow-md transition-transform duration-300 transform group-hover:scale-105"
                  src="/escudo-sin-fondo.png"
                />
              </div>
              <h1 className="text-display-md font-display-md text-on-surface tracking-tight leading-none mb-1">{title}</h1>
              <p className="text-xl text-body-sm font-body-sm text-on-surface-variant font-medium">{subtitle}</p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </main>
  )
}

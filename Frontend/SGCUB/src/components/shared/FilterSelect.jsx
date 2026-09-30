// Select de las barras de filtros. La flecha nativa queda pegada al borde e ignora el padding,
// así que se oculta (appearance-none) y se dibuja una propia con margen a la derecha.
export default function FilterSelect({ className = '', children, ...props }) {
  return (
    <div className="relative w-full sm:w-auto min-w-0 max-w-full">
      <select className={`w-full h-10 pl-3 pr-9 appearance-none ${className}`} {...props}>
        {children}
      </select>
      {/* Tamaño en línea: la hoja de Google Fonts fija 24px y le gana a las clases text-[..] de Tailwind. */}
      <span
        className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
        style={{ fontSize: 18 }}
        aria-hidden="true"
      >
        expand_more
      </span>
    </div>
  )
}

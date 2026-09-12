import CommonLayout from './CommonLayout'

export default function PadronLayout() {
  const getSectionName = (pathname) => {
    if (pathname.includes('/jugadores')) return 'Jugadores'
    if (pathname.includes('/categorias')) return 'Categorías'
    if (pathname.includes('/docentes')) return 'Docentes'
    return 'Socios'
  }

  return (
    <CommonLayout 
      moduleName="Padrón" 
      getSectionName={getSectionName} 
      defaultDescription="Gestión del padrón de socios"
    />
  )
}

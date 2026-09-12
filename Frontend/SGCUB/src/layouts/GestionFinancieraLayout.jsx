import CommonLayout from './CommonLayout'

export default function GestionFinancieraLayout() {
  const getSectionName = (pathname) => {
    if (pathname.includes('/ingresos')) return 'Ingresos'
    if (pathname.includes('/egresos')) return 'Egresos'
    if (pathname.includes('/caja')) return 'Caja'
    if (pathname.includes('/cuentas-corrientes')) return 'Cuentas Corrientes'
    if (pathname.includes('/reportes')) return 'Reportes'
    return 'Resumen' // Sección por defecto
  }

  return (
    <CommonLayout 
      moduleName="Gestión Financiera" 
      getSectionName={getSectionName} 
      defaultDescription="Gestión de finanzas y tesorería"
    />
  )
}

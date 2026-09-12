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

  const getSectionDescription = (pathname) => {
    if (pathname.includes('/ingresos')) return 'Registro y control de cobros e ingresos'
    if (pathname.includes('/egresos')) return 'Registro y control de gastos y pagos'
    if (pathname.includes('/caja')) return 'Control de caja fuerte y movimientos diarios'
    if (pathname.includes('/cuentas-corrientes')) return 'Gestión de deudas y cuentas corrientes de socios'
    if (pathname.includes('/reportes')) return 'Generación de reportes y balances financieros'
    return 'Vista general del estado financiero y cobro de cuotas' // Para resumen o por defecto
  }

  return (
    <CommonLayout 
      moduleName="Gestión Financiera" 
      getSectionName={getSectionName} 
      getSectionDescription={getSectionDescription}
      defaultDescription="Control de finanzas, tesorería y recaudación"
    />
  )
}

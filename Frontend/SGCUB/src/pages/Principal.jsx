import useDashboard from '../hooks/useDashboard'
import DocumentSummarySection from '../components/dashboard/DocumentSummarySection'
import FinancialKpiSection from '../components/dashboard/FinancialKpiSection'
import ProcessStatusSection from '../components/dashboard/ProcessStatusSection'

/**
 * Dashboard home page — replaces the static Principal placeholder.
 *
 * Layout:
 *   1. Financial KPI section  (4 cards)
 *   2. Bottom two-column grid
 *      └─ DocumentSummarySection  (5 cols)
 *      └─ ProcessStatusSection    (7 cols)
 */
export default function Principal() {
  const {
    isLoading,
    mesLabel,
    totalRecaudadoMes,
    sociosEnMora,
    montoAdeudadoTotal,
    cuotasVencidas,
    totalSociosActivos,
    vencidos,
    proximosAVencer,
    getNombreTipo,
  } = useDashboard()

  return (
    <div className="flex flex-col w-full gap-space-lg pb-space-xl">

      {/* 1. Financial KPIs */}
      <FinancialKpiSection
        isLoading={isLoading}
        mesLabel={mesLabel}
        totalRecaudadoMes={totalRecaudadoMes}
        sociosEnMora={sociosEnMora}
        montoAdeudadoTotal={montoAdeudadoTotal}
        cuotasVencidas={cuotasVencidas}
        totalSociosActivos={totalSociosActivos}
      />

      {/* 2. Bottom two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        <DocumentSummarySection
          isLoading={isLoading}
          vencidos={vencidos}
          proximosAVencer={proximosAVencer}
          getNombreTipo={getNombreTipo}
        />
        <ProcessStatusSection />
      </div>

    </div>
  )
}

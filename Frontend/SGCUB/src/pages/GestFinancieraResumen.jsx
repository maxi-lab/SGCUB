import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

// Datos enfocados en la gestión de cuotas de socios
const dataRecaudacion = [
  { mes: 'Ene', esperado: 500000, cobrado: 480000 },
  { mes: 'Feb', esperado: 500000, cobrado: 450000 },
  { mes: 'Mar', esperado: 550000, cobrado: 520000 },
  { mes: 'Abr', esperado: 550000, cobrado: 510000 },
  { mes: 'May', esperado: 550000, cobrado: 540000 },
  { mes: 'Jun', esperado: 600000, cobrado: 580000 },
  { mes: 'Jul', esperado: 600000, cobrado: 420000 }, // Mes en curso
];

const estadoCuotas = [
  { name: 'Al día (Pagadas)', value: 850 },
  { name: 'Pendientes (Mes en curso)', value: 120 },
  { name: 'Morosos (Vencidas)', value: 30 },
];

const ESTADO_COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Verde, Amarillo, Rojo

// Formateador de moneda para los tooltips y ejes
const formatCurrency = (value) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

export default function GestFinancieraResumen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '24px' }}>
      
      {/* Tarjetas de Resumen (KPIs) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* KPI 1 */}
        <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Recaudación de Julio
            </h3>
            <i className="bi bi-cash-stack" style={{ fontSize: '20px', color: '#10b981' }}></i>
          </div>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>
            $420.000
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b' }}>
            <span style={{ color: '#f59e0b', fontWeight: '600' }}>70%</span> del objetivo mensual ($600k)
          </p>
        </div>

        {/* KPI 2 */}
        <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Estado de Socios
            </h3>
            <i className="bi bi-people-fill" style={{ fontSize: '20px', color: '#3b82f6' }}></i>
          </div>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>
            85%
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b' }}>
            <span style={{ color: '#10b981', fontWeight: '600' }}>850</span> socios al día de 1000 activos
          </p>
        </div>

        {/* KPI 3 */}
        <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Deuda Estimada
            </h3>
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '20px', color: '#ef4444' }}></i>
          </div>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
            $45.000
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b' }}>
            Perteneciente a <span style={{ fontWeight: '600', color: '#ef4444' }}>30</span> socios morosos
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Gráfico 1: Evolución de Cobranza */}
        <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #f1f5f9' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0f172a' }}>Evolución de Recaudación</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Cuotas cobradas vs. padrón esperado</p>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={dataRecaudacion} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCobrado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '14px', color: '#475569' }} />
                <Area type="monotone" dataKey="esperado" name="Padrón Esperado" stroke="#94a3b8" strokeDasharray="5 5" fill="none" strokeWidth={2} />
                <Area type="monotone" dataKey="cobrado" name="Total Cobrado" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCobrado)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Estado de las Cuotas (Torta) */}
        <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #f1f5f9' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0f172a' }}>Estado de Cuotas</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Distribución del padrón actual</p>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={estadoCuotas}
                  cx="50%"
                  cy="45%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {estadoCuotas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ESTADO_COLORS[index % ESTADO_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} Socios`, 'Cantidad']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '14px', color: '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

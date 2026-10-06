// src/layouts/MainLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/main/Sidebar';
import Header from '../components/main/Header';
import RegisterPaymentProvider from '../components/finanzas/RegisterPaymentProvider';
import './main-layout.css';

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <RegisterPaymentProvider>
      <div className={`main-layout ${sidebarCollapsed ? 'main-layout--collapsed' : ''}`}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
        <div className="main-layout-content">
          <Header collapsed={sidebarCollapsed} />
          <main className="main-layout-main">
            <Outlet />
          </main>
        </div>
      </div>
    </RegisterPaymentProvider>
  );
}
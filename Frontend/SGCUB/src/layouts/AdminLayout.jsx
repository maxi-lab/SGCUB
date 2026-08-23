import {Outlet} from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className="admin-container" style={{ display: 'flex' }}>
      {/* <Sidebar /> */}
      <div className="main-content" style={{ flex: 1 }}>
        {/*<Topbar />*/}
        {/* <Outlet /> es el "agujero" donde renderizarán las Pages */}
        <main style={{ padding: '20px' }}>
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}

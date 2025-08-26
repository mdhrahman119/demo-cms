// src/components/MainLayout.tsx

import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { roleConfig } from '../config/roleConfig'; // Import our new config

const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get the navLinks for the current user's role from our blueprint
  const userNavLinks = user?.role?.name ? roleConfig[user.role.name]?.navLinks : [];

  // Group links by their section for display
  const groupedLinks = userNavLinks?.reduce((acc, link) => {
    acc[link.section] = [...(acc[link.section] || []), link];
    return acc;
  }, {} as Record<string, typeof userNavLinks>);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out`}>
        <a href="#" className="text-white text-2xl font-semibold uppercase hover:text-gray-300 px-4">Clinic CMS</a>
        <nav>
          <Link to="/" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white">Dashboard</Link>
          
          {/* === DYNAMIC ROLE-BASED SIDEBAR LINKS === */}

          {/* Super Admin Links */}
          {user?.is_superadmin && (
            <>
              <div className="px-4 py-2 mt-4"><span className="text-xs font-semibold text-gray-400 uppercase">Platform</span></div>
              <Link to="/superadmin" className="block py-2.5 px-4 rounded hover:bg-gray-700">Manage Clinics</Link>
            </>
          )}

          {/* Dynamically generate links for other roles */}
          {groupedLinks && Object.entries(groupedLinks).map(([section, links]) => (
            <div key={section}>
              <div className="px-4 py-2 mt-4"><span className="text-xs font-semibold text-gray-400 uppercase">{section}</span></div>
              {links.map(link => (
                <Link key={link.path} to={link.path} className="block py-2.5 px-4 rounded hover:bg-gray-700">{link.name}</Link>
              ))}
            </div>
          ))}

        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-white border-b-2 border-gray-200">
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-500 focus:outline-none md:hidden">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
           </button>
           <div className="flex-1 ml-4">
             <span className="text-sm text-gray-500">Logged in as: <strong>{user?.email}</strong> ({user?.is_superadmin ? 'Super Admin' : user?.role.name})</span>
           </div>
          <button onClick={handleLogout} className="px-4 py-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-600">
            Logout
          </button>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const NavItem = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `px-3 py-2 rounded-md text-sm font-medium ${
        isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
      }`
    }
  >
    {children}
  </NavLink>
);

export default function Layout(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="flex">
        <aside className="w-64 bg-gray-800 p-4">
          <div className="text-2xl font-semibold mb-6">FitFlex</div>
          <nav className="space-y-2">
            <NavItem to="/">Dashboard</NavItem>
            <NavItem to="/start">Start Workout</NavItem>
            <NavItem to="/history">History</NavItem>
          </nav>
        </aside>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

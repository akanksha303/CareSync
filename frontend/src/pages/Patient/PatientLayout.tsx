import { Outlet } from 'react-router-dom';
import Navbar from '../../components/ui/Navbar';

export default function PatientLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="PATIENT" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}



import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function CalendarCallback({ success }: { success: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const dashboardPath = user?.role === 'PATIENT' ? '/patient' : user?.role === 'DOCTOR' ? '/doctor' : '/admin';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card text-center max-w-md">
        {success ? (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-green-700">Google Calendar Connected!</h2>
            <p className="text-gray-500 mt-2">Your appointments will now sync to your Google Calendar.</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-red-700">Connection Failed</h2>
            <p className="text-gray-500 mt-2">Could not connect Google Calendar. Please try again.</p>
          </>
        )}
        <button className="btn-primary mt-6" onClick={() => navigate(dashboardPath)}>Go to Dashboard</button>
      </div>
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import toast from 'react-hot-toast';
import type { NotificationLog } from '../../types';
import { format } from 'date-fns';

export default function FailedNotifications() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['failed-notifications'],
    queryFn: () => api.get<{ notifications: NotificationLog[] }>('/api/admin/notifications/failed').then((r: any) => r.data),
    refetchInterval: 30000,
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/admin/notifications/${id}/retry`),
    onSuccess: () => {
      toast.success('Queued for retry');
      queryClient.invalidateQueries({ queryKey: ['failed-notifications'] });
    },
    onError: () => toast.error('Retry failed'),
  });

  const statusColors: Record<string, string> = {
    FAILED: 'bg-red-100 text-red-800',
    RETRYING: 'bg-yellow-100 text-yellow-800',
    PENDING: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Failed Notifications</h1>
        <span className="text-sm text-gray-500">Auto-refreshes every 30s</span>
      </div>

      {isLoading && <div className="text-center py-8 text-gray-500">Loading...</div>}

      {!isLoading && (!data?.notifications || data.notifications.length === 0) && (
        <div className="card text-center py-12">
          <p className="text-green-600 text-lg font-medium">✅ All notifications delivered successfully</p>
          <p className="text-gray-500 text-sm mt-1">No failed or retrying notifications</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.notifications?.map((notif: any) => (
          <div key={notif.id} className="card">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[notif.status] || 'bg-gray-100 text-gray-700'}`}>
                    {notif.status}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {notif.type}
                  </span>
                  <span className="text-xs text-gray-400">{notif.attempts} attempt{notif.attempts !== 1 ? 's' : ''}</span>
                </div>
                {notif.appointment && (
                  <div className="text-sm">
                    <span className="text-gray-500">Patient:</span>{' '}
                    <span className="font-medium">{notif.appointment.patient?.name}</span>{' '}
                    <span className="text-gray-400">→ Dr. {notif.appointment.doctor?.name}</span>
                  </div>
                )}
                {notif.last_error && (
                  <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{notif.last_error}</p>
                )}
                <p className="text-xs text-gray-400">{format(new Date(notif.created_at), 'PPp')}</p>
              </div>
              <button
                onClick={() => retryMutation.mutate(notif.id)}
                className="btn-secondary text-sm">
                Retry
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}




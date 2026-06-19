import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeSettingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Clock, Save } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DEFAULT_SCHEDULE = Object.fromEntries(
  DAYS.map(d => [d, { isOpen: true, openTime: '08:00', closeTime: '21:00' }])
);

export default function StoreSettings() {
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);

  const { data, isLoading } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => storeSettingsAPI.getSettings().then(r => r.data),
  });

  useEffect(() => {
    if (data?.schedule) setSchedule(data.schedule);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (s) => storeSettingsAPI.updateSettings(s),
    onSuccess: () => { queryClient.invalidateQueries(['store-settings']); toast.success('Store hours saved'); },
    onError: () => toast.error('Failed to save settings'),
  });

  const update = (day, field, value) =>
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  if (isLoading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Store Hours</h1>
        <p className="text-gray-500 text-sm">Set your weekly opening schedule</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-500" />
          <h2 className="font-semibold text-slate-700">Weekly Schedule</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {DAYS.map(day => {
            const slot = schedule[day] || { isOpen: false, openTime: '08:00', closeTime: '21:00' };
            return (
              <div key={day} className="px-6 py-4 flex flex-wrap items-center gap-4">
                <div className="w-28">
                  <span className="capitalize font-medium text-slate-700">{day}</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slot.isOpen}
                    onChange={e => update(day, 'isOpen', e.target.checked)}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className={`text-sm font-medium ${slot.isOpen ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {slot.isOpen ? 'Open' : 'Closed'}
                  </span>
                </label>
                {slot.isOpen && (
                  <>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">From</label>
                      <input
                        type="time"
                        value={slot.openTime}
                        onChange={e => update(day, 'openTime', e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">To</label>
                      <input
                        type="time"
                        value={slot.closeTime}
                        onChange={e => update(day, 'closeTime', e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={() => mutation.mutate(schedule)}
            disabled={mutation.isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {mutation.isLoading ? 'Saving...' : 'Save Hours'}
          </button>
        </div>
      </div>
    </div>
  );
}

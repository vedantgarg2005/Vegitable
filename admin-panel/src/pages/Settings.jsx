import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { restaurantSettingsAPI } from '../services/api';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DEFAULT_SCHEDULE = Object.fromEntries(
  DAYS.map(d => [d, { isOpen: d !== 'sunday', openTime: '09:00', closeTime: '22:00' }])
);

const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Food Delivery Admin',
    email: '',
    notifications: true,
    darkMode: false,
  });

  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    restaurantSettingsAPI.getSettings()
      .then(res => { if (res.data?.schedule) setSchedule(res.data.schedule); })
      .catch(() => {});
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleDayChange = (day, field, value) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      await restaurantSettingsAPI.updateSettings(schedule);
      toast.success('Restaurant timing saved!');
    } catch {
      toast.error('Failed to save timing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your application settings</p>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">General</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
          <input
            type="text"
            name="siteName"
            value={settings.siteName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
          <input
            type="email"
            name="email"
            value={settings.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="notifications" checked={settings.notifications} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
          <span className="text-sm text-gray-700">Enable email notifications</span>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="darkMode" checked={settings.darkMode} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
          <span className="text-sm text-gray-700">Enable dark mode</span>
        </label>

        <button onClick={() => toast.success('Settings saved!')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Save Settings
        </button>
      </div>

      {/* Restaurant Timing */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Restaurant Hours</h2>
        <div className="space-y-3">
          {DAYS.map(day => (
            <div key={day} className="flex items-center gap-4">
              <div className="w-28">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schedule[day]?.isOpen ?? true}
                    onChange={e => handleDayChange(day, 'isOpen', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                </label>
              </div>

              {schedule[day]?.isOpen ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={schedule[day]?.openTime || '09:00'}
                    onChange={e => handleDayChange(day, 'openTime', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500 text-sm">to</span>
                  <input
                    type="time"
                    value={schedule[day]?.closeTime || '22:00'}
                    onChange={e => handleDayChange(day, 'closeTime', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <span className="text-sm text-red-500 font-medium">Closed</span>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveSchedule}
          disabled={saving}
          className="mt-6 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Timing'}
        </button>
      </div>
    </div>
  );
};

export default Settings;

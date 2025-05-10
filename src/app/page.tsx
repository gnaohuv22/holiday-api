'use client';

import { useState, useEffect, useCallback } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { Holiday } from '@/types/holiday';

export default function Home() {
  // State for holidays list
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for form
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentHoliday, setCurrentHoliday] = useState<Holiday>({
    startDate: new Date().toISOString(),
    name: '',
    description: '',
  });

  // Fetch holidays for the selected year
  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/holidays?year=${year}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setHolidays(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to fetch holidays:', err);
    } finally {
      setLoading(false);
    }
  }, [year]);

  // Initial load
  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const url = formMode === 'create' 
        ? '/api/holidays' 
        : `/api/holidays/${currentHoliday.id}`;
      
      const method = formMode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentHoliday),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      // Refresh the list
      fetchHolidays();
      
      // Reset form
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to save holiday:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/holidays/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      // Refresh the list
      fetchHolidays();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to delete holiday:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (holiday: Holiday) => {
    setCurrentHoliday(holiday);
    setFormMode('edit');
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setCurrentHoliday({
      startDate: new Date().toISOString(),
      name: '',
      description: '',
    });
    setFormMode('create');
    setShowForm(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Holiday Handler API</h1>
          <ThemeToggle />
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Documentation</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Endpoints</h3>
              <ul className="ml-6 list-disc space-y-2 mt-2">
                <li><code>GET /api/holidays?year=2025</code> - Get holidays for a specific year</li>
                <li><code>POST /api/holidays</code> - Create a new holiday</li>
                <li><code>PUT /api/holidays/[id]</code> - Update a holiday</li>
                <li><code>DELETE /api/holidays/[id]</code> - Delete a holiday</li>
                <li><code>GET /api/holidays/upcoming</code> - Get upcoming holidays</li>
                <li><code>GET /api/holidays/in-range?start=2025-02-01&end=2025-02-28</code> - Filter holidays by date range</li>
                <li><code>POST /api/holidays/import-static</code> - Import static Vietnamese holidays</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Holiday List</h2>
            <div className="flex space-x-4 items-center">
              <div className="flex items-center space-x-2">
                <label htmlFor="year" className="font-medium">Year:</label>
                <select
                  id="year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="border dark:border-gray-600 rounded-md px-2 py-1"
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const yearOption = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={yearOption} value={yearOption}>
                        {yearOption}
                      </option>
                    );
                  })}
                </select>
              </div>
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setFormMode('create');
                  if (!showForm) {
                    setCurrentHoliday({
                      startDate: new Date().toISOString(),
                      name: '',
                      description: '',
                    });
                  }
                }}
                className="btn"
              >
                {showForm ? 'Cancel' : 'Add Holiday'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 border dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-medium mb-4">
                {formMode === 'create' ? 'Add New Holiday' : 'Edit Holiday'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="block font-medium mb-1">
                    Holiday Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={currentHoliday.name}
                    onChange={(e) => setCurrentHoliday({ ...currentHoliday, name: e.target.value })}
                    className="w-full border dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="startDate" className="block font-medium mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={currentHoliday.startDate ? currentHoliday.startDate.substring(0, 10) : ''}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      newDate.setHours(0, 0, 0, 0);
                      setCurrentHoliday({
                        ...currentHoliday,
                        startDate: newDate.toISOString(),
                      });
                    }}
                    className="w-full border dark:border-gray-600"
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block font-medium mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={currentHoliday.description || ''}
                  onChange={(e) => setCurrentHoliday({ ...currentHoliday, description: e.target.value })}
                  className="w-full border dark:border-gray-600"
                  rows={3}
                ></textarea>
              </div>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={currentHoliday.isRecurring || false}
                  onChange={(e) => setCurrentHoliday({ ...currentHoliday, isRecurring: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isRecurring" className="font-medium">Recurring Yearly</label>
              </div>
              <div className="mb-4">
                <label htmlFor="type" className="block font-medium mb-1">
                  Type
                </label>
                <select
                  id="type"
                  value={currentHoliday.type || 'dynamic'}
                  onChange={(e) => setCurrentHoliday({ 
                    ...currentHoliday, 
                    type: e.target.value as 'static' | 'dynamic'
                  })}
                  className="w-full border dark:border-gray-600"
                >
                  <option value="static">Static Holiday</option>
                  <option value="dynamic">Dynamic Holiday</option>
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : formMode === 'create' ? 'Create Holiday' : 'Update Holiday'}
                </button>
              </div>
            </form>
          )}

          {loading && !showForm ? (
            <div className="text-center py-8">Loading...</div>
          ) : holidays.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No holidays found for {year}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.map((holiday) => (
                    <tr key={holiday.id} className="border-b dark:border-gray-700">
                      <td className="p-2">{holiday.name}</td>
                      <td className="p-2">{formatDate(holiday.startDate)}</td>
                      <td className="p-2">{holiday.description}</td>
                      <td className="p-2">
                        {holiday.isRecurring ? 'Recurring' : 'One-time'} 
                        {holiday.type ? ` (${holiday.type})` : ''}
                      </td>
                      <td className="p-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(holiday)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(holiday.id!)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  setError(null);
                  const response = await fetch('/api/holidays/import-static', {
                    method: 'POST',
                  });
                  
                  if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                  }
                  
                  await fetchHolidays();
                  alert('Static holidays imported successfully!');
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'An error occurred');
                  console.error('Failed to import static holidays:', err);
                } finally {
                  setLoading(false);
                }
              }}
              className="btn-secondary"
              disabled={loading}
            >
              Import Static Holidays
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

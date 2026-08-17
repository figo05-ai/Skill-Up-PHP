import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import api from '../api/axios'; // استخدام الـ instance المعد مسبقاً

const ClientSelect = ({ value, onChange, hideLabel = false, noMargin = false }) => {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/clients');
      const clientOptions = data.map(client => ({
        value: client.id || client._id,
        label: client.name
      }));
      setOptions(clientOptions);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
    setIsLoading(false);
  };

  const handleCreate = async (inputValue) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/clients', { name: inputValue });
      const newOption = { value: data.id || data._id, label: data.name };
      setOptions((prev) => [...prev, newOption]);
      onChange(newOption); // اختيار العميل الجديد تلقائياً
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to create client');
    }
    setIsLoading(false);
  };

  // إذا كنت تريد استخدام CreatableSelect لإضافة عملاء جدد مباشرة، استبدل Select بـ CreatableSelect من 'react-select/creatable'
  return (
    <div className={noMargin ? '' : 'mb-4'}>
      {!hideLabel && <label className="block text-gray-700 text-sm font-bold mb-2">Client (Company)</label>}
      <Select
        options={options}
        isLoading={isLoading}
        value={options.find(c => c.value === value) || null}
        onChange={(option) => onChange(option ? option.value : null)}
        placeholder="Select a client..."
        isClearable
        menuPortalTarget={document.body}
        styles={{ 
          menuPortal: base => ({ ...base, zIndex: 9999 }),
          control: (base, state) => ({
            ...base,
            minHeight: '46px',
            backgroundColor: state.isFocused ? '#ffffff' : '#f9fafb',
            borderColor: state.isFocused ? '#10b981' : '#e5e7eb',
            borderRadius: '0.75rem',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
            '&:hover': {
              borderColor: '#10b981'
            }
          })
        }}
      />
    </div>
  );
};

export default ClientSelect;
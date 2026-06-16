import toast from 'react-hot-toast';

export const confirmAction = (message: string, onConfirm: () => void) => {
  toast((t) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '250px' }}>
      <span style={{ fontWeight: 500, color: '#fff', fontSize: '0.95rem' }}>{message}</span>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button 
          onClick={() => toast.dismiss(t.id)}
          style={{ 
            padding: '6px 12px', 
            background: 'transparent', 
            border: '1px solid #334155', 
            borderRadius: '6px', 
            color: '#cbd5e1', 
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          Cancel
        </button>
        <button 
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm();
          }}
          style={{ 
            padding: '6px 12px', 
            background: '#ef4444', 
            border: 'none', 
            borderRadius: '6px', 
            color: '#fff', 
            cursor: 'pointer', 
            fontWeight: 500,
            fontSize: '0.85rem'
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  ), {
    duration: 6000,
    style: {
      background: '#1e293b',
      color: '#fff',
      border: '1px solid #334155',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      padding: '16px'
    }
  });
};

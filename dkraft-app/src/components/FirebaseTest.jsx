// Componente temporal para probar la conexión con Firebase
// Puedes eliminarlo después de verificar que todo funciona

import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

const FirebaseTest = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState([]);

  const testConnection = async () => {
    setLoading(true);
    setStatus('Probando conexión...');

    try {
      // 1. Crear un documento de prueba
      const testDoc = await addDoc(collection(db, 'test'), {
        message: 'Conexión exitosa!',
        timestamp: new Date().toISOString()
      });
      setStatus(`✅ Documento creado con ID: ${testDoc.id}`);

      // 2. Leer los documentos
      const querySnapshot = await getDocs(collection(db, 'test'));
      const docs = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTestData(docs);
      setStatus(`✅ Conexión exitosa! Se encontraron ${docs.length} documento(s)`);

      // 3. Eliminar el documento de prueba
      await deleteDoc(doc(db, 'test', testDoc.id));
      setStatus('✅ Conexión exitosa! (documento de prueba eliminado)');

    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      console.error('Firebase test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '500px',
      margin: '2rem auto',
      backgroundColor: 'var(--bg-secondary, #1a1a2e)',
      borderRadius: '12px',
      border: '1px solid var(--border-color, #333)'
    }}>
      <h2 style={{
        marginBottom: '1rem',
        color: 'var(--text-primary, #fff)',
        fontSize: '1.25rem'
      }}>
        🔥 Firebase Connection Test
      </h2>

      <button
        onClick={testConnection}
        disabled={loading}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: loading ? '#666' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          width: '100%'
        }}
      >
        {loading ? 'Probando...' : 'Probar Conexión'}
      </button>

      {status && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: status.includes('✅') ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
          borderRadius: '8px',
          color: status.includes('✅') ? '#4CAF50' : '#f44336',
          fontSize: '0.9rem'
        }}>
          {status}
        </div>
      )}

      {testData.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ color: 'var(--text-primary, #fff)', fontSize: '1rem' }}>
            Documentos encontrados:
          </h3>
          <pre style={{
            backgroundColor: 'rgba(0,0,0,0.2)',
            padding: '1rem',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '0.8rem',
            color: '#ccc'
          }}>
            {JSON.stringify(testData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FirebaseTest;

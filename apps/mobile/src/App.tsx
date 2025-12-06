import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { greet, APP_NAME, API_VERSION, type HistoryEntry, type Credential, type ApiResponse } from '@multiplatform/shared';

// Android emulator uses 10.0.2.2 to reach host's localhost
// iOS simulator uses localhost directly
// For real devices, use your machine's IP or set up port forwarding
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://10.0.2.2:4000';

function App() {
  const [message, setMessage] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<string>('Connecting...');
  const [apiVersion, setApiVersion] = useState<string>('');
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);

  useEffect(() => {
    setMessage(greet('Mobile'));

    // Test real connection to backend API
    fetch(`${API_BASE_URL}/api/hello`)
      .then((res) => res.json())
      .then((data: ApiResponse<{ message: string; version: string }>) => {
        if (data.success && data.data) {
          setApiStatus(data.data.message);
          setApiVersion(data.data.version);
        } else {
          setApiStatus('API error');
        }
      })
      .catch((err) => {
        setApiStatus(`Failed: ${err.message}`);
      });

    // Listen for history entries from iOS Safari Extension
    const unlistenHistory = listen<HistoryEntry>('safari-history', (event) => {
      setHistoryEntries((prev) => [...prev, event.payload]);
    });

    // Listen for autofill requests from Android
    const unlistenAutofill = listen<{ domain: string }>('autofill-request', async (event) => {
      const creds = await invoke<Credential[]>('get_credentials', { domain: event.payload.domain });
      setCredentials(creds);
    });

    return () => {
      unlistenHistory.then((fn) => fn());
      unlistenAutofill.then((fn) => fn());
    };
  }, []);

  return (
    <div className="container">
      <h1>{APP_NAME}</h1>
      <p className="greeting">{message}</p>

      <section>
        <h2>Backend API</h2>
        <p className="api-status">
          Status: <span data-testid="api-status">{apiStatus}</span>
        </p>
        {apiVersion && (
          <p className="api-version">
            Version: <span data-testid="api-version">{apiVersion}</span>
          </p>
        )}
      </section>

      <section>
        <h2>Safari History</h2>
        {historyEntries.length === 0 ? (
          <p className="empty">No history entries yet</p>
        ) : (
          <ul>
            {historyEntries.map((entry, i) => (
              <li key={i}>
                <strong>{entry.title}</strong>
                <span>{entry.url}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Saved Credentials</h2>
        {credentials.length === 0 ? (
          <p className="empty">No credentials stored</p>
        ) : (
          <ul>
            {credentials.map((cred) => (
              <li key={cred.id}>
                <strong>{cred.domain}</strong>
                <span>{cred.username}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { greet, APP_NAME, type HistoryEntry, type Credential } from '@multiplatform/shared';

function App() {
  const [message, setMessage] = useState<string>('');
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);

  useEffect(() => {
    setMessage(greet('Mobile'));

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

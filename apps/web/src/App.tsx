import { useState, useEffect } from 'react';
import { greet, APP_NAME, type ApiResponse } from '@multiplatform/shared';

function App() {
  const [message, setMessage] = useState<string>('');
  const [apiResponse, setApiResponse] = useState<string>('');

  useEffect(() => {
    setMessage(greet('World'));

    fetch('/api/hello')
      .then((res) => res.json())
      .then((data: ApiResponse<{ message: string }>) => {
        if (data.success && data.data) {
          setApiResponse(data.data.message);
        }
      })
      .catch(() => setApiResponse('API not available'));
  }, []);

  return (
    <div className="container">
      <h1>{APP_NAME}</h1>
      <p className="greeting">{message}</p>
      <p className="api-status">
        API: <span>{apiResponse || 'Loading...'}</span>
      </p>
    </div>
  );
}

export default App;

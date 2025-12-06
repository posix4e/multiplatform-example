import express from 'express';
import cors from 'cors';
import { greet, APP_NAME, API_VERSION, type ApiResponse } from '@multiplatform/shared';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/hello', (_req, res) => {
  const response: ApiResponse<{ message: string; version: string }> = {
    success: true,
    data: {
      message: greet(APP_NAME),
      version: API_VERSION,
    },
  };
  res.json(response);
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`${APP_NAME} API running on port ${PORT}`);
});

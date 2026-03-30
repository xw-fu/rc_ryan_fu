import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const app = express();
app.use(express.json());

interface Notification {
  id: string;
  provider: string;
  headers?: Record<string, string>;
  body: any;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
}

const notifications: Map<string, Notification> = new Map();

app.post('/notify', (req: Request, res: Response) => {
  const { provider, headers, body } = req.body;

  if (!provider) {
    return res.status(400).json({ error: 'Provider is required' });
  }

  const id = uuidv4();
  const notification: Notification = {
    id,
    provider,
    headers,
    body,
    status: 'pending',
    attempts: 0,
  };

  notifications.set(id, notification);

  // Trigger dispatcher (background)
  dispatch(notification);

  res.status(202).json({ id });
});

async function dispatch(notification: Notification) {
  notification.attempts++;
  try {
    await axios.post(notification.provider, notification.body, {
      headers: notification.headers,
    });
    notification.status = 'delivered';
  } catch (error) {
    notification.status = 'failed';
    // Retry logic would go here
    if (notification.attempts < 3) {
        setTimeout(() => dispatch(notification), 1000 * notification.attempts);
    }
  }
}

export default app;

import request from 'supertest';
import app from '../app';

describe('POST /notify', () => {
  it('should return 202 Accepted when a valid notification is submitted', async () => {
    const response = await request(app)
      .post('/notify')
      .send({
        provider: 'https://webhook.site/test',
        headers: { 'Content-Type': 'application/json' },
        body: { message: 'Hello World' },
      });

    expect(response.status).toBe(202);
    expect(response.body).toHaveProperty('id');
  });

  it('should return 400 Bad Request if provider is missing', async () => {
     const response = await request(app)
      .post('/notify')
      .send({
        body: { message: 'Missing Provider' },
      });

    expect(response.status).toBe(400);
  });
});

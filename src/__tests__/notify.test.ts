import request from 'supertest';
import app from '../app';

describe('API Notification System', () => {
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

  it('should return 404 for unknown status id', async () => {
    const response = await request(app).get('/status/unknown-id');
    expect(response.status).toBe(404);
  });

  it('should track status after submission', async () => {
    const postResponse = await request(app)
      .post('/notify')
      .send({
        provider: 'https://webhook.site/test',
        body: { message: 'Track Status' },
      });

    const id = postResponse.body.id;
    const statusResponse = await request(app).get(`/status/${id}`);
    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.status).toBeDefined();
  });
});

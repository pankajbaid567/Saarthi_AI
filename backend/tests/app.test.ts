import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';

describe('infrastructure middleware', () => {
  it('returns health status', async () => {
    const app = createApp();

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('validates request payload using zod middleware', async () => {
    const app = createApp();

    const response = await request(app).post('/api/v1/system/echo').send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Validation failed');
  });
});

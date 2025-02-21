import request from 'supertest';
import { createKoaServer } from 'routing-controllers';
import { ReportController } from '../controllers/report.controller';
import { Container } from 'typedi';

describe('Report Controller', () => {
  let app: any;

  beforeAll(() => {
    app = createKoaServer({
      controllers: [ReportController]
    });
  });

  it('should get report details', async () => {
    const response = await request(app.callback())
      .get('/api/report/detail/1')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
}); 
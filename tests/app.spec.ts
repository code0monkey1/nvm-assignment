import request from 'supertest';
import app from '../src/app';
describe('App', () => {
    const api = request(app);

    it('should return true', () => {
        expect(true).toBeTruthy();
    });

    it('should return 200 status code', async () => {
        await api.get('/').expect(200);
    });
});

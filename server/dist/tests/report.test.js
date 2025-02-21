"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const routing_controllers_1 = require("routing-controllers");
const report_controller_1 = require("../controllers/report.controller");
describe('Report Controller', () => {
    let app;
    beforeAll(() => {
        app = (0, routing_controllers_1.createKoaServer)({
            controllers: [report_controller_1.ReportController]
        });
    });
    it('should get report details', async () => {
        const response = await (0, supertest_1.default)(app.callback())
            .get('/api/report/detail/1')
            .set('Authorization', 'Bearer test-token');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});

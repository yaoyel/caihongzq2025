"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = __importDefault(require("@koa/router"));
const AssessmentController_1 = require("../controllers/AssessmentController");
const router = new router_1.default({
    prefix: '/api/assessment'
});
const controller = new AssessmentController_1.AssessmentController();
// 获取量表问题
router.get('/scale/questions', async (ctx) => {
    console.log('收到获取量表问题请求');
    await controller.getScaleQuestions(ctx);
});
// 获取问答题目
router.get('/qa/questions', async (ctx) => {
    console.log('收到获取问答题目请求');
    await controller.getQAQuestions(ctx);
});
// 提交量表答案
router.post('/scale/submit', async (ctx) => {
    try {
        console.log('收到提交量表答案请求');
        console.log('请求头:', ctx.request.headers);
        console.log('请求体:', ctx.request.body);
        if (!ctx.request.body) {
            ctx.status = 400;
            ctx.body = {
                success: false,
                message: '请求体为空'
            };
            return;
        }
        await controller.submitScaleAnswers(ctx);
        console.log('量表答案提交处理完成');
    }
    catch (error) {
        console.error('处理量表答案提交请求失败:', error);
        ctx.status = 500;
        ctx.body = {
            success: false,
            message: error instanceof Error ? error.message : '提交失败'
        };
    }
});
// 提交问答答案
router.post('/qa/submit', async (ctx) => {
    console.log('收到提交问答答案请求:', ctx.request.body);
    await controller.submitQAAnswers(ctx);
});
exports.default = router;
//# sourceMappingURL=assessment.js.map
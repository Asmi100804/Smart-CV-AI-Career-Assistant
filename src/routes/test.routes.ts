import { Router } from 'express';

import { evaluateTestController, generateTestController } from '../controllers/test.controller';

const router = Router();

router.post('/generate', generateTestController);
router.post('/evaluate', evaluateTestController);

export default router;

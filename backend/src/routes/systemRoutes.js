import { Router } from 'express';
import { health, root } from '../controllers/systemController.js';

const router = Router();

router.get('/', root);
router.get('/health', health);

export default router;

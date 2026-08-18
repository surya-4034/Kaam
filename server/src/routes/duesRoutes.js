import express from 'express';
import { getMyDues, payDues } from '../controllers/duesController.js';

const router = express.Router();

router.get('/my-dues', getMyDues);
router.post('/pay', payDues);

export default router;


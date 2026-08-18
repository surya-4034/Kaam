import express from 'express';
import {
  getWorkers,
  getWorkerById,
  getWorkerByUserId,
  updateWorkerProfile,
  toggleWorkerAvailability,
  submitBankKyc,
  addPortfolioImage,
} from '../controllers/workerController.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public & Direct routes
router.get('/', getWorkers);
router.get('/:id', getWorkerById);
router.get('/by-user/:userId', getWorkerByUserId);

// Profile Updates, Availability, Bank KYC & Portfolio
router.put('/profile', updateWorkerProfile);
router.put('/availability', toggleWorkerAvailability);
router.post('/bank-kyc', submitBankKyc);
router.post('/portfolio', addPortfolioImage);

export default router;


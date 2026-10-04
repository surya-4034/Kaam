import express from 'express';
import {
  getWorkers,
  searchWorkers,
  getWorkerById,
  getWorkerByUserId,
  getPartnerByPartnerId,
  updateWorkerProfile,
  toggleWorkerAvailability,
  submitBankKyc,
  addPortfolioImage,
  deletePortfolioImage,
} from '../controllers/workerController.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public & Direct routes
router.get('/', getWorkers);
router.get('/search', searchWorkers);
router.get('/partner-id/:partnerId', getPartnerByPartnerId);
router.get('/by-user/:userId', getWorkerByUserId);
router.get('/:id', getWorkerById);

// Profile Updates, Availability, Bank KYC & Portfolio
router.put('/profile', updateWorkerProfile);
router.put('/availability', toggleWorkerAvailability);
router.post('/bank-kyc', submitBankKyc);
router.post('/portfolio', addPortfolioImage);
router.delete('/portfolio/:id', deletePortfolioImage);

export default router;

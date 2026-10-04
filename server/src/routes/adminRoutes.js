import express from 'express';
import {
  getAllUsers,
  toggleUserLock,
  toggleUserStatus,
  getPendingKycQueue,
  approveKyc,
  rejectKyc,
  getDuesAudit,
  getPlatformStats,
  getClientDetails,
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/users', getAllUsers);
router.get('/clients/:clientId', getClientDetails);
router.post('/users/:userId/toggle-lock', toggleUserLock);
router.post('/users/:userId/toggle-status', toggleUserStatus);

router.get('/kyc/pending', getPendingKycQueue);
router.post('/kyc/:workerId/approve', approveKyc);
router.post('/kyc/:workerId/reject', rejectKyc);
router.get('/dues/audit', getDuesAudit);
router.get('/stats', getPlatformStats);

export default router;

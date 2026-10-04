import express from 'express';
import {
  getAllJobs,
  getJobsByWorker,
  createJobPublic,
  acceptJob,
  rejectJob,
  completeJob,
  verifyAndCompleteJob,
} from '../controllers/jobController.js';

const router = express.Router();

// GET all jobs (Public REST endpoint for real-time polling between Client & Worker Apps)
router.get('/', getAllJobs);
router.get('/all', getAllJobs);
router.get('/worker/:workerId', getJobsByWorker);

// POST create job
router.post('/', createJobPublic);

// Action endpoints
router.post('/:id/accept', acceptJob);
router.put('/:id/accept', acceptJob);

router.post('/:id/reject', rejectJob);
router.put('/:id/reject', rejectJob);

router.post('/:id/verify-complete', verifyAndCompleteJob);
router.put('/:id/verify-complete', verifyAndCompleteJob);

router.post('/:id/complete', completeJob);
router.put('/:id/complete', completeJob);

export default router;

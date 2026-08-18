import express from 'express';
import {
  getAllJobs,
  createJobPublic,
  acceptJob,
  rejectJob,
  completeJob,
} from '../controllers/jobController.js';

const router = express.Router();

// GET all jobs (Public REST endpoint for real-time polling between Client & Worker Apps)
router.get('/', getAllJobs);
router.get('/all', getAllJobs);

// POST create job
router.post('/', createJobPublic);

// Action endpoints
router.post('/:id/accept', acceptJob);
router.put('/:id/accept', acceptJob);

router.post('/:id/reject', rejectJob);
router.put('/:id/reject', rejectJob);

router.post('/:id/complete', completeJob);
router.put('/:id/complete', completeJob);

export default router;

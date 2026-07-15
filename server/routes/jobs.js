const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Job = require('../models/Job');
const Employer = require('../models/Employer');
const JobApplication = require('../models/JobApplication');
const User = require('../models/User');
const mongoose = require('mongoose');
const { sendApplicationConfirmation, sendNewApplicantAlert, sendStatusUpdateEmail } = require('../utils/emailService');

// Utility function to check if string is valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get all jobs with filters
router.get('/', async (req, res) => {
  try {
    const {
      remoteWork,
      location,
      type,
      accessibility,
      skills,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};

    if (remoteWork) {
      query['accessibility.remoteWork'] = remoteWork === 'true';
    }
    if (location) {
      query.location = new RegExp(location, 'i');
    }
    if (type) {
      query.type = type;
    }
    if (accessibility) {
      query['accessibility.accommodations'] = { $in: [accessibility] };
    }
    if (skills) {
      query.skills = { $in: skills.split(',') };
    }
    if (req.query.company) {
      query.company = req.query.company;
    }

    const jobs = await Job.find(query)
      .populate('company', 'companyName profile.logo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ message: 'Server error while fetching jobs' });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle special routes
    if (id === 'saved' || id === 'applied') {
      return res.json({ 
        jobs: [], 
        message: `No ${id} jobs found` 
      });
    }

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        message: 'Invalid job ID format' 
      });
    }

    const job = await Job.findById(id).populate('company', 'companyName profile.logo');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (err) {
    console.error('Error fetching job:', err);
    res.status(500).json({ message: 'Server error while fetching job details' });
  }
});

// Create a new job
router.post('/', [auth, [
  check('title', 'Title is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('location', 'Location is required').not().isEmpty(),
  check('type', 'Job type is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const employer = await Employer.findById(req.user.id);
    if (!employer) {
      return res.status(401).json({ message: 'Not authorized as an employer' });
    }

    const newJob = new Job({
      ...req.body,
      company: employer._id,
      createdAt: new Date()
    });

    const job = await newJob.save();
    res.json(job);
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(500).json({ message: 'Server error while creating job' });
  }
});

// Update job
router.put('/:id', [auth], async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        message: 'Invalid job ID format' 
      });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const employer = await Employer.findById(req.user.id);
    if (!employer || job.company.toString() !== employer._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this job' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    res.json(updatedJob);
  } catch (err) {
    console.error('Error updating job:', err);
    res.status(500).json({ message: 'Server error while updating job' });
  }
});

// Delete job
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        message: 'Invalid job ID format' 
      });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const employer = await Employer.findById(req.user.id);
    if (!employer || job.company.toString() !== employer._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(id);
    res.json({ message: 'Job removed' });
  } catch (err) {
    console.error('Error deleting job:', err);
    res.status(500).json({ message: 'Server error while deleting job' });
  }
});

// Get candidate's own applications
router.get('/applications/mine', auth, async (req, res) => {
  try {
    const applications = await JobApplication.find({ candidate: req.user.id })
      .populate({
        path: 'job',
        populate: {
          path: 'company',
          select: 'companyName profile.logo'
        }
      })
      .sort({ appliedAt: -1 });
    
    res.json(applications);
  } catch (err) {
    console.error('Error fetching candidate applications:', err);
    res.status(500).json({ message: 'Server error while fetching applications' });
  }
});

// Apply to a job by ID
router.post('/:id/apply', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await JobApplication.findOne({ job: id, candidate: req.user.id });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    const newApplication = new JobApplication({
      job: id,
      candidate: req.user.id,
      resumeUrl: req.body.resumeUrl || ''
    });

    const application = await newApplication.save();

    // Send email notifications (non-blocking)
    try {
      const candidate = await User.findById(req.user.id).select('firstName lastName email');
      const companyName = job.company?.companyName || 'the employer';

      // Email to candidate
      sendApplicationConfirmation({
        to: candidate.email,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        jobTitle: job.title,
        companyName
      }).catch(e => console.warn('Confirmation email failed:', e.message));

      // Email to employer — find employer's email
      const employer = await Employer.findById(job.company).select('email companyName');
      if (employer?.email) {
        sendNewApplicantAlert({
          to: employer.email,
          employerName: employer.companyName,
          jobTitle: job.title,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          applicationId: application._id
        }).catch(e => console.warn('Employer alert email failed:', e.message));
      }
    } catch (emailErr) {
      console.warn('Email notification error (non-critical):', emailErr.message);
    }

    res.status(201).json(application);
  } catch (err) {
    console.error('Error applying to job:', err);
    res.status(500).json({ message: 'Server error while applying to job' });
  }
});

// Get applicants for a job (Employer only)
router.get('/:id/applicants', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify employer owns this job
    const employer = await Employer.findById(req.user.id);
    if (!employer || job.company.toString() !== employer._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to view applicants for this job' });
    }

    const applicants = await JobApplication.find({ job: id })
      .populate('candidate', 'firstName lastName email profile')
      .sort({ appliedAt: -1 });

    res.json(applicants);
  } catch (err) {
    console.error('Error fetching applicants:', err);
    res.status(500).json({ message: 'Server error while fetching applicants' });
  }
});

// Update application status (Employer only)
router.put('/applications/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid application ID format' });
    }

    const application = await JobApplication.findById(id).populate('job');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify employer owns the job
    const employer = await Employer.findById(req.user.id);
    if (!employer || application.job.company.toString() !== employer._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this application' });
    }

    application.status = status;
    await application.save();

    // Notify the candidate about the status change (non-blocking)
    try {
      const candidate = await User.findById(application.candidate).select('firstName lastName email');
      if (candidate) {
        const companyName = application.job.company?.companyName || 'the employer';
        sendStatusUpdateEmail({
          to: candidate.email,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          jobTitle: application.job.title,
          companyName,
          newStatus: status
        }).catch(e => console.warn('Status update email failed:', e.message));
      }
    } catch (emailErr) {
      console.warn('Status email error (non-critical):', emailErr.message);
    }

    res.json(application);
  } catch (err) {
    console.error('Error updating application status:', err);
    res.status(500).json({ message: 'Server error while updating application status' });
  }
});

module.exports = router;

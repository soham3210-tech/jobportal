const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Applied', 'In Review', 'Interview', 'Offered', 'Rejected'],
    default: 'Applied'
  },
  resumeUrl: {
    type: String
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

// Avoid duplicate applications by same candidate to the same job
jobApplicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);

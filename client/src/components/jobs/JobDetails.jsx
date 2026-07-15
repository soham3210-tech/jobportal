import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from 'axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Notification from '../common/Notification';
import { toast } from 'react-hot-toast';

const JobDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [job, setJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isApplying, setIsApplying] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [notification, setNotification] = useState(null);

    const getAccessibilityFeatures = useCallback((jobData) => {
        if (!jobData || !jobData.accessibility) return [];
        const features = [];
        if (jobData.accessibility.remoteWork) features.push('Remote Work');
        if (jobData.accessibility.flexibleHours) features.push('Flexible Hours');
        if (jobData.accessibility.wheelchairAccessible) features.push('Wheelchair Accessible');
        if (jobData.accessibility.assistiveTechnology?.available) {
            features.push(jobData.accessibility.assistiveTechnology.description || 'Assistive Technology');
        }
        if (Array.isArray(jobData.accessibility.accommodations)) {
            features.push(...jobData.accessibility.accommodations);
        }
        return features;
    }, []);

    const loadJob = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch job from Mongoose backend API
            const res = await API.get(`/api/jobs/${id}`);
            const fetchedJob = res.data;

            // Check if job is saved in localStorage
            const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
            setIsSaved(savedJobs.some(j => j.id === fetchedJob._id));

            setJob(fetchedJob);
        } catch (error) {
            console.error('Error loading job from API:', error);
            setNotification({
                type: 'error',
                message: error.response?.data?.message || 'Error loading job details. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadJob();
    }, [loadJob]);

    const handleApply = async () => {
        if (!user) {
            toast.error('Please log in to apply for this job');
            navigate('/login');
            return;
        }

        setIsApplying(true);
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            };

            await API.post(`/api/jobs/${id}/apply`, {}, config);

            toast.success(`Successfully applied to ${job.title}!`);
            navigate('/dashboard');
        } catch (error) {
            console.error('Error applying to job:', error);
            const msg = error.response?.data?.message || 'Error applying to job. Please try again.';
            setNotification({
                type: 'error',
                message: msg
            });
            toast.error(msg);
        } finally {
            setIsApplying(false);
        }
    };

    const handleSaveJob = () => {
        if (!job) return;
        try {
            const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
            const jobId = job._id;

            if (isSaved) {
                // Remove from saved jobs
                const updatedSavedJobs = savedJobs.filter(j => j.id !== jobId);
                localStorage.setItem('savedJobs', JSON.stringify(updatedSavedJobs));
                setIsSaved(false);
                toast.success('Job removed from saved jobs');
            } else {
                // Add to saved jobs
                const savedJob = {
                    id: jobId,
                    title: job.title,
                    company: typeof job.company === 'object' ? job.company.companyName : 'Tech Corp',
                    savedDate: new Date().toISOString()
                };

                savedJobs.push(savedJob);
                localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
                setIsSaved(true);
                toast.success('Job saved successfully');
            }
        } catch (error) {
            console.error('Error saving job:', error);
            toast.error('Error saving job. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Job not found</h2>
                    <p className="mt-2 text-gray-600">The job you're looking for doesn't exist or has been removed.</p>
                </div>
            </div>
        );
    }

    const companyName = typeof job.company === 'object' ? job.company.companyName : 'Tech Corp';
    const salaryString = job.salary 
        ? `${job.salary.currency || 'USD'} ${job.salary.min?.toLocaleString() || ''} - ${job.salary.max?.toLocaleString() || ''}`
        : 'Not specified';
    const accessibilityFeatures = getAccessibilityFeatures(job);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {notification && (
                <Notification
                    type={notification.type}
                    message={notification.message}
                    onClose={() => setNotification(null)}
                />
            )}

            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="p-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                            <p className="text-xl text-gray-600 mb-4">{companyName}</p>
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={handleSaveJob}
                                className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSaved
                                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                        : 'bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50'
                                    }`}
                            >
                                {isSaved ? 'Saved' : 'Save Job'}
                            </button>
                            {user?.role !== 'employer' && (
                                <button
                                    onClick={handleApply}
                                    disabled={isApplying}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isApplying ? 'Applying...' : 'Apply Now'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 text-sm text-gray-500">
                        <div>
                            <span className="font-medium text-gray-900">Location:</span> {job.location}
                        </div>
                        <div>
                            <span className="font-medium text-gray-900">Job Type:</span> {job.type}
                        </div>
                        <div>
                            <span className="font-medium text-gray-900">Salary:</span> {salaryString}
                        </div>
                        <div>
                            <span className="font-medium text-gray-900">Posted:</span>{' '}
                            {new Date(job.createdAt || job.postedDate).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                        <p className="text-gray-600 whitespace-pre-line">{job.description}</p>
                    </div>

                    {job.requirements && job.requirements.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
                            <ul className="list-disc list-inside text-gray-600 space-y-2">
                                {job.requirements.map((req, index) => (
                                    <li key={index}>{req}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {job.skills && job.skills.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Skills Required</h2>
                            <div className="flex flex-wrap gap-2">
                                {job.skills.map((skill, index) => (
                                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {accessibilityFeatures.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Accessibility Features</h2>
                            <div className="flex flex-wrap gap-2">
                                {accessibilityFeatures.map((feature, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                                    >
                                        {feature}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {job.applicationDeadline && (
                    <div className="bg-gray-50 px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Application Deadline:{' '}
                                <span className="font-medium text-gray-900">
                                    {new Date(job.applicationDeadline).toLocaleDateString()}
                                </span>
                            </div>
                            {user?.role !== 'employer' && (
                                <button
                                    onClick={handleApply}
                                    disabled={isApplying}
                                    className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isApplying ? 'Applying...' : 'Apply Now'}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobDetail;

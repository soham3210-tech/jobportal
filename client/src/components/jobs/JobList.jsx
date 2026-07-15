import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from 'axios';
import LoadingSpinner from '../common/LoadingSpinner';

const JobList = () => {
    const [jobs, setJobs] = useState([]);
    const [location, setLocation] = useState('');
    const [jobType, setJobType] = useState('All Types');
    const [accessibilityFeature, setAccessibilityFeature] = useState('All Features');
    const [remoteOnly, setRemoteOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchJobs = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = {
                page,
                limit: 10
            };
            if (location.trim()) {
                params.location = location.trim();
            }
            if (jobType !== 'All Types') {
                params.type = jobType;
            }
            if (accessibilityFeature !== 'All Features') {
                params.accessibility = accessibilityFeature;
            }
            if (remoteOnly) {
                params.remoteWork = 'true';
            }

            const res = await API.get('/api/jobs', { params });
            const responseData = res.data;
            
            // Safely handle both array responses and object responses { jobs: [], totalPages: 1 }
            const jobsData = Array.isArray(responseData) ? responseData : (responseData.jobs || []);
            const totalPagesData = Array.isArray(responseData) ? 1 : (responseData.totalPages || 1);
            
            setJobs(jobsData);
            setTotalPages(totalPagesData);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            setJobs([]);
        } finally {
            setIsLoading(false);
        }
    }, [location, jobType, accessibilityFeature, remoteOnly, page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchJobs();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchJobs]);

    const jobTypes = ['All Types', 'Full-time', 'Part-time', 'Contract', 'Internship'];
    const accessibilityFeatures = [
        'All Features',
        'Remote Work',
        'Flexible Hours',
        'Wheelchair Accessible',
        'Assistive Technology',
        'Flexible Schedule'
    ];

    const getAccessibilityFeaturesArray = (job) => {
        if (!job.accessibility) return [];
        // Handle case where accessibility is returned as a simple array of strings
        if (Array.isArray(job.accessibility)) return job.accessibility;
        
        const features = [];
        if (job.accessibility.remoteWork) features.push('Remote Work');
        if (job.accessibility.flexibleHours) features.push('Flexible Hours');
        if (job.accessibility.wheelchairAccessible) features.push('Wheelchair Accessible');
        if (job.accessibility.assistiveTechnology?.available) {
            features.push('Assistive Technology');
        }
        if (Array.isArray(job.accessibility.accommodations)) {
            features.push(...job.accessibility.accommodations);
        }
        return features;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Available Jobs</h1>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-100">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                            type="text"
                            className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
                            placeholder="Enter city or remote"
                            value={location}
                            onChange={(e) => {
                                setLocation(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                        <select
                            className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm h-[38px] p-1"
                            value={jobType}
                            onChange={(e) => {
                                setJobType(e.target.value);
                                setPage(1);
                            }}
                        >
                            {jobTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Accessibility Features</label>
                        <select
                            className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm h-[38px] p-1"
                            value={accessibilityFeature}
                            onChange={(e) => {
                                setAccessibilityFeature(e.target.value);
                                setPage(1);
                            }}
                        >
                            {accessibilityFeatures.map(feature => (
                                <option key={feature} value={feature}>{feature}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end pb-2">
                        <label className="flex items-center cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-4 w-4"
                                checked={remoteOnly}
                                onChange={(e) => {
                                    setRemoteOnly(e.target.checked);
                                    setPage(1);
                                }}
                            />
                            <span className="ml-2 text-sm text-gray-600 font-medium">Remote Work Only</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Job Listings */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
                    <p className="text-gray-500">No jobs found matching your criteria.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {jobs.map((job, index) => {
                        // Safe fallback for unique keys
                        const jobId = job._id || job.id || index;
                        
                        // Safely resolve company name whether it's a string or an object
                        const companyName = typeof job.company === 'object' && job.company !== null 
                            ? (job.company.companyName || job.company.name || 'Unknown Company') 
                            : (typeof job.company === 'string' ? job.company : 'Unknown Company');
                            
                        // Safely resolve salary whether it's a pre-formatted string or an object
                        const salaryString = typeof job.salary === 'string' 
                            ? job.salary 
                            : (job.salary && (job.salary.min || job.salary.max)
                                ? `${job.salary.currency || 'USD'} ${job.salary.min ? job.salary.min.toLocaleString() : ''}${job.salary.min && job.salary.max ? ' - ' : ''}${job.salary.max ? job.salary.max.toLocaleString() : ''}` 
                                : 'Not specified');
                                
                        const accessibilityFeaturesList = getAccessibilityFeaturesArray(job);

                        return (
                            <div key={jobId} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <Link to={`/jobs/${jobId}`} className="text-xl font-semibold text-gray-900 hover:text-indigo-600 transition-colors duration-200">
                                            {job.title || 'Untitled Job'}
                                        </Link>
                                        <p className="text-indigo-600 font-medium">{companyName}</p>
                                    </div>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 capitalize">
                                        {job.type || 'Full-time'}
                                    </span>
                                </div>
                                <div className="mb-4">
                                    <p className="text-gray-600 mb-2 line-clamp-2">{job.description || 'No description available.'}</p>
                                    <div className="flex items-center text-gray-500 text-sm font-medium">
                                        <svg className="h-4 w-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                        {job.location || 'Location not specified'}
                                    </div>
                                </div>

                                {job.requirements && job.requirements.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-gray-900 font-semibold text-sm mb-2">Requirements:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {job.requirements.slice(0, 3).map((req, reqIndex) => (
                                                <span key={reqIndex} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {req}
                                                </span>
                                            ))}
                                            {job.requirements.length > 3 && (
                                                <span className="text-xs text-gray-500 self-center font-medium">+{job.requirements.length - 3} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {accessibilityFeaturesList.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-gray-900 font-semibold text-sm mb-2">Accessibility:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {accessibilityFeaturesList.map((feature, featIndex) => (
                                                <span key={featIndex} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm border-t border-gray-50 pt-4 mt-4">
                                    <span className="text-gray-500 font-medium">
                                        Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : (job.postedDate || 'Recently')}
                                    </span>
                                    <span className="font-bold text-gray-900">{salaryString}</span>
                                </div>
                                <Link
                                    to={`/jobs/${jobId}`}
                                    className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition"
                                >
                                    View Details
                                </Link>
                            </div>
                        );
                    })}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            <button
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                                className="px-3 py-1 rounded bg-white border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 text-sm font-medium self-center text-gray-700">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={page === totalPages}
                                className="px-3 py-1 rounded bg-white border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default JobList;
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import API from '../../api';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const ProgressBar = ({ value, maxValue, color }) => {
    const percentage = (value / maxValue) * 100;
    return (
        <div className="w-full bg-gray-200 rounded-full h-2">
            <div
                className={`h-2 rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
};

const StatCard = ({ title, value, icon, bgColor = "bg-indigo-100", textColor = "text-indigo-600" }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center">
            <div className={`p-3 rounded-xl ${bgColor} ${textColor}`}>
                {icon}
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('applications');
    const [isLoading, setIsLoading] = useState(true);
    const [applications, setApplications] = useState([]);
    const [savedJobs, setSavedJobs] = useState([]);
    
    // Employer states
    const [employerJobs, setEmployerJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);

    const isEmployer = user?.role === 'employer';

    const loadCandidateData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { 'x-auth-token': token }
            };

            // 1. Fetch applications from database
            const res = await API.get('/api/jobs/applications/mine', config);
            setApplications(res.data);

            // 2. Fetch saved jobs from localStorage
            const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
            setSavedJobs(saved);
        } catch (error) {
            console.error('Error loading candidate data:', error);
            toast.error('Failed to load application data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadEmployerData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Fetch jobs posted by this employer
            const res = await API.get(`/api/jobs?company=${user._id || user.id}`);
            setEmployerJobs(res.data.jobs || []);
        } catch (error) {
            console.error('Error loading employer jobs:', error);
            toast.error('Failed to load posted jobs');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const fetchApplicants = useCallback(async (jobId) => {
        setIsLoadingApplicants(true);
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { 'x-auth-token': token }
            };
            const res = await API.get(`/api/jobs/${jobId}/applicants`, config);
            setApplicants(res.data);
        } catch (error) {
            console.error('Error fetching applicants:', error);
            toast.error('Failed to load applicant list');
        } finally {
            setIsLoadingApplicants(false);
        }
    }, []);

    useEffect(() => {
        if (isEmployer) {
            loadEmployerData();
        } else {
            loadCandidateData();
        }
    }, [isEmployer, loadCandidateData, loadEmployerData]);

    const handleSelectJob = (job) => {
        setSelectedJob(job);
        fetchApplicants(job._id);
    };

    const handleStatusUpdate = async (applicationId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            };

            await API.put(`/api/jobs/applications/${applicationId}/status`, { status: newStatus }, config);
            toast.success('Applicant status updated successfully!');
            
            // Refresh applicant list
            if (selectedJob) {
                fetchApplicants(selectedJob._id);
            }
        } catch (error) {
            console.error('Error updating applicant status:', error);
            toast.error('Failed to update status');
        }
    };

    // Calculate stats
    const stats = isEmployer 
        ? {
            totalJobs: employerJobs.length,
            activeJobs: employerJobs.filter(j => j.status !== 'closed').length,
            closedJobs: employerJobs.filter(j => j.status === 'closed').length
          }
        : {
            total: applications.length,
            interviews: applications.filter(a => a.status === 'Interview').length,
            offers: applications.filter(a => a.status === 'Offered').length,
            responseRate: applications.length 
                ? Math.round((applications.filter(a => a.status !== 'Applied').length / applications.length) * 100) 
                : 0
          };

    const statusOptions = ['Applied', 'In Review', 'Interview', 'Offered', 'Rejected'];
    const statusColors = {
        Applied: 'bg-blue-600',
        'In Review': 'bg-yellow-500',
        Interview: 'bg-purple-600',
        Offered: 'bg-green-600',
        Rejected: 'bg-red-600'
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-md p-8 mb-8 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold mb-2">
                            Welcome back, {user?.firstName || user?.companyName || 'User'}! 👋
                        </h1>
                        <p className="text-indigo-100 text-lg">
                            {isEmployer 
                                ? 'Post job listings, manage applications, and find top talent.' 
                                : 'Track your applications, resume analyses, and save interesting jobs.'}
                        </p>
                    </div>
                    {isEmployer && (
                        <Link
                            to="/jobs/create"
                            className="bg-white text-indigo-600 font-semibold px-5 py-2.5 rounded-lg shadow hover:bg-indigo-50 transition"
                        >
                            Post a Job
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {isEmployer ? (
                    <>
                        <StatCard 
                            title="Total Posted Jobs" 
                            value={stats.totalJobs} 
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            } 
                        />
                        <StatCard 
                            title="Active Jobs" 
                            value={stats.activeJobs} 
                            bgColor="bg-green-100"
                            textColor="text-green-600"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            } 
                        />
                        <StatCard 
                            title="Closed Jobs" 
                            value={stats.closedJobs} 
                            bgColor="bg-gray-100"
                            textColor="text-gray-600"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            } 
                        />
                    </>
                ) : (
                    <>
                        <StatCard 
                            title="Total Applications" 
                            value={stats.total} 
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            } 
                        />
                        <StatCard 
                            title="Interviews" 
                            value={stats.interviews} 
                            bgColor="bg-purple-100"
                            textColor="text-purple-600"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                </svg>
                            } 
                        />
                        <StatCard 
                            title="Offers Received" 
                            value={stats.offers} 
                            bgColor="bg-green-100"
                            textColor="text-green-600"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            } 
                        />
                        <StatCard 
                            title="Employer Response Rate" 
                            value={`${stats.responseRate}%`} 
                            bgColor="bg-blue-100"
                            textColor="text-blue-600"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            } 
                        />
                    </>
                )}
            </div>

            {/* Main Dashboard Panel */}
            {isEmployer ? (
                /* EMPLOYER INTERFACE */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Posted Jobs list */}
                    <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-3">Your Posted Jobs</h2>
                        {employerJobs.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 mb-4">You have not posted any jobs yet.</p>
                                <Link to="/jobs/create" className="text-indigo-600 font-semibold hover:underline">
                                    Post Your First Job &rarr;
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                {employerJobs.map(job => (
                                    <button
                                        key={job._id}
                                        onClick={() => handleSelectJob(job)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                                            selectedJob?._id === job._id 
                                                ? 'bg-indigo-50 border-indigo-200' 
                                                : 'bg-white border-gray-100 hover:border-indigo-100'
                                        }`}
                                    >
                                        <h3 className="font-bold text-gray-900 text-base">{job.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{job.location} &bull; {job.type}</p>
                                        <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                                            job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {job.status}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Applicants list */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-3">
                            {selectedJob ? `Applicants for: ${selectedJob.title}` : 'Select a Job to View Applicants'}
                        </h2>

                        {!selectedJob ? (
                            <div className="text-center py-20 text-gray-400">
                                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                </svg>
                                <p className="text-base font-medium">Click on any job listing on the left to see candidate applications.</p>
                            </div>
                        ) : isLoadingApplicants ? (
                            <div className="flex justify-center py-20">
                                <LoadingSpinner />
                            </div>
                        ) : applicants.length === 0 ? (
                            <div className="text-center py-20 text-gray-500">
                                <p className="text-lg">No candidates have applied to this job listing yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {applicants.map(app => {
                                    const candidate = app.candidate;
                                    const name = candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidate';
                                    const email = candidate?.email;
                                    const profile = candidate?.profile || {};

                                    return (
                                        <div key={app._id} className="p-6 border border-gray-100 rounded-xl hover:border-gray-200 shadow-sm transition">
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">{name}</h3>
                                                    <p className="text-sm text-indigo-600 font-medium">{email}</p>
                                                    {profile.disability && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Disability Preference: <span className="font-semibold">{profile.disability}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <label className="text-sm text-gray-600 font-semibold">Status:</label>
                                                    <select
                                                        value={app.status}
                                                        onChange={(e) => handleStatusUpdate(app._id, e.target.value)}
                                                        className="rounded-lg border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500 py-1.5 px-3 h-[36px]"
                                                    >
                                                        {statusOptions.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {profile.skills && profile.skills.length > 0 && (
                                                <div className="mb-3">
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Skills</h4>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {profile.skills.map((skill, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-50 pt-3 mt-3">
                                                <span>Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                                                {app.resumeUrl && (
                                                    <a 
                                                        href={app.resumeUrl} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        className="text-indigo-600 font-semibold hover:underline"
                                                    >
                                                        View Resume &rarr;
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* CANDIDATE INTERFACE */
                <div>
                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-8">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('applications')}
                                className={`${activeTab === 'applications'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
                            >
                                Your Applications ({applications.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('saved')}
                                className={`${activeTab === 'saved'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
                            >
                                Saved Jobs ({savedJobs.length})
                            </button>
                        </nav>
                    </div>

                    {/* Applications Tab */}
                    {activeTab === 'applications' && (
                        <div className="space-y-6">
                            {applications.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                                    <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h3 className="mt-4 text-lg font-semibold text-gray-900">No applications found</h3>
                                    <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                                        You haven't submitted any job applications yet. Go search available jobs to apply!
                                    </p>
                                    <div className="mt-6">
                                        <Link
                                            to="/jobs"
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition"
                                        >
                                            Browse Available Jobs
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {applications.map((app) => {
                                        const job = app.job;
                                        if (!job) return null;
                                        const companyName = typeof job.company === 'object' ? job.company.companyName : 'Tech Corp';
                                        
                                        return (
                                            <div key={app._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                                                        <p className="text-sm text-gray-500 font-semibold">{companyName}</p>
                                                    </div>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                                                        app.status === 'Offered' ? 'bg-green-100 text-green-800' :
                                                        app.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                        app.status === 'Interview' ? 'bg-purple-100 text-purple-800' :
                                                        app.status === 'In Review' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {app.status}
                                                    </span>
                                                </div>

                                                <div className="mb-4">
                                                    <div className="flex justify-between text-xs font-medium text-gray-500 mb-1.5">
                                                        <span>Application Progress Tracker</span>
                                                        <span className="font-semibold text-gray-800">
                                                            {statusOptions.indexOf(app.status) + 1} of {statusOptions.length} stages
                                                        </span>
                                                    </div>
                                                    <ProgressBar
                                                        value={statusOptions.indexOf(app.status) + 1}
                                                        maxValue={statusOptions.length}
                                                        color={statusColors[app.status]}
                                                    />
                                                </div>

                                                <div className="flex justify-between items-center text-sm font-semibold border-t border-gray-50 pt-4 mt-4">
                                                    <span className="text-gray-400 font-normal">
                                                        Applied on {new Date(app.appliedAt).toLocaleDateString()}
                                                    </span>
                                                    <Link
                                                        to={`/jobs/${job._id}`}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        View Job Details &rarr;
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Saved Jobs Tab */}
                    {activeTab === 'saved' && (
                        <div className="space-y-6">
                            {savedJobs.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                                    <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                    <h3 className="mt-4 text-lg font-semibold text-gray-900">No saved jobs</h3>
                                    <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                                        Bookmark interesting jobs to view them here and apply later.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {savedJobs.map((job) => (
                                        <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h3>
                                                <p className="text-sm text-indigo-600 font-medium mb-3">{job.company}</p>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-gray-400 mt-4 border-t border-gray-50 pt-3">
                                                <span>Saved on {new Date(job.savedDate).toLocaleDateString()}</span>
                                                <Link
                                                    to={`/jobs/${job.id}`}
                                                    className="text-indigo-600 font-semibold hover:underline"
                                                >
                                                    View Details &rarr;
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;

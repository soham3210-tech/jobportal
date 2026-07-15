import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const ResumeBuilder = () => {
    const [file, setFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error('Please select a file to upload');
            return;
        }

        const formData = new FormData();
        formData.append('resume', file);

        setIsAnalyzing(true);
        try {
            const res = await axios.post('/api/analyze-resume', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setResults(res.data);
            toast.success('Resume analyzed successfully!');
        } catch (error) {
            console.error('Error analyzing resume:', error);
            toast.error(error.response?.data?.error || 'Failed to analyze resume');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">AI Resume Analyzer & Builder</h1>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Upload Resume for ATS Scoring</h2>
                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Choose resume file (PDF, DOC, DOCX)
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 file:hover:bg-indigo-100"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isAnalyzing}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                        {isAnalyzing ? 'Analyzing Resume...' : 'Analyze Resume'}
                    </button>
                </form>
            </div>

            {results && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-2xl font-bold mb-4">ATS Analysis Results</h2>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="text-5xl font-extrabold text-indigo-600">{results.score}%</div>
                        <div className="text-lg font-medium text-gray-700">Overall ATS Compatibility Score</div>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Actionable Suggestions</h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-600">
                                {results.suggestions.map((suggestion, index) => (
                                    <li key={index}>{suggestion}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-2">Technical Skills Found</h4>
                                <div className="flex flex-wrap gap-1">
                                    {results.details.skillsFound.map((skill, index) => (
                                        <span key={index} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-2">Action Verbs Found</h4>
                                <div className="flex flex-wrap gap-1">
                                    {results.details.verbsFound.map((verb, index) => (
                                        <span key={index} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                            {verb}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-2">Soft Skills Found</h4>
                                <div className="flex flex-wrap gap-1">
                                    {results.details.softSkillsFound.map((skill, index) => (
                                        <span key={index} className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumeBuilder;

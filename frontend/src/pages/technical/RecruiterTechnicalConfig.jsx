import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const RecruiterTechnicalConfig = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState(null);
  const [config, setConfig] = useState({
    technical_enabled: false,
    technical_duration_minutes: 30,
    technical_question_count: 5,
    technical_topics: []
  });

  const availableTopics = [
    'Data Structures',
    'Algorithms',
    'OOP',
    'System Design',
    'Web Development',
    'Database',
    'Operating Systems'
  ];

  useEffect(() => {
    loadJobConfig();
  }, [jobId]);

  const loadJobConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const jobData = response.data.data;
      setJob(jobData);
      setConfig({
        technical_enabled: jobData.technical_enabled || false,
        technical_duration_minutes: jobData.technical_duration_minutes || 30,
        technical_question_count: jobData.technical_question_count || 5,
        technical_topics: jobData.technical_topics || []
      });
    } catch (error) {
      console.error('Failed to load job config:', error);
      alert('Failed to load job configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/api/jobs/${jobId}`,
        config,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Technical interview configuration saved successfully!');
      navigate(`/recruiter/jobs/${jobId}`);
    } catch (error) {
      console.error('Failed to save config:', error);
      alert(error.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTopicToggle = (topic) => {
    setConfig(prev => {
      const topics = prev.technical_topics || [];
      if (topics.includes(topic)) {
        return { ...prev, technical_topics: topics.filter(t => t !== topic) };
      } else {
        return { ...prev, technical_topics: [...topics, topic] };
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:text-indigo-800 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Technical Interview Configuration
          </h1>
          <p className="text-gray-600 mt-2">
            Configure AI-powered technical interview for: {job?.title}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Enable Technical Interview
              </h3>
              <p className="text-sm text-gray-600">
                Allow candidates to take AI-powered voice/text technical interviews
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.technical_enabled}
                onChange={(e) => setConfig(prev => ({ ...prev, technical_enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {config.technical_enabled && (
            <>
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Duration (minutes)
                </label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={config.technical_duration_minutes}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    technical_duration_minutes: parseInt(e.target.value) 
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Recommended: 30-45 minutes
                </p>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={config.technical_question_count}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    technical_question_count: parseInt(e.target.value) 
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Recommended: 5-8 questions
                </p>
              </div>

              {/* Topics */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Topics to Cover
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  Leave all unchecked to include all topics. Select specific topics to focus the interview.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {availableTopics.map(topic => (
                    <label
                      key={topic}
                      className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={config.technical_topics.includes(topic)}
                        onChange={() => handleTopicToggle(topic)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">{topic}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  How it works:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>AI interviewer reads questions aloud using text-to-speech</li>
                  <li>Candidates answer using voice (speech recognition) or text</li>
                  <li>AI evaluates answers on correctness, depth, and clarity</li>
                  <li>Instant feedback and scoring after each answer</li>
                  <li>Final score averaged across all questions</li>
                </ul>
              </div>

              {/* Browser Compatibility Warning */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">
                  Browser Requirements:
                </h4>
                <p className="text-sm text-yellow-800">
                  Speech recognition works best on Chrome and Edge browsers. 
                  Firefox and Safari have limited support. Candidates can always 
                  use text input as a fallback.
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterTechnicalConfig;

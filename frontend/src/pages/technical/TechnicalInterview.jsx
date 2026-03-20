import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpeechRecognition, useTextToSpeech } from '../../hooks/useSpeechRecognition';
import technicalService from '../../services/technical';
import {
  StopCircleIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const TechnicalInterview = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(true);
  const [showFeedback, setShowFeedback] = useState({});
  const [error, setError] = useState(null);

  const {
    transcript,
    isListening,
    isSupported: isSpeechRecognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript
  } = useSpeechRecognition();

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: isTTSSupported
  } = useTextToSpeech();

  const timerRef = useRef(null);
  const hasSpokenRef = useRef({});

  // Load interview
  useEffect(() => {
    const loadInterview = async () => {
      try {
        setLoading(true);
        const response = await technicalService.start(jobId);
        setInterview(response.data);

        // Load existing answers if resuming
        if (response.data.responses && response.data.responses.length > 0) {
          const existingAnswers = {};
          response.data.responses.forEach(r => {
            existingAnswers[r.questionId] = r.answer;
          });
          setAnswers(existingAnswers);
        }

        // Calculate time remaining
        if (response.data.endsAt) {
          const endsAt = new Date(response.data.endsAt);
          const now = new Date();
          const remaining = Math.max(0, Math.floor((endsAt - now) / 1000));
          setTimeRemaining(remaining);
        }

        setError(null);
      } catch (err) {
        console.error('Failed to load interview:', err);
        setError(err.response?.data?.message || 'Failed to load interview');
      } finally {
        setLoading(false);
      }
    };

    loadInterview();
  }, [jobId]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmitInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining]);

  // Auto-speak current question
  useEffect(() => {
    if (!interview || !autoSpeakEnabled || !isTTSSupported) return;

    const currentQuestion = interview.questions[currentQuestionIndex];
    if (currentQuestion && !hasSpokenRef.current[currentQuestion.id]) {
      speak(currentQuestion.question)
        .then(() => {
          hasSpokenRef.current[currentQuestion.id] = true;
        })
        .catch(err => console.error('TTS error:', err));
    }
  }, [currentQuestionIndex, interview, autoSpeakEnabled, isTTSSupported, speak]);

  // Update answer from transcript
  useEffect(() => {
    if (interview && transcript) {
      const currentQuestion = interview.questions[currentQuestionIndex];
      if (currentQuestion) {
        setAnswers(prev => ({
          ...prev,
          [currentQuestion.id]: transcript
        }));
      }
    }
  }, [transcript, currentQuestionIndex, interview]);

  const currentQuestion = interview?.questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] || '' : '';

  const handleStartRecording = () => {
    resetTranscript();
    startListening();
  };

  const handleStopRecording = () => {
    stopListening();
  };

  const handleManualInput = (value) => {
    if (currentQuestion) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: value
      }));
      setTranscript(value);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !currentAnswer.trim()) {
      alert('Please provide an answer before submitting');
      return;
    }

    try {
      setSubmitting(true);
      const response = await technicalService.submitAnswer(
        interview.attemptId,
        currentQuestion.id,
        currentAnswer
      );

      setShowFeedback(prev => ({
        ...prev,
        [currentQuestion.id]: response.data
      }));

      // Auto-advance to next question after 3 seconds
      setTimeout(() => {
        if (currentQuestionIndex < interview.questions.length - 1) {
          handleNextQuestion();
        }
      }, 3000);

    } catch (err) {
      console.error('Failed to submit answer:', err);
      alert(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < interview.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      resetTranscript();
      stopListening();
      stopSpeaking();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      resetTranscript();
      stopListening();
      stopSpeaking();
    }
  };

  const handleSubmitInterview = async () => {
    if (!interview) return;

    const confirmed = window.confirm(
      'Are you sure you want to submit your interview? You cannot make changes after submission.'
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);
      await technicalService.submit(interview.attemptId);
      alert('Interview submitted successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to submit interview:', err);
      alert(err.response?.data?.message || 'Failed to submit interview');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplayQuestion = () => {
    if (currentQuestion && isTTSSupported) {
      speak(currentQuestion.question);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!interview) {
    return null;
  }

  const progress = ((currentQuestionIndex + 1) / interview.questions.length) * 100;
  const answeredCount = Object.keys(answers).filter(k => answers[k]?.trim()).length;
  const feedback = showFeedback[currentQuestion?.id];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Technical Interview</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <ClockIcon className="w-5 h-5" />
                <span className={`font-mono text-lg ${timeRemaining < 300 ? 'text-red-600' : ''}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <button
                onClick={handleSubmitInterview}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                Submit Interview
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Question {currentQuestionIndex + 1} of {interview.questions.length}</span>
              <span>{answeredCount} answered</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Browser support warnings */}
          {!isSpeechRecognitionSupported && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ Speech recognition is not supported in your browser. Please use Chrome or Edge for the best experience.
              </p>
            </div>
          )}
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                  {currentQuestion?.topic || 'General'}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {currentQuestion?.difficulty || 'Medium'}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {currentQuestion?.question}
              </h2>
            </div>

            {/* TTS Controls */}
            <div className="flex gap-2">
              {isTTSSupported && (
                <>
                  <button
                    onClick={handleReplayQuestion}
                    disabled={isSpeaking}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Replay question"
                  >
                    <SpeakerWaveIcon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setAutoSpeakEnabled(!autoSpeakEnabled)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                    title={autoSpeakEnabled ? 'Disable auto-speak' : 'Enable auto-speak'}
                  >
                    {autoSpeakEnabled ? (
                      <SpeakerWaveIcon className="w-6 h-6" />
                    ) : (
                      <SpeakerXMarkIcon className="w-6 h-6" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Answer Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Your Answer
              </label>
              
              {/* Recording Controls */}
              {isSpeechRecognitionSupported && (
                <div className="flex gap-2">
                  {!isListening ? (
                    <button
                      onClick={handleStartRecording}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      <MicrophoneIcon className="w-5 h-5" />
                      <span>Start Recording</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 animate-pulse"
                    >
                      <StopCircleIcon className="w-5 h-5" />
                      <span>Stop Recording</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <textarea
              value={currentAnswer}
              onChange={(e) => handleManualInput(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Speak your answer or type here..."
            />

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {currentAnswer.length} characters
              </span>
              
              <button
                onClick={handleSubmitAnswer}
                disabled={!currentAnswer.trim() || submitting}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>Submit Answer</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Display */}
          {feedback && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Evaluation Results</h3>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <span className="text-sm text-gray-600">Correctness:</span>
                  <span className="ml-2 font-bold text-green-700">{feedback.correctness}/10</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Depth:</span>
                  <span className="ml-2 font-bold text-green-700">{feedback.depth}/10</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Clarity:</span>
                  <span className="ml-2 font-bold text-green-700">{feedback.clarity}/10</span>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                <strong>Overall Score:</strong> {feedback.score}/10
              </p>
              <p className="text-sm text-gray-700 mt-2">
                <strong>Feedback:</strong> {feedback.feedback}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === interview.questions.length - 1}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-50 disabled:opacity-50"
          >
            <span>Next</span>
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Question Navigator */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Question Navigator</h3>
          <div className="grid grid-cols-5 gap-3">
            {interview.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentQuestionIndex(idx);
                  resetTranscript();
                  stopListening();
                }}
                className={`p-3 rounded-lg text-center transition-colors ${
                  idx === currentQuestionIndex
                    ? 'bg-indigo-600 text-white'
                    : answers[q.id]?.trim()
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Q{idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalInterview;

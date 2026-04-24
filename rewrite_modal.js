const fs = require('fs');

const FILE = 'frontend/src/pages/recruiter/RecruiterScores.jsx';
let content = fs.readFileSync(FILE, 'utf-8');

const OLD_MODAL_PART = `<div className="grid md:grid-cols-2 gap-8 mb-8">
                                  {/* Left: Key Skills */}
                                  <div>
                                      <h3 className="text-sm font-bold text-white mb-3">Key Skills</h3>
                                      <div className="flex flex-wrap gap-2">
                                          {(selectedInsight.resume_score_breakdown?.skills || selectedInsight.candidateData?.primary_skills || []).length > 0 ? (
                                              (selectedInsight.resume_score_breakdown?.skills || selectedInsight.candidateData?.primary_skills).slice(0, 15).map((s, i) => (
                                                  <span key={i} className="px-3 py-1 bg-white/10 hover:bg-white/20 transition-colors text-zinc-300 rounded-full text-xs font-medium cursor-default">{s}</span>
                                              ))
                                          ) : (
                                              <span className="text-xs text-zinc-500">Not specified</span>
                                          )}
                                      </div>
                                  </div>

                                  {/* Right: Experience & Education */}
                                  <div>
                                      <h3 className="text-sm font-bold text-white mb-3">Experience & Education</h3>
                                      <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                                          <strong className="text-zinc-300">Experience:</strong> {selectedInsight.resume_score_breakdown?.professional_summary || selectedInsight.resume_summary || selectedInsight.summary || 'Experience details evaluated from resume.'}
                                      </p>
                                      <p className="text-xs text-zinc-400 leading-relaxed">
                                          <strong className="text-zinc-300">Education:</strong> {(selectedInsight.resume_score_breakdown?.education || []).length > 0 ? selectedInsight.resume_score_breakdown.education.join(' • ') : 'Education details evaluated from resume.'}
                                      </p>
                                  </div>
                              </div>`;

const NEW_MODAL_PART = `                              {/* AI Holistic Assessment Full Width */}
                              <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-xl relative">
                                  <div className="absolute -top-3 left-4 bg-[#121212] px-2 text-sm font-bold text-blue-400">AI Comprehensive Overview</div>
                                  <div className="text-sm text-zinc-300 leading-relaxed space-y-4 whitespace-pre-wrap">
                                      {selectedInsight.overall_summary || 'Detailed holistic evaluation not available yet. Please complete rounds and rank to generate.'}
                                  </div>
                              </div>

                              <div className="grid md:grid-cols-2 gap-8 mb-8">
                                  {/* Left: Key Skills */}
                                  <div>
                                      <h3 className="text-sm font-bold text-white mb-3">Key Skills</h3>
                                      <div className="flex flex-wrap gap-2">
                                          {(selectedInsight.resume_score_breakdown?.skills || selectedInsight.candidateData?.primary_skills || []).length > 0 ? (
                                              (selectedInsight.resume_score_breakdown?.skills || selectedInsight.candidateData?.primary_skills).slice(0, 15).map((s, i) => (
                                                  <span key={i} className="px-3 py-1 bg-white/10 hover:bg-white/20 transition-colors text-zinc-300 rounded-full text-xs font-medium cursor-default">{s}</span>
                                              ))
                                          ) : (
                                              <span className="text-xs text-zinc-500">Not specified</span>
                                          )}
                                      </div>
                                  </div>

                                  {/* Right: Education */}
                                  <div>
                                      <h3 className="text-sm font-bold text-white mb-3">Education History</h3>
                                      <p className="text-sm text-zinc-400 leading-relaxed">
                                          {(selectedInsight.resume_score_breakdown?.education || []).length > 0 
                                            ? selectedInsight.resume_score_breakdown.education.join(' • ') 
                                            : 'No specific education details extracted from resume.'}
                                      </p>
                                  </div>
                              </div>`;

if(content.includes(OLD_MODAL_PART)) {
    content = content.replace(OLD_MODAL_PART, NEW_MODAL_PART);
    fs.writeFileSync(FILE, content);
    console.log("REPLACED!");
} else {
    console.log("NOT FOUND!");
}

import os
import json
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Set
from dotenv import load_dotenv
from dataclasses import dataclass

load_dotenv()

app = FastAPI(title="HireFlow AI - Hybrid Matching Service")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# ============================================================================
# MODELS
# ============================================================================

class Job(BaseModel):
    job_id: str
    job_title: str
    required_skills: List[str]

class MatchRequest(BaseModel):
    candidate_skills: List[str]
    jobs: List[Job]

class Recommendation(BaseModel):
    job_id: str
    job_title: str
    match_score: int = Field(ge=0, le=100)
    reason: str
    
    @field_validator('match_score', mode='before')
    @classmethod
    def score_must_be_valid(cls, v):
        if isinstance(v, (int, float)):
            if not 0 <= v <= 100:
                return max(0, min(100, int(v)))
            return int(v)
        return v

class MatchResponse(BaseModel):
    recommendations: List[Recommendation]

@dataclass
class SkillMatch:
    job_id: str
    job_title: str
    required_skills: List[str]
    exact_matches: Set[str]
    possible_matches: Set[str]
    missing_skills: Set[str]
    base_score: int
    candidate_skills: List[str]

# ============================================================================
# SKILL NORMALIZATION & MATCHING ENGINE
# ============================================================================

class SkillMatcher:
    """Rule-based skill matching and normalization"""
    
    # Skill aliases and equivalents
    SKILL_ALIASES = {
        'js': 'javascript',
        'javascript': 'javascript',
        'node': 'nodejs',
        'nodejs': 'nodejs',
        'node.js': 'nodejs',
        'py': 'python',
        'python': 'python',
        'react.js': 'react',
        'reactjs': 'react',
        'react': 'react',
        'ml': 'machine learning',
        'machine learning': 'machine learning',
        'ai': 'artificial intelligence',
        'artificial intelligence': 'artificial intelligence',
        'postgres': 'postgresql',
        'postgresql': 'postgresql',
        'mongo': 'mongodb',
        'mongodb': 'mongodb',
        'k8s': 'kubernetes',
        'kubernetes': 'kubernetes',
        'aws': 'amazon web services',
        'amazon web services': 'amazon web services',
        'gcp': 'google cloud',
        'google cloud platform': 'google cloud',
        'azure': 'microsoft azure',
        'microsoft azure': 'microsoft azure',
        'ts': 'typescript',
        'typescript': 'typescript',
        'rest': 'rest api',
        'rest api': 'rest api',
        'restful': 'rest api',
        'css3': 'css',
        'html5': 'html',
        'sql': 'sql',
        'mysql': 'sql',
        'nosql': 'nosql',
        'ci/cd': 'ci/cd',
        'cicd': 'ci/cd',
    }
    
    # Skill families - skills in the same family are related
    SKILL_FAMILIES = {
        'javascript_ecosystem': {'javascript', 'nodejs', 'react', 'vue', 'angular', 'typescript', 'nextjs', 'express'},
        'python_ecosystem': {'python', 'django', 'flask', 'fastapi', 'pandas', 'numpy'},
        'databases': {'postgresql', 'mysql', 'sql', 'mongodb', 'redis', 'nosql'},
        'cloud': {'aws', 'amazon web services', 'gcp', 'google cloud', 'azure', 'microsoft azure'},
        'devops': {'docker', 'kubernetes', 'ci/cd', 'jenkins', 'terraform', 'ansible'},
        'frontend': {'react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript'},
        'backend': {'nodejs', 'python', 'java', 'golang', 'ruby', 'php'},
        'ml_ai': {'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'artificial intelligence'},
        'mobile': {'react native', 'flutter', 'swift', 'kotlin', 'ios', 'android'},
        'testing': {'jest', 'pytest', 'selenium', 'cypress', 'unit testing', 'integration testing'},
    }
    
    # Soft skills that can be inferred
    SOFT_SKILLS = {
        'communication', 'teamwork', 'leadership', 'problem-solving', 
        'problem solving', 'collaboration', 'agile', 'scrum', 
        'stakeholder management', 'mentoring', 'ownership', 'adaptability'
    }
    
    @classmethod
    def normalize_skill(cls, skill: str) -> str:
        """Normalize a single skill"""
        skill_lower = skill.lower().strip()
        return cls.SKILL_ALIASES.get(skill_lower, skill_lower)
    
    @classmethod
    def normalize_skills(cls, skills: List[str]) -> List[str]:
        """Normalize a list of skills"""
        return [cls.normalize_skill(s) for s in skills]
    
    @classmethod
    def is_soft_skill(cls, skill: str) -> bool:
        """Check if a skill is a soft skill"""
        normalized = cls.normalize_skill(skill)
        return normalized in cls.SOFT_SKILLS
    
    @classmethod
    def get_skill_family(cls, skill: str) -> Optional[str]:
        """Get the family a skill belongs to"""
        normalized = cls.normalize_skill(skill)
        for family, skills in cls.SKILL_FAMILIES.items():
            if normalized in skills:
                return family
        return None
    
    @classmethod
    def are_related(cls, skill1: str, skill2: str) -> bool:
        """Check if two skills are related (same family)"""
        if skill1 == skill2:
            return True
        family1 = cls.get_skill_family(skill1)
        family2 = cls.get_skill_family(skill2)
        return family1 is not None and family1 == family2
    
    @classmethod
    def find_exact_matches(cls, candidate_skills: List[str], required_skills: List[str]) -> Set[str]:
        """Find exact matches between candidate and required skills"""
        candidate_normalized = set(cls.normalize_skills(candidate_skills))
        required_normalized = set(cls.normalize_skills(required_skills))
        return candidate_normalized.intersection(required_normalized)
    
    @classmethod
    def find_related_matches(cls, candidate_skills: List[str], required_skills: List[str]) -> Set[str]:
        """Find related skills (same family but not exact match)"""
        candidate_normalized = cls.normalize_skills(candidate_skills)
        required_normalized = cls.normalize_skills(required_skills)
        
        related = set()
        for req_skill in required_normalized:
            if cls.is_soft_skill(req_skill):
                continue
            for cand_skill in candidate_normalized:
                if req_skill != cand_skill and cls.are_related(req_skill, cand_skill):
                    related.add(req_skill)
                    break
        return related
    
    @classmethod
    def calculate_base_score(cls, candidate_skills: List[str], required_skills: List[str]) -> tuple:
        """
        Calculate base match score using rule-based logic
        Returns: (score, exact_matches, possible_matches, missing_skills)
        """
        if not required_skills:
            return 50, set(), set(), set()
        
        required_normalized = cls.normalize_skills(required_skills)
        
        # Separate hard and soft skills
        hard_skills = [s for s in required_normalized if not cls.is_soft_skill(s)]
        soft_skills = [s for s in required_normalized if cls.is_soft_skill(s)]
        
        # Find matches
        exact_matches = cls.find_exact_matches(candidate_skills, required_skills)
        related_matches = cls.find_related_matches(candidate_skills, required_skills)
        
        # Calculate missing skills
        all_required = set(required_normalized)
        all_matches = exact_matches.union(related_matches)
        missing_skills = all_required - all_matches
        
        # Scoring logic
        if not hard_skills:
            # Only soft skills required (rare case)
            score = (len(exact_matches) / len(required_skills)) * 100 if required_skills else 50
        else:
            # Primary score based on hard skills
            hard_exact = len([s for s in exact_matches if not cls.is_soft_skill(s)])
            hard_related = len([s for s in related_matches if not cls.is_soft_skill(s)])
            hard_total = len(hard_skills)
            
            # Hard skill score (0-85)
            hard_score = ((hard_exact * 1.0 + hard_related * 0.6) / hard_total) * 85
            
            # Soft skill bonus (0-15)
            soft_bonus = 0
            if soft_skills:
                soft_matches = len([s for s in exact_matches if cls.is_soft_skill(s)])
                soft_bonus = (soft_matches / len(soft_skills)) * 15
            else:
                # Infer soft skills from candidate profile
                candidate_normalized = set(cls.normalize_skills(candidate_skills))
                if any(s in candidate_normalized for s in ['agile', 'scrum', 'leadership', 'mentoring']):
                    soft_bonus = 10
            
            score = hard_score + soft_bonus
        
        return int(min(100, max(0, score))), exact_matches, related_matches, missing_skills

# ============================================================================
# LLM ENHANCEMENT SERVICE
# ============================================================================

class LLMEnhancer:
    """Uses LLM for semantic matching and explanation generation"""
    
    @staticmethod
    def enhance_matches(matches: List[SkillMatch], top_n: int = 5) -> List[Recommendation]:
        """
        Use LLM to:
        1. Find semantic similarities we might have missed
        2. Adjust scores based on soft skill inference
        3. Generate explanations
        4. Final ranking
        """
        
        if not OPENROUTER_API_KEY:
            # Fallback to rule-based only
            return LLMEnhancer._fallback_recommendations(matches, top_n)
        
        try:
            # Prepare data for LLM
            jobs_data = []
            for match in matches:
                jobs_data.append({
                    'job_id': match.job_id,
                    'job_title': match.job_title,
                    'required_skills': match.required_skills,
                    'exact_matches': list(match.exact_matches),
                    'possible_matches': list(match.possible_matches),
                    'missing_skills': list(match.missing_skills),
                    'base_score': match.base_score
                })
            
            system_prompt = """You are a job matching expert. You'll receive jobs with pre-calculated base scores from rule-based matching.

Your tasks:
1. Identify semantic similarities between candidate skills and missing required skills (e.g., "REST APIs" ↔ "API Development")
2. Infer soft skills from technical background (e.g., Agile experience suggests teamwork)
3. Adjust scores by ±10 points maximum based on your semantic analysis
4. Generate a concise, helpful explanation (1-2 sentences) for each match
5. Rank the top 5 jobs

Scoring adjustments:
- Strong semantic matches in missing skills: +5 to +10
- Soft skill inference from tech stack: +3 to +7
- Critical skill gaps: -5 to -10

Return valid JSON with this structure:
{
  "recommendations": [
    {
      "job_id": "string",
      "job_title": "string", 
      "match_score": 0-100,
      "reason": "Brief explanation of match quality and key gaps"
    }
  ]
}

Return exactly 5 recommendations, ordered by match_score (highest first)."""

            candidate_skills_str = ", ".join(matches[0].candidate_skills) if matches else ""
            
            response = requests.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "HireFlow AI"
                },
                json={
                    "model": "anthropic/claude-3.5-sonnet",  # More capable model
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {
                            "role": "user", 
                            "content": f"Candidate Skills: {candidate_skills_str}\n\nJobs with base scores:\n{json.dumps(jobs_data, indent=2)}\n\nAnalyze and return top 5 recommendations with adjusted scores and explanations."
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 2000
                },
                timeout=30
            )
            
            response_json = response.json()
            
            if "choices" not in response_json or not response_json["choices"]:
                print(f"Invalid LLM response: {response_json}")
                return LLMEnhancer._fallback_recommendations(matches, top_n)
            
            content = response_json["choices"][0]["message"]["content"]
            
            # Try to parse JSON (handle markdown code blocks)
            content = content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()
            
            result = json.loads(content)
            recommendations = result.get("recommendations", [])
            
            # Validate and convert to Recommendation objects
            validated_recs = []
            for rec in recommendations[:top_n]:
                try:
                    validated_recs.append(Recommendation(**rec))
                except Exception as e:
                    print(f"Invalid recommendation format: {e}")
                    continue
            
            if len(validated_recs) >= top_n:
                return validated_recs
            else:
                # Not enough valid recommendations, use fallback
                return LLMEnhancer._fallback_recommendations(matches, top_n)
                
        except Exception as e:
            print(f"LLM enhancement failed: {str(e)}")
            return LLMEnhancer._fallback_recommendations(matches, top_n)
    
    @staticmethod
    def _fallback_recommendations(matches: List[SkillMatch], top_n: int = 5) -> List[Recommendation]:
        """Fallback to pure rule-based recommendations"""
        # Sort by base score
        sorted_matches = sorted(matches, key=lambda x: x.base_score, reverse=True)[:top_n]
        
        recommendations = []
        for match in sorted_matches:
            # Generate simple reason
            exact_count = len(match.exact_matches)
            possible_count = len(match.possible_matches)
            missing_count = len(match.missing_skills)
            
            if exact_count > 0 and missing_count == 0:
                reason = f"Strong match with {exact_count} required skills"
            elif exact_count > 0:
                reason = f"Match for {exact_count} required skills, missing {missing_count} skills"
            elif possible_count > 0:
                reason = f"Partial match with {possible_count} related skills, missing {missing_count} core skills"
            else:
                reason = f"Limited match, missing {missing_count} required skills"
            
            recommendations.append(Recommendation(
                job_id=match.job_id,
                job_title=match.job_title,
                match_score=match.base_score,
                reason=reason
            ))
        
        # Ensure we have exactly top_n recommendations
        while len(recommendations) < top_n and len(recommendations) < len(matches):
            idx = len(recommendations)
            if idx < len(sorted_matches):
                match = sorted_matches[idx]
                recommendations.append(Recommendation(
                    job_id=match.job_id,
                    job_title=match.job_title,
                    match_score=match.base_score,
                    reason="Additional opportunity to consider"
                ))
        
        return recommendations

# ============================================================================
# MAIN ENDPOINT
# ============================================================================

@app.post("/match-jobs", response_model=MatchResponse)
async def match_jobs(request: MatchRequest):
    """
    Hybrid matching system:
    1. Rule-based matching calculates base scores
    2. LLM enhances with semantic understanding and explanations
    """
    
    if not request.jobs:
        return MatchResponse(recommendations=[])
    
    if not request.candidate_skills:
        return MatchResponse(recommendations=[])
    
    try:
        # Phase 1: Rule-based matching
        matches = []
        for job in request.jobs:
            base_score, exact, possible, missing = SkillMatcher.calculate_base_score(
                request.candidate_skills,
                job.required_skills
            )
            
            matches.append(SkillMatch(
                job_id=job.job_id,
                job_title=job.job_title,
                required_skills=job.required_skills,
                exact_matches=exact,
                possible_matches=possible,
                missing_skills=missing,
                base_score=base_score,
                candidate_skills=request.candidate_skills
            ))
        
        # Phase 2: LLM enhancement
        recommendations = LLMEnhancer.enhance_matches(matches, top_n=5)
        
        return MatchResponse(recommendations=recommendations)
        
    except Exception as e:
        print(f"Error in match_jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Matching error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "llm_configured": bool(OPENROUTER_API_KEY)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
"""Skill matching and normalization utilities"""
from typing import List, Optional, Set


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

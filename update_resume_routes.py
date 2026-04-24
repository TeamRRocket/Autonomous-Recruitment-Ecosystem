import sys
content = open("ai-service/ai/api/resume_routes.py").read()
new_route = """

from .performance_summary_helper import PerformanceSummaryRequest, generate_performance_summary_with_llm

@router.post("/performance-summary")
async def generate_performance_summary(req: PerformanceSummaryRequest):
    try:
        summary = generate_performance_summary_with_llm(req)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
"""
open("ai-service/ai/api/resume_routes.py", "w").write(content + new_route)

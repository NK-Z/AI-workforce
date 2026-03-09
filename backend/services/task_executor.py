"""
Task Executor Service
When an agent is assigned a task, this service:
1. Sets agent status to 'active', task to 'in-progress'
2. Calls Claude to actually DO the task and produce a deliverable
3. Stores the result on the task card
4. Marks task completed and resets agent to idle
"""
from datetime import datetime
import anthropic
from config import ANTHROPIC_API_KEY, CLAUDE_MODEL
from database import SessionLocal
from models import Task, Agent

ROLE_LABELS = {
    "developer": "Software Developer",
    "designer": "UI/UX Designer",
    "marketing": "Marketing Specialist",
    "analyst": "Data Analyst",
    "writer": "Content Writer",
    "support": "Customer Support Agent",
    "manager": "Project Manager",
    "researcher": "Researcher",
}

ROLE_OUTPUT_STYLE = {
    "developer": "code, technical specs, architecture decisions, and implementation notes",
    "designer": "design concepts, UI recommendations, color schemes, layout ideas, and user experience suggestions",
    "marketing": "copy, campaign ideas, messaging strategy, target audience analysis, and growth tactics",
    "analyst": "data analysis, key findings, trends, metrics breakdown, and actionable insights",
    "writer": "written content, articles, blog posts, copy, or documentation",
    "support": "resolution steps, response templates, FAQ updates, and process improvements",
    "manager": "project plan, timeline, task breakdown, risk assessment, and stakeholder summary",
    "researcher": "research findings, literature summary, technology analysis, and recommendations",
}


def build_execution_prompt(agent, task, user_name):
    role_label = ROLE_LABELS.get(agent.role, agent.role)
    output_style = ROLE_OUTPUT_STYLE.get(agent.role, "professional deliverable")
    skills_str = ", ".join(agent.skills) if agent.skills else "General"

    system = f"""You are {agent.name}, a {role_label} with expertise in {skills_str}.
Your personality is {agent.personality}. You work for {user_name}.

You have been assigned a task and must complete it fully right now.
Produce a real, complete, professional deliverable — not a plan, not a summary of what you'll do.
Actually DO the work. Your output should be {output_style}.

Format your response clearly with sections if needed. Be thorough but practical."""

    if agent.system_prompt:
        system += f"\n\nAdditional instructions: {agent.system_prompt}"

    user_msg = f"""Task: {task.title}

Description: {task.description or 'Complete this task to the best of your ability.'}

Priority: {task.priority}
{f'Deadline: {task.deadline}' if task.deadline else ''}

Deliver your complete work output now."""

    return system, user_msg


def execute_task_background(task_id: str, user_name: str):
    """Run in background thread — calls Claude, stores result, marks task done."""
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task or not task.agent_id:
            return

        agent = db.query(Agent).filter(Agent.id == task.agent_id).first()
        if not agent:
            return

        # Mark task as in-progress with a live note
        task.status = "in-progress"
        task.started_at = datetime.utcnow()
        task.progress_note = f"{agent.name} is reviewing the task requirements..."
        agent.status = "active"
        db.commit()

        if not ANTHROPIC_API_KEY:
            task.result = "[AI execution requires ANTHROPIC_API_KEY to be set.]"
            task.status = "completed"
            task.completed_at = datetime.utcnow()
            task.progress_note = "Completed"
            db.commit()
            return

        # Update progress note before calling API
        task.progress_note = f"{agent.name} is working on this task..."
        db.commit()

        # Call Claude to actually do the work
        system_prompt, user_msg = build_execution_prompt(agent, task, user_name)
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=2048,
            system=system_prompt,
            messages=[{"role": "user", "content": user_msg}],
        )

        result_text = response.content[0].text

        # Store result and mark complete
        task.result = result_text
        task.status = "completed"
        task.completed_at = datetime.utcnow()
        task.progress_note = "Completed"
        agent.status = "idle"
        # Bump efficiency slightly on completion
        agent.efficiency = min(100, agent.efficiency + 1)
        db.commit()

        # Check if agent has other todo tasks queued — auto-start next one
        next_task = (
            db.query(Task)
            .filter(
                Task.agent_id == agent.id,
                Task.status == "todo",
                Task.user_id == task.user_id,
            )
            .order_by(Task.created_at.asc())
            .first()
        )
        if next_task:
            # Re-use same function recursively for next task
            execute_task_background(next_task.id, user_name)

    except Exception as e:
        # On failure, mark task with error and reset agent
        try:
            task = db.query(Task).filter(Task.id == task_id).first()
            if task:
                task.progress_note = f"Error: {str(e)[:200]}"
                task.status = "todo"
                if task.agent_id:
                    agent = db.query(Agent).filter(Agent.id == task.agent_id).first()
                    if agent:
                        agent.status = "idle"
            db.commit()
        except Exception:
            pass
    finally:
        db.close()

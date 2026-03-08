import anthropic
from config import ANTHROPIC_API_KEY, CLAUDE_MODEL

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


def build_system_prompt(agent, tasks, user_name, custom_prompt=""):
    role_label = ROLE_LABELS.get(agent.role, agent.role)
    skills_str = ", ".join(agent.skills) if agent.skills else "General"

    task_lines = []
    for t in tasks:
        task_lines.append(f"  - [{t.status.upper()}] {t.title}: {t.description or 'No description'} (Priority: {t.priority})")
    tasks_block = "\n".join(task_lines) if task_lines else "  No tasks currently assigned."

    base = f"""You are {agent.name}, a {role_label} working at a virtual AI office.
Your personality style is: {agent.personality}.
Your skills include: {skills_str}.
You work for {user_name}.

Your current task assignments:
{tasks_block}

IMPORTANT GUIDELINES:
- Stay in character as {agent.name} the {role_label} at all times.
- Reference your actual tasks when relevant — give real status updates about them.
- Be proactive: suggest next steps, flag blockers, and offer help.
- Keep responses concise (2-4 sentences) unless the user asks for detail.
- If asked about your work, reference your real assigned tasks above.
- If the user assigns you something new via chat, acknowledge it and explain how you'd approach it.
- Be professional but match your personality style ({agent.personality})."""

    if custom_prompt:
        base += f"\n\nAdditional instructions from your employer:\n{custom_prompt}"

    return base


def get_agent_response(agent, user_message, chat_history, tasks, user_name):
    """Call Claude API and return the agent's response text."""
    if not ANTHROPIC_API_KEY:
        return f"[AI responses require an Anthropic API key. Please set ANTHROPIC_API_KEY in your environment variables to enable real conversations with {agent.name}.]"

    system_prompt = build_system_prompt(
        agent, tasks, user_name, agent.system_prompt or ""
    )

    # Build messages from chat history (last 40 messages for context)
    messages = []
    for msg in chat_history[-40:]:
        messages.append({
            "role": msg.role if msg.role in ("user", "assistant") else "user",
            "content": msg.content,
        })
    # Add the new user message
    messages.append({"role": "user", "content": user_message})

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )
        return response.content[0].text
    except Exception as e:
        return f"I'm having trouble connecting right now. Error: {str(e)[:100]}"

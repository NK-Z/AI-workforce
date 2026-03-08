/* ============================================
   AI Workforce — Virtual Office Application
   ============================================ */

// ===== Data Store =====
const store = {
    agents: [],
    tasks: [],
    notifications: [],
    chatMessages: {},
    currentChatAgent: null,
    currentModal: null,
    selectedAgentId: null,
};

// ===== Role Config =====
const ROLES = {
    developer: { label: 'Software Developer', icon: '💻', dept: 'Engineering' },
    designer: { label: 'UI/UX Designer', icon: '🎨', dept: 'Design' },
    marketing: { label: 'Marketing Specialist', icon: '📣', dept: 'Marketing' },
    analyst: { label: 'Data Analyst', icon: '📊', dept: 'Analytics' },
    writer: { label: 'Content Writer', icon: '✍️', dept: 'Content' },
    support: { label: 'Customer Support', icon: '🎧', dept: 'Support' },
    manager: { label: 'Project Manager', icon: '📋', dept: 'Management' },
    researcher: { label: 'Researcher', icon: '🔬', dept: 'Research' },
};

// ===== Chat Responses (Simulated AI) =====
const CHAT_RESPONSES = {
    developer: [
        "I've reviewed the codebase and identified 3 areas for optimization. Want me to start with the API layer?",
        "The CI/CD pipeline is running smoothly. All 47 tests passed on the latest commit.",
        "I've drafted a technical spec for the new microservice. Should I share it in the project docs?",
        "Refactoring complete! Reduced code duplication by 23% and improved load time by 340ms.",
        "I'm currently working on implementing the authentication module. ETA: 2 hours.",
    ],
    designer: [
        "I've created 3 mockup variants for the landing page. Check the design folder for review.",
        "The design system is updated with the new color palette and component library.",
        "User flow diagrams are ready. I recommend A/B testing the checkout process.",
        "I've conducted a UX audit and found 8 areas where we can improve user engagement.",
        "The mobile-responsive designs are finalized. Ready for developer handoff.",
    ],
    marketing: [
        "Campaign metrics are up 15% this week. Email open rates hit 28%!",
        "I've drafted the Q1 marketing strategy. Key focus: content marketing and SEO.",
        "Social media engagement increased by 32% after implementing the new content calendar.",
        "The competitor analysis is complete. I've identified 5 key differentiators we should highlight.",
        "Landing page copy is ready for review. I've optimized it for conversion with clear CTAs.",
    ],
    analyst: [
        "The data pipeline is processing 2.3M records daily with 99.7% accuracy.",
        "I've identified a 18% revenue opportunity in the underserved market segment.",
        "Dashboard is updated with real-time KPIs. Key insight: user retention improved 7%.",
        "Predictive model accuracy is at 94.2%. Ready for production deployment.",
        "The quarterly report is ready. Revenue up 23%, user acquisition cost down 12%.",
    ],
    writer: [
        "Blog post draft is ready: '10 Ways AI is Transforming Business Operations'. 1,800 words.",
        "I've updated the product documentation with the latest feature changes.",
        "Newsletter copy is finalized. Subject line A/B test variants are ready.",
        "Content calendar for next month is planned. 12 blog posts, 8 social threads.",
        "The case study is complete. Customer approval pending before publication.",
    ],
    support: [
        "Ticket queue is clear. Average response time today: 4.2 minutes.",
        "I've created a new FAQ section that should reduce common tickets by 30%.",
        "Customer satisfaction score this week: 4.8/5. Up from 4.5 last week!",
        "Escalated issue #2847 is resolved. Root cause was a billing sync error.",
        "I've identified a trending support topic. Recommending a product fix for v2.3.",
    ],
    manager: [
        "Sprint planning is complete. 14 story points across 5 team members.",
        "Project timeline updated. We're on track for the March 15 milestone.",
        "Risk assessment done. Two critical items need attention by end of week.",
        "Stakeholder report is ready. Key highlights: on-time delivery and under budget.",
        "Team velocity improved 20% this sprint. Bottleneck in QA is being addressed.",
    ],
    researcher: [
        "Literature review complete. Found 23 relevant papers supporting our approach.",
        "Experiment results are promising. The new algorithm outperforms baseline by 31%.",
        "I've compiled a technology landscape analysis. Three emerging trends to watch.",
        "Research proposal draft is ready for review. Estimated timeline: 6 weeks.",
        "Prototype testing shows 92% user preference over the existing solution.",
    ],
};

// ===== Initialize with Sample Data =====
function initSampleData() {
    const sampleAgents = [
        {
            id: 'agent_1',
            name: 'Atlas',
            role: 'developer',
            personality: 'professional',
            skills: ['Python', 'React', 'AWS', 'APIs'],
            color: '#6366f1',
            status: 'active',
            tasksCompleted: 24,
            tasksActive: 2,
            efficiency: 94,
            hiredAt: new Date(Date.now() - 30 * 86400000),
        },
        {
            id: 'agent_2',
            name: 'Nova',
            role: 'designer',
            personality: 'creative',
            skills: ['Figma', 'UI Design', 'Branding', 'Motion'],
            color: '#ec4899',
            status: 'active',
            tasksCompleted: 18,
            tasksActive: 1,
            efficiency: 91,
            hiredAt: new Date(Date.now() - 25 * 86400000),
        },
        {
            id: 'agent_3',
            name: 'Sage',
            role: 'analyst',
            personality: 'analytical',
            skills: ['SQL', 'Tableau', 'Python', 'Statistics'],
            color: '#10b981',
            status: 'idle',
            tasksCompleted: 31,
            tasksActive: 0,
            efficiency: 97,
            hiredAt: new Date(Date.now() - 45 * 86400000),
        },
        {
            id: 'agent_4',
            name: 'Echo',
            role: 'writer',
            personality: 'friendly',
            skills: ['Copywriting', 'SEO', 'Editing', 'Research'],
            color: '#f59e0b',
            status: 'active',
            tasksCompleted: 42,
            tasksActive: 3,
            efficiency: 88,
            hiredAt: new Date(Date.now() - 60 * 86400000),
        },
        {
            id: 'agent_5',
            name: 'Cipher',
            role: 'researcher',
            personality: 'analytical',
            skills: ['ML', 'NLP', 'Papers', 'Data Mining'],
            color: '#06b6d4',
            status: 'offline',
            tasksCompleted: 15,
            tasksActive: 0,
            efficiency: 92,
            hiredAt: new Date(Date.now() - 15 * 86400000),
        },
    ];

    const sampleTasks = [
        { id: 'task_1', title: 'Build authentication module', description: 'Implement OAuth 2.0 login flow', agentId: 'agent_1', priority: 'high', status: 'in-progress', deadline: '2026-03-15', createdAt: new Date() },
        { id: 'task_2', title: 'Design landing page v2', description: 'Create modern, conversion-focused landing page', agentId: 'agent_2', priority: 'medium', status: 'in-progress', deadline: '2026-03-12', createdAt: new Date() },
        { id: 'task_3', title: 'Write Q1 blog series', description: '5 articles on AI trends in business', agentId: 'agent_4', priority: 'medium', status: 'todo', deadline: '2026-03-20', createdAt: new Date() },
        { id: 'task_4', title: 'Analyze user retention data', description: 'Deep dive into churn metrics', agentId: 'agent_3', priority: 'high', status: 'todo', deadline: '2026-03-10', createdAt: new Date() },
        { id: 'task_5', title: 'API performance optimization', description: 'Reduce response times by 40%', agentId: 'agent_1', priority: 'urgent', status: 'in-progress', deadline: '2026-03-09', createdAt: new Date() },
        { id: 'task_6', title: 'Research competitor features', description: 'Compare top 5 competitors', agentId: 'agent_5', priority: 'low', status: 'completed', deadline: '2026-03-08', createdAt: new Date() },
        { id: 'task_7', title: 'Update design system', description: 'Add new component variants', agentId: 'agent_2', priority: 'medium', status: 'completed', deadline: '2026-03-07', createdAt: new Date() },
        { id: 'task_8', title: 'Monthly analytics report', description: 'Compile February metrics', agentId: 'agent_3', priority: 'medium', status: 'completed', deadline: '2026-03-05', createdAt: new Date() },
    ];

    const sampleNotifications = [
        { id: 'n1', title: 'Task Completed', desc: 'Atlas finished "API endpoint setup"', time: '5 min ago', icon: '✅', color: 'rgba(16,185,129,0.15)' },
        { id: 'n2', title: 'New Agent Hired', desc: 'Cipher joined the Research department', time: '2 hours ago', icon: '🎉', color: 'rgba(99,102,241,0.15)' },
        { id: 'n3', title: 'Deadline Approaching', desc: '"API optimization" is due tomorrow', time: '4 hours ago', icon: '⏰', color: 'rgba(245,158,11,0.15)' },
    ];

    store.agents = sampleAgents;
    store.tasks = sampleTasks;
    store.notifications = sampleNotifications;
    saveToStorage();
}

// ===== Storage =====
function saveToStorage() {
    localStorage.setItem('ai_workforce_data', JSON.stringify({
        agents: store.agents,
        tasks: store.tasks,
        notifications: store.notifications,
        chatMessages: store.chatMessages,
    }));
}

function loadFromStorage() {
    const data = localStorage.getItem('ai_workforce_data');
    if (data) {
        const parsed = JSON.parse(data);
        store.agents = parsed.agents || [];
        store.tasks = parsed.tasks || [];
        store.notifications = parsed.notifications || [];
        store.chatMessages = parsed.chatMessages || {};
        return true;
    }
    return false;
}

// ===== Navigation =====
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);

    if (pageEl) pageEl.classList.add('active');
    if (navEl) navEl.classList.add('active');

    // Refresh page content
    switch (page) {
        case 'dashboard': renderDashboard(); break;
        case 'office': renderOffice(); break;
        case 'agents': renderAgents(); break;
        case 'tasks': renderTasks(); break;
        case 'chat': renderChat(); break;
        case 'analytics': renderAnalytics(); break;
    }

    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ===== Dashboard =====
function renderDashboard() {
    // Stats
    const activeAgents = store.agents.filter(a => a.status === 'active').length;
    const completedTasks = store.tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = store.tasks.filter(t => t.status !== 'completed').length;
    const avgEfficiency = store.agents.length > 0
        ? Math.round(store.agents.reduce((sum, a) => sum + (a.efficiency || 0), 0) / store.agents.length)
        : 0;

    document.getElementById('totalAgents').textContent = store.agents.length;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;
    document.getElementById('efficiency').textContent = avgEfficiency + '%';

    // Agent list
    const agentList = document.getElementById('dashboardAgentList');
    agentList.innerHTML = store.agents.map(agent => `
        <div class="agent-list-item" onclick="showAgentDetail('${agent.id}')">
            <div class="agent-avatar" style="background: ${agent.color}">
                ${agent.name.charAt(0)}
                <div class="agent-status-dot ${agent.status}"></div>
            </div>
            <div class="agent-list-info">
                <div class="agent-list-name">${agent.name}</div>
                <div class="agent-list-role">${ROLES[agent.role]?.label || agent.role}</div>
            </div>
            <span class="agent-list-status ${agent.status}">${agent.status}</span>
        </div>
    `).join('');

    // Activity feed
    const activityFeed = document.getElementById('activityFeed');
    const activities = generateActivities();
    activityFeed.innerHTML = activities.map(act => `
        <div class="activity-item">
            <div class="activity-dot" style="background: ${act.color}"></div>
            <div class="activity-content">
                <div class="activity-text">${act.text}</div>
                <div class="activity-time">${act.time}</div>
            </div>
        </div>
    `).join('');

    // Task board
    renderTaskBoard('dashboardTaskBoard');
}

function generateActivities() {
    const activities = [];
    store.agents.forEach(agent => {
        if (agent.status === 'active') {
            activities.push({
                text: `<strong>${agent.name}</strong> is working on assigned tasks`,
                time: `${Math.floor(Math.random() * 30 + 5)} min ago`,
                color: '#10b981'
            });
        }
    });
    store.tasks.filter(t => t.status === 'completed').slice(0, 2).forEach(task => {
        const agent = store.agents.find(a => a.id === task.agentId);
        activities.push({
            text: `<strong>${agent?.name || 'Agent'}</strong> completed "${task.title}"`,
            time: '1 hour ago',
            color: '#6366f1'
        });
    });
    activities.push({
        text: 'Office efficiency score updated to <strong>' +
              (store.agents.length ? Math.round(store.agents.reduce((s,a) => s + a.efficiency, 0) / store.agents.length) : 0) + '%</strong>',
        time: '2 hours ago',
        color: '#f59e0b'
    });
    return activities.slice(0, 6);
}

function renderTaskBoard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const todoTasks = store.tasks.filter(t => t.status === 'todo');
    const progressTasks = store.tasks.filter(t => t.status === 'in-progress');
    const completedTasks = store.tasks.filter(t => t.status === 'completed');

    container.innerHTML = `
        <div class="task-column">
            <div class="task-column-header">
                <span class="task-status-dot pending"></span>
                <span>To Do</span>
                <span class="task-count">${todoTasks.length}</span>
            </div>
            <div class="task-list">
                ${todoTasks.map(t => renderTaskCard(t)).join('')}
            </div>
        </div>
        <div class="task-column">
            <div class="task-column-header">
                <span class="task-status-dot in-progress"></span>
                <span>In Progress</span>
                <span class="task-count">${progressTasks.length}</span>
            </div>
            <div class="task-list">
                ${progressTasks.map(t => renderTaskCard(t)).join('')}
            </div>
        </div>
        <div class="task-column">
            <div class="task-column-header">
                <span class="task-status-dot completed"></span>
                <span>Completed</span>
                <span class="task-count">${completedTasks.length}</span>
            </div>
            <div class="task-list">
                ${completedTasks.map(t => renderTaskCard(t)).join('')}
            </div>
        </div>
    `;
}

function renderTaskCard(task) {
    const agent = store.agents.find(a => a.id === task.agentId);
    return `
        <div class="task-card" onclick="cycleTaskStatus('${task.id}')">
            <div class="task-card-title">${task.title}</div>
            <div class="task-card-meta">
                <span class="task-priority ${task.priority}">${task.priority}</span>
                ${agent ? `<div class="task-assignee" style="background:${agent.color}" title="${agent.name}">${agent.name.charAt(0)}</div>` : ''}
            </div>
        </div>
    `;
}

function cycleTaskStatus(taskId) {
    const task = store.tasks.find(t => t.id === taskId);
    if (!task) return;

    const cycle = { 'todo': 'in-progress', 'in-progress': 'completed', 'completed': 'todo' };
    task.status = cycle[task.status] || 'todo';
    saveToStorage();
    showToast(`Task moved to "${task.status.replace('-', ' ')}"`, 'info');

    // Refresh current view
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        const pageId = activePage.id.replace('page-', '');
        navigateTo(pageId);
    }
}

// ===== Office Floor Plan =====

// Fixed desk positions in the office layout (x, y, chairSide)
const OFFICE_LAYOUT = {
    rooms: [
        // Main open workspace
        { id: 'workspace', label: 'Open Workspace', x: 20, y: 20, w: 520, h: 360 },
        // Meeting room
        { id: 'meeting', label: 'Meeting Room', x: 560, y: 20, w: 320, h: 200 },
        // Manager office
        { id: 'manager-office', label: 'Manager Office', x: 560, y: 240, w: 180, h: 140 },
        // Break room
        { id: 'breakroom', label: 'Break Room', x: 560, y: 400, w: 320, h: 200 },
        // Reception
        { id: 'reception', label: 'Reception', x: 20, y: 400, w: 250, h: 200 },
        // Server room
        { id: 'server', label: 'Server Room', x: 290, y: 400, w: 130, h: 200 },
        // Research lab
        { id: 'research', label: 'Research Lab', x: 755, y: 240, w: 125, h: 140 },
    ],
    desks: [
        // Open workspace — 2 rows of 4
        { x: 50,  y: 80,  chair: 'bottom', room: 'workspace' },
        { x: 180, y: 80,  chair: 'bottom', room: 'workspace' },
        { x: 310, y: 80,  chair: 'bottom', room: 'workspace' },
        { x: 50,  y: 200, chair: 'bottom', room: 'workspace' },
        { x: 180, y: 200, chair: 'bottom', room: 'workspace' },
        { x: 310, y: 200, chair: 'bottom', room: 'workspace' },
        { x: 50,  y: 300, chair: 'bottom', room: 'workspace' },
        { x: 180, y: 300, chair: 'bottom', room: 'workspace' },
        // Manager office — 1 desk
        { x: 590, y: 290, chair: 'bottom', room: 'manager-office' },
        // Research lab — 1 desk
        { x: 775, y: 290, chair: 'bottom', room: 'research' },
    ],
    meetingTable: { x: 620, y: 70, w: 200, h: 100 },
    plants: [
        { x: 530, y: 30 },
        { x: 530, y: 370 },
        { x: 270, y: 410 },
        { x: 870, y: 30 },
        { x: 870, y: 590 },
    ],
    appliances: [
        { x: 580, y: 440, label: '☕' },
        { x: 610, y: 440, label: '🧊' },
        { x: 580, y: 560, label: '🍕' },
    ],
    receptionDesk: { x: 60, y: 460, w: 170, h: 50 },
    serverRacks: [
        { x: 310, y: 440, w: 30, h: 70 },
        { x: 360, y: 440, w: 30, h: 70 },
    ],
};

function renderOffice() {
    const floor = document.getElementById('officeFloor');
    let html = '';

    // Draw rooms
    OFFICE_LAYOUT.rooms.forEach(room => {
        html += `<div class="fp-room" style="left:${room.x}px; top:${room.y}px; width:${room.w}px; height:${room.h}px;">
            <span class="fp-room-label">${room.label}</span>
        </div>`;
    });

    // Meeting table
    const mt = OFFICE_LAYOUT.meetingTable;
    html += `<div class="fp-table" style="left:${mt.x}px; top:${mt.y}px; width:${mt.w}px; height:${mt.h}px; border-radius: 50px;"></div>`;
    // Meeting chairs around the table
    const meetChairs = [
        { x: mt.x + 30, y: mt.y - 16 }, { x: mt.x + 90, y: mt.y - 16 }, { x: mt.x + 150, y: mt.y - 16 },
        { x: mt.x + 30, y: mt.y + mt.h }, { x: mt.x + 90, y: mt.y + mt.h }, { x: mt.x + 150, y: mt.y + mt.h },
    ];
    meetChairs.forEach((c, i) => {
        const rot = i < 3 ? 'rotate(180deg)' : '';
        html += `<div class="fp-chair" style="position:absolute; left:${c.x}px; top:${c.y}px; transform: ${rot};"></div>`;
    });

    // Reception desk
    const rd = OFFICE_LAYOUT.receptionDesk;
    html += `<div class="fp-table" style="left:${rd.x}px; top:${rd.y}px; width:${rd.w}px; height:${rd.h}px; border-radius: 6px;"></div>`;
    html += `<span class="fp-label" style="left:${rd.x + 40}px; top:${rd.y + 16}px;">Reception Desk</span>`;

    // Server racks
    OFFICE_LAYOUT.serverRacks.forEach(sr => {
        html += `<div class="fp-table" style="left:${sr.x}px; top:${sr.y}px; width:${sr.w}px; height:${sr.h}px; border-radius: 3px; background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.3);"></div>`;
    });
    html += `<span class="fp-label" style="left:300px; top:530px;">🖥 Racks</span>`;

    // Plants
    OFFICE_LAYOUT.plants.forEach(p => {
        html += `<div class="fp-plant" style="left:${p.x}px; top:${p.y}px;"></div>`;
    });

    // Appliances
    OFFICE_LAYOUT.appliances.forEach(a => {
        html += `<div class="fp-appliance" style="left:${a.x}px; top:${a.y}px;">${a.label}</div>`;
    });

    // Break room table
    html += `<div class="fp-table" style="left:620px; top:480px; width:120px; height:60px; border-radius: 30px;"></div>`;
    html += `<span class="fp-label" style="left:645px; top:500px;">Lounge</span>`;

    // Now place agents at desks (or leave desks empty)
    const deskSlots = OFFICE_LAYOUT.desks;
    const agentsCopy = [...store.agents];

    deskSlots.forEach((slot, index) => {
        const agent = agentsCopy[index] || null;
        const currentTask = agent ? store.tasks.find(t => t.agentId === agent.id && t.status === 'in-progress') : null;

        if (agent) {
            html += `
                <div class="fp-desk occupied" style="left:${slot.x}px; top:${slot.y}px;" onclick="showAgentDetail('${agent.id}')">
                    <div class="fp-tooltip">
                        <div class="fp-tooltip-name">${agent.name}</div>
                        <div class="fp-tooltip-role">${ROLES[agent.role]?.icon || ''} ${ROLES[agent.role]?.label || agent.role}</div>
                        ${currentTask ? `<div class="fp-tooltip-task">"${currentTask.title}"</div>` : '<div class="fp-tooltip-task">No active task</div>'}
                    </div>
                    <div class="fp-agent">
                        <div class="fp-agent-avatar ${agent.status === 'active' ? 'pulse' : ''}" style="background: ${agent.color}">
                            ${agent.name.charAt(0)}
                            <div class="fp-status ${agent.status}"></div>
                        </div>
                        <span class="fp-agent-name">${agent.name}</span>
                    </div>
                    <div class="fp-chair ${slot.chair}"></div>
                </div>
            `;
        } else {
            html += `
                <div class="fp-desk empty" style="left:${slot.x}px; top:${slot.y}px;" onclick="openModal('hireAgent')">
                    <div class="fp-tooltip">
                        <div class="fp-tooltip-name">Empty Desk</div>
                        <div class="fp-tooltip-role">Click to hire an agent</div>
                    </div>
                    <span class="fp-empty-plus">+</span>
                    <div class="fp-chair ${slot.chair}"></div>
                </div>
            `;
        }
    });

    // Entrance arrow
    html += `<span class="fp-label" style="left:90px; top:598px; font-size: 0.75rem; color: var(--accent-primary);">↓ Entrance</span>`;

    floor.innerHTML = html;
}

// ===== Agents Page =====
function renderAgents(filter = 'all') {
    const grid = document.getElementById('agentsGrid');
    let agents = store.agents;

    if (filter !== 'all') {
        agents = agents.filter(a => a.status === filter);
    }

    grid.innerHTML = agents.map(agent => {
        const agentTasks = store.tasks.filter(t => t.agentId === agent.id);
        const completed = agentTasks.filter(t => t.status === 'completed').length;
        const active = agentTasks.filter(t => t.status !== 'completed').length;

        return `
            <div class="agent-card" onclick="showAgentDetail('${agent.id}')">
                <div class="agent-card-header">
                    <div class="agent-card-avatar" style="background: ${agent.color}">
                        ${agent.name.charAt(0)}
                        <div class="agent-status-dot ${agent.status}"></div>
                    </div>
                    <div>
                        <div class="agent-card-name">${agent.name}</div>
                        <div class="agent-card-role">${ROLES[agent.role]?.icon || ''} ${ROLES[agent.role]?.label || agent.role}</div>
                    </div>
                </div>
                <div class="agent-card-stats">
                    <div class="agent-stat">
                        <div class="agent-stat-value">${completed}</div>
                        <div class="agent-stat-label">Completed</div>
                    </div>
                    <div class="agent-stat">
                        <div class="agent-stat-value">${active}</div>
                        <div class="agent-stat-label">Active</div>
                    </div>
                    <div class="agent-stat">
                        <div class="agent-stat-value">${agent.efficiency}%</div>
                        <div class="agent-stat-label">Efficiency</div>
                    </div>
                </div>
                <div class="agent-card-skills">
                    ${(agent.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('')}
                </div>
            </div>
        `;
    }).join('');

    if (agents.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <p style="font-size: 1.1rem; margin-bottom: 12px;">No agents found</p>
                <button class="btn btn-primary" onclick="openModal('hireAgent')">Hire Your First Agent</button>
            </div>
        `;
    }
}

function filterAgents(filter) {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    renderAgents(filter);
}

// ===== Tasks Page =====
function renderTasks() {
    renderTaskBoard('fullTaskBoard');
}

// ===== Chat =====
function renderChat() {
    const contacts = document.getElementById('chatContacts');
    contacts.innerHTML = store.agents.map(agent => `
        <div class="chat-contact ${store.currentChatAgent === agent.id ? 'active' : ''}" onclick="openChat('${agent.id}')">
            <div class="chat-contact-avatar" style="background: ${agent.color}">
                ${agent.name.charAt(0)}
            </div>
            <div class="chat-contact-info">
                <div class="chat-contact-name">${agent.name}</div>
                <div class="chat-contact-preview">${ROLES[agent.role]?.label || ''}</div>
            </div>
        </div>
    `).join('');
}

function openChat(agentId) {
    const agent = store.agents.find(a => a.id === agentId);
    if (!agent) return;

    store.currentChatAgent = agentId;

    // Update contacts
    document.querySelectorAll('.chat-contact').forEach(c => c.classList.remove('active'));
    event?.target?.closest?.('.chat-contact')?.classList.add('active');

    // Update header
    const header = document.getElementById('chatHeader');
    header.innerHTML = `
        <div class="chat-header-info">
            <div class="chat-avatar" style="background: ${agent.color}; color: white;">
                ${agent.name.charAt(0)}
            </div>
            <div>
                <h3>${agent.name}</h3>
                <span class="chat-status">${agent.status === 'active' ? 'Online' : agent.status}</span>
            </div>
        </div>
    `;

    // Show input area
    document.getElementById('chatInputArea').style.display = 'flex';

    // Render messages
    renderChatMessages(agentId);

    // If no messages yet, send a greeting
    if (!store.chatMessages[agentId] || store.chatMessages[agentId].length === 0) {
        store.chatMessages[agentId] = [];
        setTimeout(() => {
            addChatMessage(agentId, 'received',
                `Hello! I'm ${agent.name}, your ${ROLES[agent.role]?.label || 'AI Agent'}. How can I help you today?`
            );
        }, 500);
    }
}

function renderChatMessages(agentId) {
    const container = document.getElementById('chatMessages');
    const messages = store.chatMessages[agentId] || [];

    if (messages.length === 0) {
        container.innerHTML = `
            <div class="chat-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                <p>Start the conversation</p>
            </div>
        `;
        return;
    }

    container.innerHTML = messages.map(msg => `
        <div class="chat-message ${msg.type}">
            ${msg.text}
            <div class="chat-message-time">${msg.time}</div>
        </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
}

function addChatMessage(agentId, type, text) {
    if (!store.chatMessages[agentId]) {
        store.chatMessages[agentId] = [];
    }

    const now = new Date();
    store.chatMessages[agentId].push({
        type,
        text,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    saveToStorage();
    if (store.currentChatAgent === agentId) {
        renderChatMessages(agentId);
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || !store.currentChatAgent) return;

    addChatMessage(store.currentChatAgent, 'sent', text);
    input.value = '';

    // Simulate agent response
    const agent = store.agents.find(a => a.id === store.currentChatAgent);
    if (agent) {
        setTimeout(() => {
            const responses = CHAT_RESPONSES[agent.role] || CHAT_RESPONSES.developer;
            const response = responses[Math.floor(Math.random() * responses.length)];
            addChatMessage(store.currentChatAgent, 'received', response);
        }, 800 + Math.random() * 1500);
    }
}

function handleChatKeypress(e) {
    if (e.key === 'Enter') sendChatMessage();
}

// ===== Analytics =====
function renderAnalytics() {
    const container = document.getElementById('analyticsContent');

    const agentPerformance = store.agents.map(a => ({
        name: a.name,
        efficiency: a.efficiency,
        tasks: store.tasks.filter(t => t.agentId === a.id && t.status === 'completed').length,
        color: a.color
    }));

    const tasksByStatus = {
        'To Do': store.tasks.filter(t => t.status === 'todo').length,
        'In Progress': store.tasks.filter(t => t.status === 'in-progress').length,
        'Completed': store.tasks.filter(t => t.status === 'completed').length,
    };

    const tasksByPriority = {
        Low: store.tasks.filter(t => t.priority === 'low').length,
        Medium: store.tasks.filter(t => t.priority === 'medium').length,
        High: store.tasks.filter(t => t.priority === 'high').length,
        Urgent: store.tasks.filter(t => t.priority === 'urgent').length,
    };

    container.innerHTML = `
        <!-- Agent Performance Chart -->
        <div class="analytics-card">
            <h3>Agent Efficiency</h3>
            <div class="analytics-chart">
                ${agentPerformance.map(a => `
                    <div class="chart-bar" style="height: ${a.efficiency}%; background: ${a.color};" title="${a.name}: ${a.efficiency}%">
                        <span class="chart-bar-label">${a.name}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Task Distribution -->
        <div class="analytics-card">
            <h3>Task Distribution</h3>
            <div class="analytics-chart">
                ${Object.entries(tasksByStatus).map(([label, count]) => {
                    const colors = { 'To Do': '#64698a', 'In Progress': '#f59e0b', 'Completed': '#10b981' };
                    const maxTasks = Math.max(...Object.values(tasksByStatus), 1);
                    return `
                        <div class="chart-bar" style="height: ${(count / maxTasks) * 100}%; background: ${colors[label]};" title="${label}: ${count}">
                            <span class="chart-bar-label">${label}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <!-- Key Metrics -->
        <div class="analytics-card">
            <h3>Key Metrics</h3>
            ${[
                { label: 'Total Agents', value: store.agents.length, pct: 100, color: '#6366f1' },
                { label: 'Active Agents', value: store.agents.filter(a => a.status === 'active').length, pct: store.agents.length ? (store.agents.filter(a => a.status === 'active').length / store.agents.length * 100) : 0, color: '#10b981' },
                { label: 'Task Completion Rate', value: store.tasks.length ? Math.round(store.tasks.filter(t => t.status === 'completed').length / store.tasks.length * 100) + '%' : '0%', pct: store.tasks.length ? (store.tasks.filter(t => t.status === 'completed').length / store.tasks.length * 100) : 0, color: '#f59e0b' },
                { label: 'Avg Efficiency', value: store.agents.length ? Math.round(store.agents.reduce((s, a) => s + a.efficiency, 0) / store.agents.length) + '%' : '0%', pct: store.agents.length ? store.agents.reduce((s, a) => s + a.efficiency, 0) / store.agents.length : 0, color: '#ec4899' },
            ].map(m => `
                <div class="analytics-metric">
                    <span class="metric-label">${m.label}</span>
                    <div style="display: flex; align-items: center;">
                        <span class="metric-value">${m.value}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${m.pct}%; background: ${m.color};"></div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        <!-- Priority Breakdown -->
        <div class="analytics-card">
            <h3>Tasks by Priority</h3>
            ${Object.entries(tasksByPriority).map(([label, count]) => {
                const colors = { Low: '#06b6d4', Medium: '#f59e0b', High: '#ef4444', Urgent: '#dc2626' };
                const maxP = Math.max(...Object.values(tasksByPriority), 1);
                return `
                    <div class="analytics-metric">
                        <span class="metric-label">${label}</span>
                        <div style="display: flex; align-items: center;">
                            <span class="metric-value">${count}</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(count / maxP) * 100}%; background: ${colors[label]};"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ===== Modals =====
function openModal(type) {
    const overlay = document.getElementById('modalOverlay');
    document.querySelectorAll('.modal-content').forEach(m => m.style.display = 'none');

    const modal = document.getElementById(`modal-${type}`);
    if (modal) {
        modal.style.display = 'block';
        overlay.classList.add('active');
        store.currentModal = type;

        // Populate task agent dropdown
        if (type === 'newTask') {
            const select = document.getElementById('taskAgent');
            select.innerHTML = '<option value="">-- Select Agent --</option>' +
                store.agents.map(a => `<option value="${a.id}">${a.name} (${ROLES[a.role]?.label || a.role})</option>`).join('');
        }
    }
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    store.currentModal = null;
    store.selectedAgentId = null;
}

// ===== Hire Agent =====
function hireAgent() {
    const name = document.getElementById('agentName').value.trim();
    const role = document.getElementById('agentRole').value;
    const personality = document.querySelector('input[name="personality"]:checked')?.value || 'professional';
    const skills = document.getElementById('agentSkills').value.split(',').map(s => s.trim()).filter(Boolean);
    const color = document.querySelector('input[name="avatarColor"]:checked')?.value || '#6366f1';

    if (!name) {
        showToast('Please enter an agent name', 'error');
        return;
    }

    const agent = {
        id: 'agent_' + Date.now(),
        name,
        role,
        personality,
        skills: skills.length > 0 ? skills : [ROLES[role]?.label || role],
        color,
        status: 'active',
        tasksCompleted: 0,
        tasksActive: 0,
        efficiency: 85 + Math.floor(Math.random() * 15),
        hiredAt: new Date(),
    };

    store.agents.push(agent);
    saveToStorage();
    closeModal();

    // Reset form
    document.getElementById('agentName').value = '';
    document.getElementById('agentSkills').value = '';

    showToast(`${name} has been hired as ${ROLES[role]?.label || role}!`, 'success');
    addNotification(`New Agent Hired`, `${name} joined the ${ROLES[role]?.dept || ''} department`, '🎉');

    // Refresh current page
    const activePage = document.querySelector('.page.active');
    if (activePage) navigateTo(activePage.id.replace('page-', ''));
}

// ===== Create Task =====
function createTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const agentId = document.getElementById('taskAgent').value;
    const priority = document.getElementById('taskPriority').value;
    const deadline = document.getElementById('taskDeadline').value;

    if (!title) {
        showToast('Please enter a task title', 'error');
        return;
    }

    const task = {
        id: 'task_' + Date.now(),
        title,
        description,
        agentId,
        priority,
        status: 'todo',
        deadline,
        createdAt: new Date(),
    };

    store.tasks.push(task);
    saveToStorage();
    closeModal();

    // Reset form
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';

    const agent = store.agents.find(a => a.id === agentId);
    showToast(`Task "${title}" created${agent ? ` and assigned to ${agent.name}` : ''}!`, 'success');

    const activePage = document.querySelector('.page.active');
    if (activePage) navigateTo(activePage.id.replace('page-', ''));
}

// ===== Agent Detail =====
function showAgentDetail(agentId) {
    const agent = store.agents.find(a => a.id === agentId);
    if (!agent) return;

    store.selectedAgentId = agentId;
    const agentTasks = store.tasks.filter(t => t.agentId === agentId);
    const completed = agentTasks.filter(t => t.status === 'completed').length;
    const active = agentTasks.filter(t => t.status !== 'completed').length;

    const body = document.getElementById('agentDetailBody');
    body.innerHTML = `
        <div class="agent-detail-header">
            <div class="agent-detail-avatar" style="background: ${agent.color}">
                ${agent.name.charAt(0)}
            </div>
            <div>
                <div class="agent-detail-name">${agent.name}</div>
                <div class="agent-detail-role">${ROLES[agent.role]?.icon || ''} ${ROLES[agent.role]?.label || agent.role} — ${ROLES[agent.role]?.dept || ''}</div>
                <div style="margin-top: 6px;">
                    <span class="agent-list-status ${agent.status}">${agent.status}</span>
                </div>
            </div>
        </div>
        <div class="agent-detail-grid">
            <div class="detail-stat">
                <div class="detail-stat-value">${completed}</div>
                <div class="detail-stat-label">Tasks Completed</div>
            </div>
            <div class="detail-stat">
                <div class="detail-stat-value">${active}</div>
                <div class="detail-stat-label">Active Tasks</div>
            </div>
            <div class="detail-stat">
                <div class="detail-stat-value">${agent.efficiency}%</div>
                <div class="detail-stat-label">Efficiency Score</div>
            </div>
            <div class="detail-stat">
                <div class="detail-stat-value">${daysSince(agent.hiredAt)}d</div>
                <div class="detail-stat-label">Days Employed</div>
            </div>
        </div>
        <div style="margin-top: 20px;">
            <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 10px;">Skills</h4>
            <div class="agent-card-skills">
                ${(agent.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('')}
            </div>
        </div>
        <div style="margin-top: 20px;">
            <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 10px;">Assigned Tasks</h4>
            ${agentTasks.length > 0 ? agentTasks.map(t => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <span style="font-size: 0.85rem;">${t.title}</span>
                    <span class="task-priority ${t.priority}" style="font-size: 0.7rem;">${t.status}</span>
                </div>
            `).join('') : '<p style="color: var(--text-muted); font-size: 0.85rem;">No tasks assigned</p>'}
        </div>
        <div style="margin-top: 20px; display: flex; gap: 8px;">
            <button class="btn btn-primary btn-sm" onclick="closeModal(); navigateTo('chat'); setTimeout(() => openChat('${agent.id}'), 100);">Chat with ${agent.name}</button>
            <button class="btn btn-secondary btn-sm" onclick="toggleAgentStatus('${agent.id}')">
                ${agent.status === 'active' ? 'Set Idle' : agent.status === 'idle' ? 'Activate' : 'Bring Online'}
            </button>
        </div>
    `;

    openModal('agentDetail');
}

function toggleAgentStatus(agentId) {
    const agent = store.agents.find(a => a.id === agentId);
    if (!agent) return;

    const cycle = { active: 'idle', idle: 'active', offline: 'active' };
    agent.status = cycle[agent.status] || 'active';
    saveToStorage();
    showToast(`${agent.name} is now ${agent.status}`, 'info');
    closeModal();

    const activePage = document.querySelector('.page.active');
    if (activePage) navigateTo(activePage.id.replace('page-', ''));
}

function fireAgent() {
    if (!store.selectedAgentId) return;
    const agent = store.agents.find(a => a.id === store.selectedAgentId);
    if (!agent) return;

    if (!confirm(`Are you sure you want to terminate ${agent.name}? This action cannot be undone.`)) return;

    store.agents = store.agents.filter(a => a.id !== store.selectedAgentId);
    store.tasks = store.tasks.map(t =>
        t.agentId === store.selectedAgentId ? { ...t, agentId: '' } : t
    );
    delete store.chatMessages[store.selectedAgentId];
    saveToStorage();
    closeModal();

    showToast(`${agent.name} has been terminated`, 'error');

    const activePage = document.querySelector('.page.active');
    if (activePage) navigateTo(activePage.id.replace('page-', ''));
}

// ===== Notifications =====
function toggleNotifications() {
    document.getElementById('notificationPanel').classList.toggle('open');
    renderNotifications();
}

function renderNotifications() {
    const list = document.getElementById('notificationList');
    list.innerHTML = store.notifications.map(n => `
        <div class="notification-item">
            <div class="notification-icon" style="background: ${n.color || 'var(--bg-tertiary)'}">
                ${n.icon || '📌'}
            </div>
            <div class="notification-body">
                <div class="notification-title">${n.title}</div>
                <div class="notification-desc">${n.desc}</div>
                <div class="notification-time">${n.time}</div>
            </div>
        </div>
    `).join('');

    if (store.notifications.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-muted);">No notifications</div>';
    }

    document.getElementById('notifBadge').textContent = store.notifications.length;
    document.getElementById('notifBadge').style.display = store.notifications.length > 0 ? 'flex' : 'none';
}

function addNotification(title, desc, icon) {
    store.notifications.unshift({
        id: 'n_' + Date.now(),
        title,
        desc,
        icon: icon || '📌',
        time: 'Just now',
        color: 'rgba(99,102,241,0.15)',
    });
    if (store.notifications.length > 20) store.notifications.pop();
    saveToStorage();
    renderNotifications();
}

function clearNotifications() {
    store.notifications = [];
    saveToStorage();
    renderNotifications();
}

// ===== Dark Mode =====
function toggleDarkMode() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('ai_workforce_theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

// ===== Toast =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
        <span class="toast-text">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ===== Utility =====
function daysSince(date) {
    const d = new Date(date);
    return Math.floor((Date.now() - d.getTime()) / 86400000);
}

// Office view is now a full floor plan - no toggle needed

function toggleUserMenu() {
    // Could implement a user dropdown menu
}

// ===== Global Search =====
document.getElementById('globalSearch')?.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    if (!query) return;

    // Simple search across agents and tasks
    const matchedAgents = store.agents.filter(a =>
        a.name.toLowerCase().includes(query) || (ROLES[a.role]?.label || '').toLowerCase().includes(query)
    );
    const matchedTasks = store.tasks.filter(t =>
        t.title.toLowerCase().includes(query)
    );

    if (matchedAgents.length > 0) {
        navigateTo('agents');
    } else if (matchedTasks.length > 0) {
        navigateTo('tasks');
    }
});

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    // Load saved data or init sample
    if (!loadFromStorage()) {
        initSampleData();
    }

    // Load theme preference
    const theme = localStorage.getItem('ai_workforce_theme');
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.checked = true;
    }

    // Render dashboard
    renderDashboard();
    renderNotifications();

    // Simulate periodic agent activity
    setInterval(() => {
        const activeAgents = store.agents.filter(a => a.status === 'active');
        if (activeAgents.length > 0) {
            const agent = activeAgents[Math.floor(Math.random() * activeAgents.length)];
            // Slightly adjust efficiency randomly
            agent.efficiency = Math.min(100, Math.max(70, agent.efficiency + (Math.random() > 0.5 ? 1 : -1)));
            saveToStorage();
        }
    }, 30000);
});

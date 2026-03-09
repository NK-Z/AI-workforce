/* ============================================
   AI Workforce — Virtual Office Application
   Production Version — Real API Integration
   ============================================ */

// ===== Auth Guard =====
if (!API.isLoggedIn()) {
    window.location.href = 'login.html';
}

// ===== Runtime State (not persisted — fetched from API) =====
const store = {
    agents: [],
    tasks: [],
    notifications: [],
    currentChatAgent: null,
    currentModal: null,
    selectedAgentId: null,
    user: API.getUser(),
    calendarConnected: false,
    calendarEvents: [],
    pollingInterval: null,
    selectedTaskId: null,
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

// ===== Data Fetching =====
async function loadAgents() {
    try {
        store.agents = await API.getAgents();
    } catch (e) {
        console.error('Failed to load agents:', e);
        store.agents = [];
    }
}

async function loadTasks() {
    try {
        store.tasks = await API.getTasks();
    } catch (e) {
        console.error('Failed to load tasks:', e);
        store.tasks = [];
    }
}

async function loadAll() {
    await Promise.all([loadAgents(), loadTasks()]);
}

// ===== Navigation =====
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);

    if (pageEl) pageEl.classList.add('active');
    if (navEl) navEl.classList.add('active');

    // Refresh page content (async)
    switch (page) {
        case 'dashboard': refreshDashboard(); break;
        case 'office': refreshOffice(); break;
        case 'agents': refreshAgents(); break;
        case 'tasks': refreshTasks(); break;
        case 'chat': renderChat(); break;
        case 'analytics': refreshAnalytics(); break;
    }

    document.getElementById('sidebar').classList.remove('open');
}

async function refreshDashboard() {
    await loadAll();
    renderDashboard();
}

async function refreshOffice() {
    await loadAll();
    renderOffice();
}

async function refreshAgents(filter = 'all') {
    await loadAgents();
    renderAgents(filter);
}

async function refreshTasks() {
    await loadAll();
    renderTasks();
}

async function refreshAnalytics() {
    await loadAll();
    renderAnalytics();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ===== Task Execution Polling =====
function startPolling() {
    if (store.pollingInterval) return; // already running
    store.pollingInterval = setInterval(async () => {
        const activeTasks = store.tasks.filter(t => t.status === 'in-progress');
        if (activeTasks.length === 0) return;

        let changed = false;
        for (const task of activeTasks) {
            try {
                const updated = await API.getTask(task.id);
                const existing = store.tasks.find(t => t.id === updated.id);
                if (existing) {
                    const wasInProgress = existing.status === 'in-progress';
                    const nowDone = updated.status === 'completed';
                    Object.assign(existing, updated);
                    changed = true;
                    if (wasInProgress && nowDone) {
                        showToast(`✅ ${updated.agent_name || 'Agent'} completed "${updated.title}"`, 'success');
                        // Push to notifications
                        store.notifications.unshift({
                            text: `${updated.agent_name || 'Agent'} completed "${updated.title}"`,
                            time: 'Just now',
                            color: '#10b981',
                        });
                        updateNotifBadge();
                    }
                }
            } catch (e) {
                // task might have been deleted — ignore
            }
        }

        if (changed) {
            // Re-render task boards without full reload
            const activePage = document.querySelector('.page.active');
            const pageId = activePage?.id?.replace('page-', '');
            if (pageId === 'tasks') renderTasks();
            else if (pageId === 'dashboard') renderTaskBoard('dashboardTaskBoard');
        }
    }, 4000);
}

function stopPolling() {
    if (store.pollingInterval) {
        clearInterval(store.pollingInterval);
        store.pollingInterval = null;
    }
}

function updateNotifBadge() {
    const badge = document.getElementById('notifBadge');
    if (badge) badge.style.display = store.notifications.length > 0 ? 'flex' : 'none';
    const list = document.getElementById('notificationList');
    if (list && store.notifications.length > 0) {
        list.innerHTML = store.notifications.slice(0, 10).map(n => `
            <div class="activity-item">
                <div class="activity-dot" style="background: ${n.color || '#6366f1'}"></div>
                <div class="activity-content">
                    <div class="activity-text">${n.text}</div>
                    <div class="activity-time">${n.time}</div>
                </div>
            </div>
        `).join('');
    }
}

// ===== Dashboard Render =====
function renderDashboard() {
    const user = store.user;
    const welcomeEl = document.getElementById('welcomeName');
    if (welcomeEl) welcomeEl.textContent = user?.display_name || user?.email || 'there';

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
    if (store.agents.length === 0) {
        agentList.innerHTML = `
            <div style="text-align:center; padding:30px; color:var(--text-muted);">
                <p>No agents yet.</p>
                <button class="btn btn-primary btn-sm" onclick="openModal('hireAgent')" style="margin-top:8px;">Hire Your First Agent</button>
            </div>`;
    } else {
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
    }

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
    `).join('') || '<div style="padding:20px; text-align:center; color:var(--text-muted);">No recent activity</div>';

    // Calendar events panel
    renderCalendarPanel();

    // Task board
    renderTaskBoard('dashboardTaskBoard');
}

function generateActivities() {
    const activities = [];
    store.agents.filter(a => a.status === 'active').forEach(agent => {
        activities.push({
            text: `<strong>${agent.name}</strong> is working on assigned tasks`,
            time: 'Now',
            color: '#10b981',
        });
    });
    store.tasks.filter(t => t.status === 'completed').slice(0, 3).forEach(task => {
        activities.push({
            text: `<strong>${task.agent_name || 'Agent'}</strong> completed "${task.title}"`,
            time: 'Recently',
            color: '#6366f1',
        });
    });
    return activities.slice(0, 6);
}

async function renderCalendarPanel() {
    const panel = document.getElementById('calendarPanel');
    if (!panel) return;

    try {
        const status = await API.getCalendarStatus();
        store.calendarConnected = status.connected;
    } catch {
        store.calendarConnected = false;
    }

    if (!store.calendarConnected) {
        panel.innerHTML = `
            <div style="text-align:center; padding:20px; color:var(--text-muted);">
                <p style="margin-bottom:10px;">Connect your calendar to see events</p>
                <button class="btn btn-secondary btn-sm" onclick="connectCalendar()">Connect Google Calendar</button>
            </div>`;
        return;
    }

    try {
        const data = await API.getCalendarEvents();
        store.calendarEvents = data.events || [];
    } catch {
        store.calendarEvents = [];
    }

    if (store.calendarEvents.length === 0) {
        panel.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted);">No upcoming events</div>';
        return;
    }

    panel.innerHTML = store.calendarEvents.slice(0, 5).map(ev => {
        const start = new Date(ev.start);
        const timeStr = start.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `
            <div class="activity-item">
                <div class="activity-dot" style="background: #6366f1"></div>
                <div class="activity-content">
                    <div class="activity-text">${ev.summary}</div>
                    <div class="activity-time">${timeStr}${ev.location ? ' — ' + ev.location : ''}</div>
                </div>
            </div>`;
    }).join('');
}

async function connectCalendar() {
    try {
        const data = await API.getCalendarAuthUrl();
        // Append user_id as state for the callback
        const user = store.user;
        const url = data.url + (data.url.includes('?') ? '&' : '?') + 'state=' + encodeURIComponent(user.id);
        window.open(url, '_blank');
        showToast('Complete the authorization in the new tab, then refresh.', 'info');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function renderTaskBoard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const todoTasks = store.tasks.filter(t => t.status === 'todo');
    const progressTasks = store.tasks.filter(t => t.status === 'in-progress');
    const completedTasks = store.tasks.filter(t => t.status === 'completed');

    container.innerHTML = `
        <div class="task-column" ondragover="onColumnDragOver(event)" ondrop="onColumnDrop(event, 'todo')">
            <div class="task-column-header">
                <span class="task-status-dot pending"></span>
                <span>To Do</span>
                <span class="task-count">${todoTasks.length}</span>
            </div>
            <div class="task-list">${todoTasks.map(t => renderTaskCard(t)).join('')}</div>
        </div>
        <div class="task-column" ondragover="onColumnDragOver(event)" ondrop="onColumnDrop(event, 'in-progress')">
            <div class="task-column-header">
                <span class="task-status-dot in-progress"></span>
                <span>In Progress</span>
                <span class="task-count">${progressTasks.length}</span>
            </div>
            <div class="task-list">${progressTasks.map(t => renderTaskCard(t)).join('')}</div>
        </div>
        <div class="task-column" ondragover="onColumnDragOver(event)" ondrop="onColumnDrop(event, 'completed')">
            <div class="task-column-header">
                <span class="task-status-dot completed"></span>
                <span>Completed</span>
                <span class="task-count">${completedTasks.length}</span>
            </div>
            <div class="task-list">${completedTasks.map(t => renderTaskCard(t)).join('')}</div>
        </div>
    `;
}

function renderTaskCard(task) {
    const isWorking = task.status === 'in-progress';
    const isDone = task.status === 'completed';
    const cardClass = isWorking ? 'working' : isDone ? 'done' : '';

    const progressHtml = isWorking
        ? `<div class="task-progress-note"><span class="spin">⟳</span>${escapeHtml(task.progress_note || 'Agent is working...')}</div>`
        : '';

    const resultSummary = isDone && task.result
        ? `<div class="task-result-preview">✅ Result ready — click to view</div>`
        : '';

    return `
        <div class="task-card ${cardClass}"
             draggable="true"
             ondragstart="onTaskDragStart(event, '${task.id}')"
             onclick="showTaskDetail('${task.id}')">
            <div class="task-card-title">${task.title}</div>
            ${task.description ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;">${escapeHtml(task.description.slice(0, 80))}${task.description.length > 80 ? '…' : ''}</div>` : ''}
            <div class="task-card-meta">
                <span class="task-priority ${task.priority}">${task.priority}</span>
                ${task.agent_name ? `<div class="task-assignee" style="background:${task.agent_color || '#6366f1'}" title="${task.agent_name}">${task.agent_name.charAt(0)}</div>` : ''}
            </div>
            ${progressHtml}
            ${resultSummary}
        </div>
    `;
}

// ===== Drag and Drop =====
let draggedTaskId = null;

function onTaskDragStart(event, taskId) {
    draggedTaskId = taskId;
    event.dataTransfer.effectAllowed = 'move';
    event.target.style.opacity = '0.5';
    event.target.addEventListener('dragend', () => { event.target.style.opacity = ''; }, { once: true });
}

function onColumnDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    event.currentTarget.classList.add('drag-over');
    event.currentTarget.addEventListener('dragleave', () => {
        event.currentTarget.classList.remove('drag-over');
    }, { once: true });
}

async function onColumnDrop(event, newStatus) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    if (!draggedTaskId) return;

    const task = store.tasks.find(t => t.id === draggedTaskId);
    if (!task || task.status === newStatus) return;

    try {
        await API.updateTask(draggedTaskId, { status: newStatus });
        task.status = newStatus;
        showToast(`Moved to "${newStatus.replace('-', ' ')}"`, 'info');
        const activePage = document.querySelector('.page.active');
        const pageId = activePage?.id?.replace('page-', '');
        if (pageId === 'tasks') renderTasks();
        else if (pageId === 'dashboard') renderTaskBoard('dashboardTaskBoard');
    } catch (e) {
        showToast(e.message, 'error');
    }
    draggedTaskId = null;
}

// ===== Task Detail Modal =====
let taskDetailPollInterval = null;

async function showTaskDetail(taskId) {
    store.selectedTaskId = taskId;

    // Stop any existing poll
    if (taskDetailPollInterval) {
        clearInterval(taskDetailPollInterval);
        taskDetailPollInterval = null;
    }

    await renderTaskDetailModal(taskId);
    openModal('taskDetail');

    // If task is in-progress, poll for updates
    const task = store.tasks.find(t => t.id === taskId);
    if (task?.status === 'in-progress') {
        taskDetailPollInterval = setInterval(async () => {
            const updated = await API.getTask(taskId);
            const existing = store.tasks.find(t => t.id === taskId);
            if (existing) Object.assign(existing, updated);
            renderTaskDetailBody(updated);
            if (updated.status !== 'in-progress') {
                clearInterval(taskDetailPollInterval);
                taskDetailPollInterval = null;
            }
        }, 3000);
    }
}

async function renderTaskDetailModal(taskId) {
    const body = document.getElementById('taskDetailBody');
    body.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);">Loading...</div>';

    try {
        const task = await API.getTask(taskId);
        const existing = store.tasks.find(t => t.id === taskId);
        if (existing) Object.assign(existing, task);
        renderTaskDetailBody(task);
    } catch (e) {
        body.innerHTML = `<p style="color:var(--danger);">Error: ${e.message}</p>`;
    }
}

function renderTaskDetailBody(task) {
    const body = document.getElementById('taskDetailBody');
    if (!body) return;

    const isWorking = task.status === 'in-progress';
    const isDone = task.status === 'completed';
    const agent = store.agents.find(a => a.id === task.agent_id);

    const statusColors = { 'todo': '#64748b', 'in-progress': '#f59e0b', 'completed': '#10b981' };
    const statusColor = statusColors[task.status] || '#64748b';

    body.innerHTML = `
        <div style="margin-bottom: 16px;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <h3 style="font-size:1.1rem; font-weight:700; flex:1;">${escapeHtml(task.title)}</h3>
                <span style="font-size:0.75rem; font-weight:600; padding:3px 10px; border-radius:20px; background:${statusColor}22; color:${statusColor}; border:1px solid ${statusColor}55;">
                    ${task.status.replace('-', ' ').toUpperCase()}
                </span>
            </div>
            ${task.description ? `<p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">${escapeHtml(task.description)}</p>` : ''}
        </div>

        <div style="display:flex; gap:16px; flex-wrap:wrap; margin-bottom:16px; padding:12px; background:var(--bg-tertiary); border-radius:8px;">
            <div><span style="font-size:0.72rem; color:var(--text-muted); display:block;">Priority</span>
                <span class="task-priority ${task.priority}" style="margin-top:4px; display:inline-block;">${task.priority}</span></div>
            <div><span style="font-size:0.72rem; color:var(--text-muted); display:block;">Assigned to</span>
                <span style="font-size:0.85rem; font-weight:600;">${agent ? `<span style="display:inline-flex;align-items:center;gap:6px;"><span style="background:${agent.color};color:white;border-radius:50%;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:0.65rem;">${agent.name.charAt(0)}</span>${agent.name}</span>` : 'Unassigned'}</span></div>
            ${task.deadline ? `<div><span style="font-size:0.72rem; color:var(--text-muted); display:block;">Deadline</span>
                <span style="font-size:0.85rem;">${task.deadline}</span></div>` : ''}
            ${task.started_at ? `<div><span style="font-size:0.72rem; color:var(--text-muted); display:block;">Started</span>
                <span style="font-size:0.85rem;">${new Date(task.started_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span></div>` : ''}
            ${task.completed_at ? `<div><span style="font-size:0.72rem; color:var(--text-muted); display:block;">Completed</span>
                <span style="font-size:0.85rem;">${new Date(task.completed_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span></div>` : ''}
        </div>

        ${isWorking ? `
        <div style="padding:14px; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3); border-radius:8px; margin-bottom:16px;">
            <div style="font-size:0.8rem; font-weight:600; color:var(--warning); margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                <span class="spin" style="display:inline-block; animation:spin 1s linear infinite;">⟳</span>
                Agent is working on this task...
            </div>
            <div style="font-size:0.82rem; color:var(--text-secondary);" id="liveProgressNote">${escapeHtml(task.progress_note || 'Processing...')}</div>
        </div>` : ''}

        ${isDone && task.result ? `
        <div>
            <div style="font-size:0.85rem; font-weight:600; margin-bottom:8px; color:var(--success); display:flex; align-items:center; gap:6px;">
                ✅ Completed Work
            </div>
            <div style="background:var(--bg-tertiary); border:1px solid var(--border-color); border-left:3px solid var(--success); border-radius:8px; padding:14px; font-size:0.82rem; color:var(--text-secondary); line-height:1.7; white-space:pre-wrap; word-break:break-word; max-height:400px; overflow-y:auto;">${escapeHtml(task.result)}</div>
        </div>` : ''}

        ${!isDone ? `
        <div style="margin-top:16px; display:flex; gap:8px; flex-wrap:wrap;">
            ${task.status !== 'completed' ? `<button class="btn btn-primary btn-sm" onclick="manualMoveTask('${task.id}', '${task.status}')">Move to ${task.status === 'todo' ? 'In Progress' : 'Completed'}</button>` : ''}
        </div>` : ''}
    `;
}

async function manualMoveTask(taskId, currentStatus) {
    const cycle = { 'todo': 'in-progress', 'in-progress': 'completed' };
    const newStatus = cycle[currentStatus];
    if (!newStatus) return;

    try {
        const updated = await API.updateTask(taskId, { status: newStatus });
        const existing = store.tasks.find(t => t.id === taskId);
        if (existing) Object.assign(existing, updated);
        renderTaskDetailBody(updated);
        showToast(`Moved to "${newStatus.replace('-', ' ')}"`, 'info');
        const activePage = document.querySelector('.page.active');
        const pageId = activePage?.id?.replace('page-', '');
        if (pageId === 'tasks') renderTasks();
        else if (pageId === 'dashboard') renderTaskBoard('dashboardTaskBoard');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function deleteCurrentTask() {
    if (!store.selectedTaskId) return;
    const task = store.tasks.find(t => t.id === store.selectedTaskId);
    if (!confirm(`Delete task "${task?.title}"?`)) return;

    try {
        await API.deleteTask(store.selectedTaskId);
        store.tasks = store.tasks.filter(t => t.id !== store.selectedTaskId);
        closeModal();
        showToast('Task deleted', 'info');
        const activePage = document.querySelector('.page.active');
        const pageId = activePage?.id?.replace('page-', '');
        if (pageId === 'tasks') renderTasks();
        else if (pageId === 'dashboard') renderTaskBoard('dashboardTaskBoard');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// ===== Office Floor Plan =====

const OFFICE_LAYOUT = {
    rooms: [
        { id: 'workspace', label: 'Open Workspace', x: 20, y: 20, w: 520, h: 360 },
        { id: 'meeting', label: 'Meeting Room', x: 560, y: 20, w: 320, h: 200 },
        { id: 'manager-office', label: 'Manager Office', x: 560, y: 240, w: 180, h: 140 },
        { id: 'breakroom', label: 'Break Room', x: 560, y: 400, w: 320, h: 200 },
        { id: 'reception', label: 'Reception', x: 20, y: 400, w: 250, h: 200 },
        { id: 'server', label: 'Server Room', x: 290, y: 400, w: 130, h: 200 },
        { id: 'research', label: 'Research Lab', x: 755, y: 240, w: 125, h: 140 },
    ],
    desks: [
        { x: 50,  y: 80,  chair: 'bottom' },
        { x: 180, y: 80,  chair: 'bottom' },
        { x: 310, y: 80,  chair: 'bottom' },
        { x: 50,  y: 200, chair: 'bottom' },
        { x: 180, y: 200, chair: 'bottom' },
        { x: 310, y: 200, chair: 'bottom' },
        { x: 50,  y: 300, chair: 'bottom' },
        { x: 180, y: 300, chair: 'bottom' },
        { x: 590, y: 290, chair: 'bottom' },
        { x: 775, y: 290, chair: 'bottom' },
    ],
    meetingTable: { x: 620, y: 70, w: 200, h: 100 },
    plants: [
        { x: 530, y: 30 }, { x: 530, y: 370 }, { x: 270, y: 410 },
        { x: 870, y: 30 }, { x: 870, y: 590 },
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

    // Rooms
    OFFICE_LAYOUT.rooms.forEach(room => {
        html += `<div class="fp-room" style="left:${room.x}px; top:${room.y}px; width:${room.w}px; height:${room.h}px;">
            <span class="fp-room-label">${room.label}</span>
        </div>`;
    });

    // Meeting table + chairs
    const mt = OFFICE_LAYOUT.meetingTable;
    html += `<div class="fp-table" style="left:${mt.x}px; top:${mt.y}px; width:${mt.w}px; height:${mt.h}px; border-radius: 50px;"></div>`;
    [
        { x: mt.x + 30, y: mt.y - 16 }, { x: mt.x + 90, y: mt.y - 16 }, { x: mt.x + 150, y: mt.y - 16 },
        { x: mt.x + 30, y: mt.y + mt.h }, { x: mt.x + 90, y: mt.y + mt.h }, { x: mt.x + 150, y: mt.y + mt.h },
    ].forEach((c, i) => {
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

    // Place agents at desks
    const deskSlots = OFFICE_LAYOUT.desks;
    store.agents.forEach((agent, index) => {
        if (index >= deskSlots.length) return;
        const slot = deskSlots[index];
        const currentTask = store.tasks.find(t => t.agent_id === agent.id && t.status === 'in-progress');
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
    });

    // Empty desks
    for (let i = store.agents.length; i < deskSlots.length; i++) {
        const slot = deskSlots[i];
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

    grid.innerHTML = agents.map(agent => `
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
                    <div class="agent-stat-value">${agent.tasks_completed || 0}</div>
                    <div class="agent-stat-label">Completed</div>
                </div>
                <div class="agent-stat">
                    <div class="agent-stat-value">${agent.tasks_active || 0}</div>
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
    `).join('');

    if (agents.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <p style="font-size: 1.1rem; margin-bottom: 12px;">No agents found</p>
                <button class="btn btn-primary" onclick="openModal('hireAgent')">Hire Your First Agent</button>
            </div>`;
    }
}

function filterAgents(filter) {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    refreshAgents(filter);
}

// ===== Tasks Page =====
function renderTasks() {
    renderTaskBoard('fullTaskBoard');
}

// ===== Chat — Real AI =====
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

    if (store.agents.length === 0) {
        contacts.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted);">Hire agents to chat with them</div>';
    }
}

async function openChat(agentId) {
    const agent = store.agents.find(a => a.id === agentId);
    if (!agent) return;

    store.currentChatAgent = agentId;

    // Update contacts highlight
    document.querySelectorAll('.chat-contact').forEach(c => c.classList.remove('active'));
    event?.target?.closest?.('.chat-contact')?.classList?.add('active');

    // Update header
    document.getElementById('chatHeader').innerHTML = `
        <div class="chat-header-info">
            <div class="chat-avatar" style="background: ${agent.color}; color: white;">${agent.name.charAt(0)}</div>
            <div>
                <h3>${agent.name}</h3>
                <span class="chat-status">${agent.status === 'active' ? 'Online — powered by Claude AI' : agent.status}</span>
            </div>
        </div>
    `;

    document.getElementById('chatInputArea').style.display = 'flex';

    // Load real chat history from API
    const container = document.getElementById('chatMessages');
    container.innerHTML = '<div class="chat-empty"><div class="typing-indicator"><span></span><span></span><span></span></div><p>Loading conversation...</p></div>';

    try {
        const messages = await API.getChatHistory(agentId);
        if (messages.length === 0) {
            container.innerHTML = `
                <div class="chat-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    <p>Start a conversation with ${agent.name}</p>
                    <span style="font-size:0.78rem; color:var(--text-muted);">${agent.name} is a real AI agent powered by Claude. Try asking about their tasks!</span>
                </div>`;
        } else {
            renderChatMessages(messages);
        }
    } catch (e) {
        container.innerHTML = `<div class="chat-empty"><p>Error loading history: ${e.message}</p></div>`;
    }
}

function renderChatMessages(messages) {
    const container = document.getElementById('chatMessages');
    container.innerHTML = messages.map(msg => `
        <div class="chat-message ${msg.role === 'user' ? 'sent' : 'received'}">
            ${msg.content}
            <div class="chat-message-time">${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || !store.currentChatAgent) return;

    const agentId = store.currentChatAgent;
    input.value = '';
    input.disabled = true;

    // Show user message immediately
    const container = document.getElementById('chatMessages');
    // Remove empty state if present
    const emptyEl = container.querySelector('.chat-empty');
    if (emptyEl) emptyEl.remove();

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    container.insertAdjacentHTML('beforeend', `
        <div class="chat-message sent">
            ${escapeHtml(text)}
            <div class="chat-message-time">${now}</div>
        </div>
    `);

    // Show typing indicator
    container.insertAdjacentHTML('beforeend', `
        <div class="chat-message received typing-msg">
            <div class="typing-indicator"><span></span><span></span><span></span></div>
        </div>
    `);
    container.scrollTop = container.scrollHeight;

    try {
        const response = await API.sendChat(agentId, text);

        // Remove typing indicator
        const typingEl = container.querySelector('.typing-msg');
        if (typingEl) typingEl.remove();

        // Show agent response
        const respTime = new Date(response.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        container.insertAdjacentHTML('beforeend', `
            <div class="chat-message received">
                ${response.content}
                <div class="chat-message-time">${respTime}</div>
            </div>
        `);
        container.scrollTop = container.scrollHeight;
    } catch (e) {
        const typingEl = container.querySelector('.typing-msg');
        if (typingEl) typingEl.remove();

        container.insertAdjacentHTML('beforeend', `
            <div class="chat-message received" style="border-left: 3px solid var(--danger);">
                Error: ${e.message}
                <div class="chat-message-time">${now}</div>
            </div>
        `);
    }

    input.disabled = false;
    input.focus();
}

function handleChatKeypress(e) {
    if (e.key === 'Enter') sendChatMessage();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== Analytics =====
function renderAnalytics() {
    const container = document.getElementById('analyticsContent');

    const agentPerformance = store.agents.map(a => ({
        name: a.name, efficiency: a.efficiency, color: a.color,
        tasks: a.tasks_completed || 0,
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
        <div class="analytics-card">
            <h3>Agent Efficiency</h3>
            <div class="analytics-chart">
                ${agentPerformance.length > 0 ? agentPerformance.map(a => `
                    <div class="chart-bar" style="height: ${a.efficiency}%; background: ${a.color};" title="${a.name}: ${a.efficiency}%">
                        <span class="chart-bar-label">${a.name}</span>
                    </div>
                `).join('') : '<div style="display:flex;align-items:center;justify-content:center;width:100%;color:var(--text-muted);">No agents yet</div>'}
            </div>
        </div>
        <div class="analytics-card">
            <h3>Task Distribution</h3>
            <div class="analytics-chart">
                ${Object.entries(tasksByStatus).map(([label, count]) => {
                    const colors = { 'To Do': '#64698a', 'In Progress': '#f59e0b', 'Completed': '#10b981' };
                    const maxTasks = Math.max(...Object.values(tasksByStatus), 1);
                    return `<div class="chart-bar" style="height: ${(count / maxTasks) * 100}%; background: ${colors[label]};" title="${label}: ${count}">
                        <span class="chart-bar-label">${label}</span>
                    </div>`;
                }).join('')}
            </div>
        </div>
        <div class="analytics-card">
            <h3>Key Metrics</h3>
            ${[
                { label: 'Total Agents', value: store.agents.length, pct: 100, color: '#6366f1' },
                { label: 'Active Agents', value: store.agents.filter(a => a.status === 'active').length, pct: store.agents.length ? (store.agents.filter(a => a.status === 'active').length / store.agents.length * 100) : 0, color: '#10b981' },
                { label: 'Completion Rate', value: store.tasks.length ? Math.round(store.tasks.filter(t => t.status === 'completed').length / store.tasks.length * 100) + '%' : '0%', pct: store.tasks.length ? (store.tasks.filter(t => t.status === 'completed').length / store.tasks.length * 100) : 0, color: '#f59e0b' },
                { label: 'Avg Efficiency', value: store.agents.length ? Math.round(store.agents.reduce((s, a) => s + a.efficiency, 0) / store.agents.length) + '%' : '0%', pct: store.agents.length ? store.agents.reduce((s, a) => s + a.efficiency, 0) / store.agents.length : 0, color: '#ec4899' },
            ].map(m => `
                <div class="analytics-metric">
                    <span class="metric-label">${m.label}</span>
                    <div style="display:flex; align-items:center;">
                        <span class="metric-value">${m.value}</span>
                        <div class="progress-bar"><div class="progress-fill" style="width:${m.pct}%; background:${m.color};"></div></div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="analytics-card">
            <h3>Tasks by Priority</h3>
            ${Object.entries(tasksByPriority).map(([label, count]) => {
                const colors = { Low: '#06b6d4', Medium: '#f59e0b', High: '#ef4444', Urgent: '#dc2626' };
                const maxP = Math.max(...Object.values(tasksByPriority), 1);
                return `<div class="analytics-metric">
                    <span class="metric-label">${label}</span>
                    <div style="display:flex; align-items:center;">
                        <span class="metric-value">${count}</span>
                        <div class="progress-bar"><div class="progress-fill" style="width:${(count / maxP) * 100}%; background:${colors[label]};"></div></div>
                    </div>
                </div>`;
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
    store.selectedTaskId = null;
    // Stop task detail polling
    if (taskDetailPollInterval) {
        clearInterval(taskDetailPollInterval);
        taskDetailPollInterval = null;
    }
}

// ===== Hire Agent (API) =====
async function hireAgent() {
    const name = document.getElementById('agentName').value.trim();
    const role = document.getElementById('agentRole').value;
    const personality = document.querySelector('input[name="personality"]:checked')?.value || 'professional';
    const skills = document.getElementById('agentSkills').value.split(',').map(s => s.trim()).filter(Boolean);
    const color = document.querySelector('input[name="avatarColor"]:checked')?.value || '#6366f1';
    const systemPrompt = document.getElementById('agentSystemPrompt')?.value?.trim() || '';

    if (!name) {
        showToast('Please enter an agent name', 'error');
        return;
    }

    try {
        const agent = await API.createAgent({
            name, role, personality,
            skills: skills.length > 0 ? skills : [ROLES[role]?.label || role],
            color,
            system_prompt: systemPrompt,
        });
        closeModal();
        document.getElementById('agentName').value = '';
        document.getElementById('agentSkills').value = '';
        if (document.getElementById('agentSystemPrompt')) document.getElementById('agentSystemPrompt').value = '';

        showToast(`${agent.name} has been hired as ${ROLES[agent.role]?.label || agent.role}!`, 'success');

        const activePage = document.querySelector('.page.active');
        if (activePage) navigateTo(activePage.id.replace('page-', ''));
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// ===== Create Task (API) =====
async function createTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const agentId = document.getElementById('taskAgent').value || null;
    const priority = document.getElementById('taskPriority').value;
    const deadline = document.getElementById('taskDeadline').value || null;

    if (!title) {
        showToast('Please enter a task title', 'error');
        return;
    }

    try {
        await API.createTask({ title, description, agent_id: agentId, priority, deadline });
        closeModal();
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';

        if (agentId) {
            const agent = store.agents.find(a => a.id === agentId);
            showToast(`Task assigned to ${agent?.name || 'agent'} — they're on it now!`, 'success');
        } else {
            showToast(`Task "${title}" created!`, 'success');
        }
        const activePage = document.querySelector('.page.active');
        if (activePage) navigateTo(activePage.id.replace('page-', ''));
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// ===== Agent Detail =====
async function showAgentDetail(agentId) {
    store.selectedAgentId = agentId;

    try {
        const agent = await API.getAgent(agentId);
        const agentTasks = store.tasks.filter(t => t.agent_id === agentId);
        const daysEmployed = Math.floor((Date.now() - new Date(agent.hired_at).getTime()) / 86400000);

        const body = document.getElementById('agentDetailBody');
        body.innerHTML = `
            <div class="agent-detail-header">
                <div class="agent-detail-avatar" style="background: ${agent.color}">${agent.name.charAt(0)}</div>
                <div>
                    <div class="agent-detail-name">${agent.name}</div>
                    <div class="agent-detail-role">${ROLES[agent.role]?.icon || ''} ${ROLES[agent.role]?.label || agent.role} — ${ROLES[agent.role]?.dept || ''}</div>
                    <div style="margin-top: 6px;"><span class="agent-list-status ${agent.status}">${agent.status}</span></div>
                </div>
            </div>
            <div class="agent-detail-grid">
                <div class="detail-stat"><div class="detail-stat-value">${agent.tasks_completed}</div><div class="detail-stat-label">Tasks Completed</div></div>
                <div class="detail-stat"><div class="detail-stat-value">${agent.tasks_active}</div><div class="detail-stat-label">Active Tasks</div></div>
                <div class="detail-stat"><div class="detail-stat-value">${agent.efficiency}%</div><div class="detail-stat-label">Efficiency</div></div>
                <div class="detail-stat"><div class="detail-stat-value">${daysEmployed}d</div><div class="detail-stat-label">Days Employed</div></div>
            </div>
            <div style="margin-top: 20px;">
                <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 10px;">Skills</h4>
                <div class="agent-card-skills">${(agent.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
            </div>
            ${agent.system_prompt ? `<div style="margin-top: 16px;">
                <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 6px;">Custom Instructions</h4>
                <p style="font-size: 0.82rem; color: var(--text-secondary); background: var(--bg-tertiary); padding: 10px 14px; border-radius: 8px;">${escapeHtml(agent.system_prompt)}</p>
            </div>` : ''}
            <div style="margin-top: 20px;">
                <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 10px;">Assigned Tasks</h4>
                ${agentTasks.length > 0 ? agentTasks.map(t => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                        <span style="font-size: 0.85rem;">${t.title}</span>
                        <span class="task-priority ${t.priority}" style="font-size: 0.7rem;">${t.status}</span>
                    </div>
                `).join('') : '<p style="color: var(--text-muted); font-size: 0.85rem;">No tasks assigned</p>'}
            </div>
            <div style="margin-top: 20px; display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn btn-primary btn-sm" onclick="closeModal(); navigateTo('chat'); setTimeout(() => openChat('${agent.id}'), 100);">Chat with ${agent.name}</button>
                <button class="btn btn-secondary btn-sm" onclick="toggleAgentStatus('${agent.id}', '${agent.status}')">
                    ${agent.status === 'active' ? 'Set Idle' : agent.status === 'idle' ? 'Activate' : 'Bring Online'}
                </button>
            </div>
        `;
        openModal('agentDetail');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function toggleAgentStatus(agentId, currentStatus) {
    const cycle = { active: 'idle', idle: 'active', offline: 'active' };
    const newStatus = cycle[currentStatus] || 'active';

    try {
        await API.updateAgent(agentId, { status: newStatus });
        showToast(`Agent is now ${newStatus}`, 'info');
        closeModal();
        const activePage = document.querySelector('.page.active');
        if (activePage) navigateTo(activePage.id.replace('page-', ''));
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function fireAgent() {
    if (!store.selectedAgentId) return;
    const agent = store.agents.find(a => a.id === store.selectedAgentId);
    if (!agent) return;
    if (!confirm(`Are you sure you want to terminate ${agent.name}? This action cannot be undone.`)) return;

    try {
        await API.deleteAgent(store.selectedAgentId);
        closeModal();
        showToast(`${agent.name} has been terminated`, 'error');
        const activePage = document.querySelector('.page.active');
        if (activePage) navigateTo(activePage.id.replace('page-', ''));
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// ===== Notifications (local for now) =====
function toggleNotifications() {
    document.getElementById('notificationPanel').classList.toggle('open');
}

function clearNotifications() {
    store.notifications = [];
    document.getElementById('notificationList').innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-muted);">No notifications</div>';
    document.getElementById('notifBadge').style.display = 'none';
}

// ===== Settings =====
function initSettings() {
    const apiUrlEl = document.getElementById('settingsApiUrl');
    if (apiUrlEl) apiUrlEl.value = API.getApiUrl();

    const user = store.user;
    const officeNameEl = document.getElementById('officeName');
    if (officeNameEl && user) officeNameEl.value = `${user.display_name}'s AI Office`;
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
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-text">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ===== Logout =====
function logout() {
    API.logout();
}

// ===== Global Search =====
document.getElementById('globalSearch')?.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    if (!query) return;
    const matchedAgents = store.agents.filter(a =>
        a.name.toLowerCase().includes(query) || (ROLES[a.role]?.label || '').toLowerCase().includes(query)
    );
    const matchedTasks = store.tasks.filter(t => t.title.toLowerCase().includes(query));
    if (matchedAgents.length > 0) navigateTo('agents');
    else if (matchedTasks.length > 0) navigateTo('tasks');
});

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', async () => {
    // Load theme
    const theme = localStorage.getItem('ai_workforce_theme');
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.checked = true;
    }

    // Fetch fresh user info
    try {
        const me = await API.getMe();
        store.user = me;
        localStorage.setItem('ai_workforce_user', JSON.stringify(me));
    } catch {
        // Token might be expired
        API.logout();
        return;
    }

    // Load data and render
    await loadAll();
    renderDashboard();
    initSettings();

    // Set welcome name
    const welcomeEl = document.getElementById('welcomeName');
    if (welcomeEl) welcomeEl.textContent = store.user?.display_name || 'there';

    // Notification badge
    document.getElementById('notifBadge').style.display = 'none';
    document.getElementById('notificationList').innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-muted);">No notifications</div>';

    // Start polling for in-progress tasks
    startPolling();

    // Check calendar param from redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar') === 'connected') {
        showToast('Google Calendar connected successfully!', 'success');
        window.history.replaceState({}, '', window.location.pathname);
    }
});

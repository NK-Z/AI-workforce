/* ============================================
   AI Workforce — API Client
   ============================================ */

const API = (() => {
    // Backend URL — change to your Render deployment URL in production
    const BASE = localStorage.getItem('ai_workforce_api_url') || 'http://localhost:8000';

    function getToken() {
        return localStorage.getItem('ai_workforce_token');
    }

    function setToken(token) {
        localStorage.setItem('ai_workforce_token', token);
    }

    function clearToken() {
        localStorage.removeItem('ai_workforce_token');
        localStorage.removeItem('ai_workforce_user');
    }

    function getUser() {
        const u = localStorage.getItem('ai_workforce_user');
        return u ? JSON.parse(u) : null;
    }

    function setUser(user) {
        localStorage.setItem('ai_workforce_user', JSON.stringify(user));
    }

    function isLoggedIn() {
        return !!getToken();
    }

    async function request(method, path, body = null) {
        const headers = { 'Content-Type': 'application/json' };
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const opts = { method, headers };
        if (body) {
            opts.body = JSON.stringify(body);
        }

        let res;
        try {
            res = await fetch(`${BASE}${path}`, opts);
        } catch (err) {
            throw new Error('Cannot connect to server. Is the backend running?');
        }

        if (res.status === 401) {
            clearToken();
            window.location.href = 'login.html';
            throw new Error('Session expired');
        }

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.detail || `Request failed (${res.status})`);
        }
        return data;
    }

    // ===== Auth =====
    async function register(email, password, displayName) {
        const data = await request('POST', '/auth/register', {
            email, password, display_name: displayName,
        });
        setToken(data.token);
        setUser(data.user);
        return data;
    }

    async function login(email, password) {
        const data = await request('POST', '/auth/login', { email, password });
        setToken(data.token);
        setUser(data.user);
        return data;
    }

    async function getMe() {
        return await request('GET', '/auth/me');
    }

    function logout() {
        clearToken();
        window.location.href = 'login.html';
    }

    // ===== Agents =====
    async function getAgents(status = null) {
        const qs = status ? `?status=${status}` : '';
        return await request('GET', `/agents/${qs}`);
    }

    async function createAgent(data) {
        return await request('POST', '/agents/', data);
    }

    async function getAgent(id) {
        return await request('GET', `/agents/${id}`);
    }

    async function updateAgent(id, data) {
        return await request('PATCH', `/agents/${id}`, data);
    }

    async function deleteAgent(id) {
        return await request('DELETE', `/agents/${id}`);
    }

    // ===== Tasks =====
    async function getTasks(status = null, agentId = null) {
        const params = [];
        if (status) params.push(`status=${status}`);
        if (agentId) params.push(`agent_id=${agentId}`);
        const qs = params.length ? `?${params.join('&')}` : '';
        return await request('GET', `/tasks/${qs}`);
    }

    async function createTask(data) {
        return await request('POST', '/tasks/', data);
    }

    async function updateTask(id, data) {
        return await request('PATCH', `/tasks/${id}`, data);
    }

    async function deleteTask(id) {
        return await request('DELETE', `/tasks/${id}`);
    }

    // ===== Chat =====
    async function getChatHistory(agentId, limit = 50) {
        return await request('GET', `/chat/${agentId}/history?limit=${limit}`);
    }

    async function sendChat(agentId, message) {
        return await request('POST', `/chat/${agentId}/send`, { message });
    }

    // ===== Calendar =====
    async function getCalendarAuthUrl() {
        return await request('GET', '/calendar/auth-url');
    }

    async function getCalendarEvents() {
        return await request('GET', '/calendar/events');
    }

    async function getCalendarStatus() {
        return await request('GET', '/calendar/status');
    }

    async function disconnectCalendar() {
        return await request('DELETE', '/calendar/disconnect');
    }

    // ===== Config =====
    function setApiUrl(url) {
        localStorage.setItem('ai_workforce_api_url', url.replace(/\/$/, ''));
        window.location.reload();
    }

    function getApiUrl() {
        return BASE;
    }

    return {
        isLoggedIn, getToken, getUser, logout,
        register, login, getMe,
        getAgents, createAgent, getAgent, updateAgent, deleteAgent,
        getTasks, createTask, updateTask, deleteTask,
        getChatHistory, sendChat,
        getCalendarAuthUrl, getCalendarEvents, getCalendarStatus, disconnectCalendar,
        setApiUrl, getApiUrl,
    };
})();

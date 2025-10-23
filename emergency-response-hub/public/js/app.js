// Global variables
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// DOM elements
const authModal = document.getElementById('authModal');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authMessage = document.getElementById('authMessage');
const authTabs = document.querySelectorAll('.auth-tab');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const notification = document.getElementById('notification');

// Modal elements
const incidentModal = document.getElementById('incidentModal');
const assignmentModal = document.getElementById('assignmentModal');
const updateAssignmentModal = document.getElementById('updateAssignmentModal');
const closeModalButtons = document.querySelectorAll('.close');

// Form elements
const newIncidentBtn = document.getElementById('newIncidentBtn');
const newAssignmentBtn = document.getElementById('newAssignmentBtn');
const incidentForm = document.getElementById('incidentForm');
const assignmentForm = document.getElementById('assignmentForm');
const updateAssignmentForm = document.getElementById('updateAssignmentForm');
const profileForm = document.getElementById('profileForm');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    if (authToken) {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            showDashboard();
            loadDashboardData();
        } else {
            showAuthModal();
        }
    } else {
        showAuthModal();
    }

    // Set up event listeners
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    // Auth tabs
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchAuthTab(tabName);
        });
    });

    // Auth forms
    loginBtn.addEventListener('click', handleLogin);
    registerBtn.addEventListener('click', handleRegister);

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = item.getAttribute('data-page');
            navigateToPage(pageName);
        });
    });

    // Modals
    closeModalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Buttons
    newIncidentBtn.addEventListener('click', () => {
        incidentModal.style.display = 'block';
    });

    newAssignmentBtn.addEventListener('click', () => {
        populateAssignmentForm();
        assignmentModal.style.display = 'block';
    });

    // Forms
    incidentForm.addEventListener('submit', handleIncidentSubmit);
    assignmentForm.addEventListener('submit', handleAssignmentSubmit);
    updateAssignmentForm.addEventListener('submit', handleUpdateAssignmentSubmit);
    profileForm.addEventListener('submit', handleProfileSubmit);
}

// Switch between login and register tabs
function switchAuthTab(tabName) {
    authTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        }
    });

    if (tabName === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }

    authMessage.textContent = '';
    authMessage.className = 'auth-message';
}

// Show auth modal
function showAuthModal() {
    authModal.style.display = 'block';
    dashboard.classList.add('hidden');
    switchAuthTab('login');
}

// Show dashboard
function showDashboard() {
    authModal.style.display = 'none';
    dashboard.classList.remove('hidden');
    
    // Update user info
    document.getElementById('userName').textContent = currentUser.username;
    document.getElementById('userRole').textContent = currentUser.role;
    
    // Show/hide coordinator-only elements
    if (currentUser.role !== 'coordinator') {
        document.getElementById('volunteersNav').style.display = 'none';
        document.getElementById('newAssignmentBtn').style.display = 'none';
    } else {
        document.getElementById('volunteersNav').style.display = 'flex';
        document.getElementById('newAssignmentBtn').style.display = 'inline-block';
    }
    
    // Show/hide volunteer profile fields
    if (currentUser.role === 'volunteer') {
        document.getElementById('volunteerProfileFields').classList.remove('hidden');
    } else {
        document.getElementById('volunteerProfileFields').classList.add('hidden');
    }
    
    // Navigate to dashboard
    navigateToPage('dashboard');
}

// Navigate to a page
function navigateToPage(pageName) {
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageName) {
            item.classList.add('active');
        }
    });

    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === `${pageName}Page`) {
            page.classList.add('active');
        }
    });

    // Load page data
    loadPageData(pageName);
}

// Load page data
function loadPageData(pageName) {
    switch (pageName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'incidents':
            loadIncidents();
            break;
        case 'volunteers':
            if (currentUser.role === 'coordinator') {
                loadVolunteers();
            }
            break;
        case 'assignments':
            loadAssignments();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load stats
        const incidents = await apiCall('/api/incidents');
        const volunteers = await apiCall('/api/volunteers');
        const assignments = await apiCall('/api/assignments');
        
        document.getElementById('totalIncidents').textContent = incidents.length;
        document.getElementById('totalVolunteers').textContent = volunteers.length;
        document.getElementById('totalAssignments').textContent = assignments.length;
        document.getElementById('resolvedIncidents').textContent = 
            incidents.filter(i => i.status === 'resolved').length;
        
        // Load recent incidents
        const recentIncidentsTable = document.getElementById('recentIncidentsTable');
        recentIncidentsTable.innerHTML = '';
        
        incidents.slice(0, 5).forEach(incident => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${incident.id}</td>
                <td>${incident.type}</td>
                <td><span class="status-badge severity-${incident.severity}">${incident.severity}</span></td>
                <td><span class="status-badge status-${incident.status}">${incident.status}</span></td>
                <td>${incident.reporter.username}</td>
                <td>${formatDate(incident.createdAt)}</td>
            `;
            recentIncidentsTable.appendChild(row);
        });
    } catch (error) {
        showNotification('Error loading dashboard data', 'error');
    }
}

// Load incidents
async function loadIncidents() {
    try {
        const incidents = await apiCall('/api/incidents');
        const incidentsTable = document.getElementById('incidentsTable');
        incidentsTable.innerHTML = '';
        
        incidents.forEach(incident => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${incident.id}</td>
                <td>${incident.type}</td>
                <td>${incident.latitude}, ${incident.longitude}</td>
                <td><span class="status-badge severity-${incident.severity}">${incident.severity}</span></td>
                <td><span class="status-badge status-${incident.status}">${incident.status}</span></td>
                <td>${incident.reporter.username}</td>
                <td>
                    ${currentUser.role === 'coordinator' ? `
                        <button class="btn btn-sm btn-danger" onclick="deleteIncident(${incident.id})">Delete</button>
                    ` : ''}
                </td>
            `;
            incidentsTable.appendChild(row);
        });
    } catch (error) {
        showNotification('Error loading incidents', 'error');
    }
}

// Load volunteers
async function loadVolunteers() {
    try {
        const volunteers = await apiCall('/api/volunteers');
        const volunteersTable = document.getElementById('volunteersTable');
        volunteersTable.innerHTML = '';
        
        volunteers.forEach(volunteer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${volunteer.id}</td>
                <td>${volunteer.User.username}</td>
                <td>${volunteer.skills.join(', ')}</td>
                <td><span class="status-badge status-${volunteer.availability ? 'available' : 'unavailable'}">${volunteer.availability ? 'Available' : 'Unavailable'}</span></td>
                <td><span class="status-badge status-${volunteer.status}">${volunteer.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewVolunteer(${volunteer.id})">View</button>
                </td>
            `;
            volunteersTable.appendChild(row);
        });
    } catch (error) {
        showNotification('Error loading volunteers', 'error');
    }
}

// Load assignments
async function loadAssignments() {
    try {
        const assignments = await apiCall('/api/assignments');
        const assignmentsTable = document.getElementById('assignmentsTable');
        assignmentsTable.innerHTML = '';
        
        assignments.forEach(assignment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${assignment.id}</td>
                <td>${assignment.Incident.type} (ID: ${assignment.Incident.id})</td>
                <td>${assignment.Volunteer.User.username} (ID: ${assignment.Volunteer.id})</td>
                <td><span class="status-badge status-${assignment.status}">${assignment.status}</span></td>
                <td>${assignment.assigner.username}</td>
                <td>${formatDate(assignment.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="updateAssignmentStatus(${assignment.id})">Update</button>
                    ${currentUser.role === 'coordinator' ? `
                        <button class="btn btn-sm btn-danger" onclick="deleteAssignment(${assignment.id})">Delete</button>
                    ` : ''}
                </td>
            `;
            assignmentsTable.appendChild(row);
        });
    } catch (error) {
        showNotification('Error loading assignments', 'error');
    }
}

// Load profile
async function loadProfile() {
    try {
        const profile = await apiCall('/api/auth/profile');
        
        document.getElementById('profileUsername').value = profile.username;
        document.getElementById('profileEmail').value = profile.email;
        document.getElementById('profileRole').value = profile.role;
        
        if (profile.role === 'volunteer' && profile.Volunteer) {
            document.getElementById('profileSkills').value = profile.Volunteer.skills.join(', ');
            document.getElementById('profileAvailability').value = profile.Volunteer.availability.toString();
            document.getElementById('profileStatus').value = profile.Volunteer.status;
        }
    } catch (error) {
        showNotification('Error loading profile', 'error');
    }
}

// Populate assignment form
async function populateAssignmentForm() {
    try {
        const incidents = await apiCall('/api/incidents');
        const volunteers = await apiCall('/api/volunteers');
        
        const incidentSelect = document.getElementById('assignmentIncident');
        const volunteerSelect = document.getElementById('assignmentVolunteer');
        
        incidentSelect.innerHTML = '';
        volunteerSelect.innerHTML = '';
        
        incidents.forEach(incident => {
            const option = document.createElement('option');
            option.value = incident.id;
            option.textContent = `${incident.type} (ID: ${incident.id})`;
            incidentSelect.appendChild(option);
        });
        
        volunteers.forEach(volunteer => {
            if (volunteer.availability && volunteer.status === 'available') {
                const option = document.createElement('option');
                option.value = volunteer.id;
                option.textContent = `${volunteer.User.username} (Skills: ${volunteer.skills.join(', ')})`;
                volunteerSelect.appendChild(option);
            }
        });
    } catch (error) {
        showNotification('Error populating assignment form', 'error');
    }
}

// Handle login
async function handleLogin() {
    try {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!username || !password) {
            showAuthMessage('Please enter both username and password', 'error');
            return;
        }
        
        const data = await apiCall('/api/auth/login', 'POST', {
            username,
            password
        });
        
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        showDashboard();
        loadDashboardData();
    } catch (error) {
        showAuthMessage(error.message, 'error');
    }
}

// Handle register
async function handleRegister() {
    try {
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('regRole').value;
        
        if (!username || !email || !password) {
            showAuthMessage('Please fill in all fields', 'error');
            return;
        }
        
        const data = await apiCall('/api/auth/register', 'POST', {
            username,
            email,
            password,
            role
        });
        
        showAuthMessage('Registration successful. Please login.', 'success');
        switchAuthTab('login');
        
        // Clear form
        document.getElementById('regUsername').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regRole').value = 'public';
    } catch (error) {
        showAuthMessage(error.message, 'error');
    }
}

// Handle logout
function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showAuthModal();
}

// Handle incident submit
async function handleIncidentSubmit(e) {
    e.preventDefault();
    
    try {
        const type = document.getElementById('incidentType').value;
        const latitude = document.getElementById('incidentLatitude').value;
        const longitude = document.getElementById('incidentLongitude').value;
        const severity = document.getElementById('incidentSeverity').value;
        const description = document.getElementById('incidentDescription').value;
        
        await apiCall('/api/incidents', 'POST', {
            type,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            severity,
            description
        });
        
        incidentModal.style.display = 'none';
        incidentForm.reset();
        showNotification('Incident reported successfully', 'success');
        
        // Reload incidents
        loadIncidents();
        loadDashboardData();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Handle assignment submit
async function handleAssignmentSubmit(e) {
    e.preventDefault();
    
    try {
        const incident_id = parseInt(document.getElementById('assignmentIncident').value);
        const volunteer_id = parseInt(document.getElementById('assignmentVolunteer').value);
        
        await apiCall('/api/assignments', 'POST', {
            incident_id,
            volunteer_id
        });
        
        assignmentModal.style.display = 'none';
        assignmentForm.reset();
        showNotification('Assignment created successfully', 'success');
        
        // Reload assignments and dashboard
        loadAssignments();
        loadDashboardData();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Handle update assignment submit
async function handleUpdateAssignmentSubmit(e) {
    e.preventDefault();
    
    try {
        const assignmentId = updateAssignmentForm.getAttribute('data-assignment-id');
        const status = document.getElementById('updateAssignmentStatus').value;
        
        await apiCall(`/api/assignments/${assignmentId}`, 'PUT', {
            status
        });
        
        updateAssignmentModal.style.display = 'none';
        showNotification('Assignment status updated successfully', 'success');
        
        // Reload assignments and dashboard
        loadAssignments();
        loadDashboardData();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Handle profile submit
async function handleProfileSubmit(e) {
    e.preventDefault();
    
    try {
        const data = {
            skills: document.getElementById('profileSkills').value.split(',').map(s => s.trim()).filter(s => s),
            availability: document.getElementById('profileAvailability').value === 'true',
            status: document.getElementById('profileStatus').value
        };
        
        await apiCall(`/api/volunteers/${currentUser.id}`, 'PUT', data);
        
        showNotification('Profile updated successfully', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Delete incident
async function deleteIncident(id) {
    if (!confirm('Are you sure you want to delete this incident?')) {
        return;
    }
    
    try {
        await apiCall(`/api/incidents/${id}`, 'DELETE');
        showNotification('Incident deleted successfully', 'success');
        
        // Reload incidents and dashboard
        loadIncidents();
        loadDashboardData();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Delete assignment
async function deleteAssignment(id) {
    if (!confirm('Are you sure you want to delete this assignment?')) {
        return;
    }
    
    try {
        await apiCall(`/api/assignments/${id}`, 'DELETE');
        showNotification('Assignment deleted successfully', 'success');
        
        // Reload assignments and dashboard
        loadAssignments();
        loadDashboardData();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Update assignment status
function updateAssignmentStatus(id) {
    updateAssignmentForm.setAttribute('data-assignment-id', id);
    updateAssignmentModal.style.display = 'block';
}

// View volunteer
function viewVolunteer(id) {
    // This would typically open a modal with volunteer details
    // For simplicity, we'll just show a notification
    showNotification('Viewing volunteer details', 'success');
}

// API call helper function
async function apiCall(url, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (authToken) {
        options.headers.Authorization = `Bearer ${authToken}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }

    return data;
}

// Show auth message
function showAuthMessage(message, type) {
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
}

// Show notification
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}
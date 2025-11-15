
// Initialize data from localStorage or use default data
let messages = JSON.parse(localStorage.getItem('messages')) || [
    {
        id: 1,
        name: 'Ahmed Ali',
        message: 'Assalamu Alaikum! Reminder that our next study circle will be this Friday at 7 PM. Please make sure to attend.',
        date: new Date(Date.now() - 86400000).toISOString(),
        images: []
    }
];

let programs = JSON.parse(localStorage.getItem('programs')) || [
    {
        id: 1,
        title: 'Weekly Study Circle',
        date: '2024-11-10',
        description: 'Our weekly study circle focused on the teachings of the Quran. We had excellent discussions and brother Ahmed led a beautiful presentation.',
        isUpcoming: false,
        featuredImage: null,
        galleryImages: []
    },
    {
        id: 2,
        title: 'Community Service Day',
        date: '2024-11-30',
        description: 'Join us for our upcoming community service day where we\'ll be helping local families in need.',
        isUpcoming: true,
        featuredImage: null,
        galleryImages: []
    }
];

let members = JSON.parse(localStorage.getItem('members')) || [
    { id: 1, name: 'Ahmed Ali', joinDate: '2024-01-15' },
    { id: 2, name: 'Muhammad Hassan', joinDate: '2024-01-20' },
    { id: 3, name: 'Usman Khan', joinDate: '2024-02-01' }
];

let attendance = JSON.parse(localStorage.getItem('attendance')) || [
    { id: 1, programId: 1, memberId: 1, programTitle: 'Weekly Study Circle', memberName: 'Ahmed Ali', date: '2024-11-10' },
    { id: 2, programId: 1, memberId: 2, programTitle: 'Weekly Study Circle', memberName: 'Muhammad Hassan', date: '2024-11-10' }
];

// Save data to localStorage
function saveData() {
    localStorage.setItem('messages', JSON.stringify(messages));
    localStorage.setItem('programs', JSON.stringify(programs));
    localStorage.setItem('members', JSON.stringify(members));
    localStorage.setItem('attendance', JSON.stringify(attendance));
}

// Tab switching
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn, .bottom-nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            document.querySelectorAll('.tab-btn, .bottom-nav-btn').forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            document.querySelectorAll(`[data-tab="${tabName}"]`).forEach(b => b.classList.add('active'));
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

// Get initials from name
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Render Messages
function renderMessages() {
    const messagesList = document.getElementById('messagesList');
    
    if (messages.length === 0) {
        messagesList.innerHTML = `
            <div class="empty-state">
                <div class="icon">💬</div>
                <h3>No messages yet</h3>
                <p>Be the first to share a message with the community</p>
                <button class="btn btn-primary" onclick="openMessageModal()">Post First Message</button>
            </div>
        `;
        return;
    }

    messagesList.innerHTML = messages.map(msg => `
        <div class="card">
            <div class="card-header">
                <div class="avatar">${getInitials(msg.name)}</div>
                <div class="info">
                    <h3>${msg.name}</h3>
                    <div class="date">${formatDate(msg.date)}</div>
                </div>
            </div>
            <div class="card-content">
                <p>${msg.message}</p>
                ${msg.images && msg.images.length > 0 ? `
                    <div class="image-grid">
                        ${msg.images.map(img => `<img src="${img}" alt="Attachment">`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Render Programs
function renderPrograms() {
    const programsList = document.getElementById('programsList');
    
    if (programs.length === 0) {
        programsList.innerHTML = `
            <div class="empty-state">
                <div class="icon">📅</div>
                <h3>No programs yet</h3>
                <p>Start documenting your weekly programs and events</p>
                <button class="btn btn-secondary" onclick="openProgramModal()">Add First Program</button>
            </div>
        `;
        return;
    }

    // Sort programs by date (newest first)
    const sortedPrograms = [...programs].sort((a, b) => new Date(b.date) - new Date(a.date));

    programsList.innerHTML = sortedPrograms.map(prog => `
        <div class="card program-card">
            ${prog.featuredImage ? `<img src="${prog.featuredImage}" class="program-image" alt="${prog.title}">` : ''}
            <div>
                <span class="badge badge-date">${new Date(prog.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                ${prog.isUpcoming ? '<span class="badge badge-upcoming">Upcoming</span>' : ''}
            </div>
            <h3>${prog.title}</h3>
            <p>${prog.description}</p>
            ${prog.galleryImages && prog.galleryImages.length > 0 ? `
                <h4 style="margin-top: 20px; margin-bottom: 10px;">Photo Gallery</h4>
                <div class="image-grid">
                    ${prog.galleryImages.map(img => `<img src="${img}" alt="${prog.title}">`).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Render Members and Attendance
function renderMembersAndAttendance() {
    const membersList = document.getElementById('membersList');
    const totalMembersEl = document.getElementById('totalMembers');
    const totalProgramsEl = document.getElementById('totalPrograms');
    const totalAttendanceEl = document.getElementById('totalAttendance');

    // Update stats
    totalMembersEl.textContent = members.length;
    totalProgramsEl.textContent = programs.length;
    totalAttendanceEl.textContent = attendance.length;

    if (members.length === 0) {
        membersList.innerHTML = `
            <div class="empty-state">
                <div class="icon">👥</div>
                <h3>No members yet</h3>
                <p>Add members to start tracking attendance</p>
                <button class="btn btn-primary" onclick="openMemberModal()">Add First Member</button>
            </div>
        `;
        return;
    }

    membersList.innerHTML = members.map(member => {
        const memberAttendance = attendance.filter(a => a.memberId === member.id).length;
        const totalPrograms = programs.filter(p => !p.isUpcoming).length;
        const attendanceRate = totalPrograms > 0 ? Math.round((memberAttendance / totalPrograms) * 100) : 0;

        return `
            <div class="member-card">
                <div class="member-header">
                    <div class="avatar">${getInitials(member.name)}</div>
                    <div class="member-info">
                        <h4>${member.name}</h4>
                        <div class="join-date">Joined ${member.joinDate}</div>
                    </div>
                </div>
                <div class="attendance-stat">
                    <span style="color: var(--text-light); font-size: 14px;">Attendance</span>
                    <span class="badge badge-date">${memberAttendance}/${totalPrograms} (${attendanceRate}%)</span>
                </div>
            </div>
        `;
    }).join('');
}

// Modal functions
function openMessageModal() {
    document.getElementById('messageModal').style.display = 'block';
}

function closeMessageModal() {
    document.getElementById('messageModal').style.display = 'none';
    document.getElementById('messageForm').reset();
}

function openProgramModal() {
    document.getElementById('programModal').style.display = 'block';
}

function closeProgramModal() {
    document.getElementById('programModal').style.display = 'none';
    document.getElementById('programForm').reset();
}

function openMemberModal() {
    document.getElementById('memberModal').style.display = 'block';
}

function closeMemberModal() {
    document.getElementById('memberModal').style.display = 'none';
    document.getElementById('memberForm').reset();
}

function openAttendanceModal() {
    const programSelect = document.getElementById('attendanceProgram');
    const memberCheckboxes = document.getElementById('memberCheckboxes');

    // Populate program dropdown
    programSelect.innerHTML = '<option value="">Choose a program</option>' + 
        programs.map(p => `<option value="${p.id}">${p.title} - ${p.date}</option>`).join('');

    // Populate member checkboxes
    memberCheckboxes.innerHTML = members.map(m => `
        <div class="checkbox-item">
            <input type="checkbox" id="member-${m.id}" value="${m.id}">
            <label for="member-${m.id}">${m.name}</label>
        </div>
    `).join('');

    document.getElementById('attendanceModal').style.display = 'block';
}

function closeAttendanceModal() {
    document.getElementById('attendanceModal').style.display = 'none';
    document.getElementById('attendanceForm').reset();
}

// Handle image file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Submit Message
async function submitMessage(e) {
    e.preventDefault();

    const name = document.getElementById('messageName').value;
    const message = document.getElementById('messageText').value;
    const imageFiles = document.getElementById('messageImages').files;

    const images = [];
    for (let file of imageFiles) {
        const base64 = await fileToBase64(file);
        images.push(base64);
    }

    const newMessage = {
        id: Date.now(),
        name,
        message,
        date: new Date().toISOString(),
        images
    };

    messages.unshift(newMessage);
    saveData();
    renderMessages();
    closeMessageModal();
}

// Submit Program
async function submitProgram(e) {
    e.preventDefault();

    const title = document.getElementById('programTitle').value;
    const date = document.getElementById('programDate').value;
    const description = document.getElementById('programDesc').value;
    const imageFile = document.getElementById('programImage').files[0];
    const galleryFiles = document.getElementById('programGallery').files;

    const today = new Date();
    const programDate = new Date(date);
    const isUpcoming = programDate >= today;

    let featuredImage = null;
    if (imageFile) {
        featuredImage = await fileToBase64(imageFile);
    }

    const galleryImages = [];
    for (let file of galleryFiles) {
        const base64 = await fileToBase64(file);
        galleryImages.push(base64);
    }

    const newProgram = {
        id: Date.now(),
        title,
        date,
        description,
        isUpcoming,
        featuredImage,
        galleryImages
    };

    programs.push(newProgram);
    saveData();
    renderPrograms();
    renderMembersAndAttendance(); // Update program count
    closeProgramModal();
}

// Submit Member
function submitMember(e) {
    e.preventDefault();

    const name = document.getElementById('memberName').value;

    const newMember = {
        id: Date.now(),
        name,
        joinDate: new Date().toISOString().split('T')[0]
    };

    members.push(newMember);
    saveData();
    renderMembersAndAttendance();
    closeMemberModal();
}

// Submit Attendance
function submitAttendance(e) {
    e.preventDefault();

    const programId = parseInt(document.getElementById('attendanceProgram').value);
    const checkboxes = document.querySelectorAll('#memberCheckboxes input[type="checkbox"]:checked');

    if (!programId || checkboxes.length === 0) {
        alert('Please select a program and at least one member');
        return;
    }

    const program = programs.find(p => p.id === programId);
    
    checkboxes.forEach(checkbox => {
        const memberId = parseInt(checkbox.value);
        const member = members.find(m => m.id === memberId);
        
        // Check if attendance already exists
        const existingAttendance = attendance.find(
            a => a.programId === programId && a.memberId === memberId
        );

        if (!existingAttendance) {
            attendance.push({
                id: Date.now() + Math.random(),
                programId,
                memberId,
                programTitle: program.title,
                memberName: member.name,
                date: program.date
            });
        }
    });

    saveData();
    renderMembersAndAttendance();
    closeAttendanceModal();
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    renderMessages();
    renderPrograms();
    renderMembersAndAttendance();
});

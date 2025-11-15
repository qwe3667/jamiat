// =====================
// Firebase Initialization
// =====================
const firebaseConfig = {
    apiKey: "AIzaSyBbtDb7EIOmaP7ytK3IVGqFcyLJwKPfSnc",
    authDomain: "jamiat-7dbdb.firebaseapp.com",
    projectId: "jamiat-7dbdb",
    storageBucket: "jamiat-7dbdb.appspot.com",
    messagingSenderId: "568010033874",
    appId: "1:568010033874:web:4af8a3b81634dca4e53b0b",
    measurementId: "G-84DJH4HE48"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// =====================
// LocalStorage fallback
// =====================
let messages = JSON.parse(localStorage.getItem('messages')) || [];
let programs = JSON.parse(localStorage.getItem('programs')) || [];
let members = JSON.parse(localStorage.getItem('members')) || [];
let attendance = JSON.parse(localStorage.getItem('attendance')) || [];

// =====================
// Helper Functions
// =====================
function saveData() {
    localStorage.setItem('messages', JSON.stringify(messages));
    localStorage.setItem('programs', JSON.stringify(programs));
    localStorage.setItem('members', JSON.stringify(members));
    localStorage.setItem('attendance', JSON.stringify(attendance));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// =====================
// Firestore Sync Functions
// =====================

// Fetch data from Firestore
async function fetchFirestoreData() {
    const collections = ['messages', 'programs', 'members', 'attendance'];

    for (let col of collections) {
        const snapshot = await db.collection(col).get();
        const data = snapshot.docs.map(doc => doc.data());
        if (col === 'messages') messages = data;
        if (col === 'programs') programs = data;
        if (col === 'members') members = data;
        if (col === 'attendance') attendance = data;
    }

    saveData();
    renderMessages();
    renderPrograms();
    renderMembersAndAttendance();
}

// Add document to Firestore
function addToFirestore(collection, data) {
    db.collection(collection).doc(data.id.toString()).set(data);
}

// =====================
// Render Functions
// =====================
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

function renderMembersAndAttendance() {
    const membersList = document.getElementById('membersList');
    const totalMembersEl = document.getElementById('totalMembers');
    const totalProgramsEl = document.getElementById('totalPrograms');
    const totalAttendanceEl = document.getElementById('totalAttendance');

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
        const totalProgramsCount = programs.filter(p => !p.isUpcoming).length;
        const attendanceRate = totalProgramsCount > 0 ? Math.round((memberAttendance / totalProgramsCount) * 100) : 0;

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
                    <span class="badge badge-date">${memberAttendance}/${totalProgramsCount} (${attendanceRate}%)</span>
                </div>
            </div>
        `;
    }).join('');
}

// =====================
// Tabs & Modals
// =====================
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn, .bottom-nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            document.querySelectorAll(`[data-tab="${tabName}"]`).forEach(b => b.classList.add('active'));
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// =====================
// Submit Handlers (Modified to save Firestore)
// =====================
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

    const newMessage = { id: Date.now(), name, message, date: new Date().toISOString(), images };
    messages.unshift(newMessage);
    saveData();
    addToFirestore('messages', newMessage);
    renderMessages();
    closeMessageModal();
}

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
    if (imageFile) featuredImage = await fileToBase64(imageFile);

    const galleryImages = [];
    for (let file of galleryFiles) galleryImages.push(await fileToBase64(file));

    const newProgram = { id: Date.now(), title, date, description, isUpcoming, featuredImage, galleryImages };
    programs.push(newProgram);
    saveData();
    addToFirestore('programs', newProgram);
    renderPrograms();
    renderMembersAndAttendance();
    closeProgramModal();
}

function submitMember(e) {
    e.preventDefault();
    const name = document.getElementById('memberName').value;
    const newMember = { id: Date.now(), name, joinDate: new Date().toISOString().split('T')[0] };
    members.push(newMember);
    saveData();
    addToFirestore('members', newMember);
    renderMembersAndAttendance();
    closeMemberModal();
}

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

        const existingAttendance = attendance.find(a => a.programId === programId && a.memberId === memberId);
        if (!existingAttendance) {
            const newAttendance = { id: Date.now() + Math.random(), programId, memberId, programTitle: program.title, memberName: member.name, date: program.date };
            attendance.push(newAttendance);
            addToFirestore('attendance', newAttendance);
        }
    });

    saveData();
    renderMembersAndAttendance();
    closeAttendanceModal();
}

// =====================
// Click outside modals to close
// =====================
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target == modal) modal.style.display = 'none';
    });
}

// =====================
// Initialize App
// =====================
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    fetchFirestoreData(); // fetch from Firestore instead of only localStorage
});

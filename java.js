// java.js (module - requires <script type="module" src="java.js"></script> in HTML)

// Firebase imports (CDN module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ---- Your firebaseConfig (you already provided this) ----
const firebaseConfig = {
  apiKey: "AIzaSyBbtDb7EIOmaP7ytK3IVGqFcyLJwKPfSnc",
  authDomain: "jamiat-7dbdb.firebaseapp.com",
  projectId: "jamiat-7dbdb",
  storageBucket: "jamiat-7dbdb.firebasestorage.app",
  messagingSenderId: "568010033874",
  appId: "1:568010033874:web:4af8a3b81634dca4e53b0b",
  measurementId: "G-84DJH4HE48"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch (e) { /* analytics may fail on localhost */ }
const db = getFirestore(app);

// Firestore collections
const messagesCol = collection(db, 'messages');
const programsCol = collection(db, 'programs');
const membersCol = collection(db, 'members');
const attendanceCol = collection(db, 'attendance');

// In-memory arrays (kept in sync by real-time listeners)
let messages = [];
let programs = [];
let members = [];
let attendance = [];

// ------------------ Helpers ------------------
function formatDate(dateLike) {
  if (!dateLike) return '';
  // Firestore timestamp object -> has toDate()
  if (typeof dateLike === 'object' && typeof dateLike.toDate === 'function') {
    return new Date(dateLike.toDate()).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  // ISO string
  const d = new Date(dateLike);
  if (!isNaN(d)) {
    return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  // fallback
  return String(dateLike);
}

function getInitials(name) {
  return name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = err => reject(err);
  });
}

// ------------------ Render functions (adapted) ------------------
function renderMessages() {
  const messagesList = document.getElementById('messagesList');
  if (!messagesList) return;

  if (messages.length === 0) {
    messagesList.innerHTML = `
      <div class="empty-state">
        <div class="icon">💬</div>
        <h3>No messages yet</h3>
        <p>Be the first to share a message with the community</p>
        <button class="btn btn-primary" onclick="openMessageModal()">Post First Message</button>
      </div>`;
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
          </div>` : ''}
      </div>
    </div>
  `).join('');
}

function renderPrograms() {
  const programsList = document.getElementById('programsList');
  if (!programsList) return;

  if (programs.length === 0) {
    programsList.innerHTML = `
      <div class="empty-state">
        <div class="icon">📅</div>
        <h3>No programs yet</h3>
        <p>Start documenting your weekly programs and events</p>
        <button class="btn btn-secondary" onclick="openProgramModal()">Add First Program</button>
      </div>`;
    return;
  }

  // Sort programs by date (newest first). Program.date might be a string or timestamp
  const sorted = [...programs].sort((a,b) => {
    const da = a.date && a.date.toDate ? a.date.toDate() : new Date(a.date);
    const db = b.date && b.date.toDate ? b.date.toDate() : new Date(b.date);
    return db - da;
  });

  programsList.innerHTML = sorted.map(prog => `
    <div class="card program-card">
      ${prog.featuredImage ? `<img src="${prog.featuredImage}" class="program-image" alt="${prog.title}">` : ''}
      <div>
        <span class="badge badge-date">${(prog.date && prog.date.toDate) ? new Date(prog.date.toDate()).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric'}) : new Date(prog.date).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric'})}</span>
        ${prog.isUpcoming ? '<span class="badge badge-upcoming">Upcoming</span>' : ''}
      </div>
      <h3>${prog.title}</h3>
      <p>${prog.description}</p>
      ${prog.galleryImages && prog.galleryImages.length > 0 ? `
        <h4 style="margin-top:20px;margin-bottom:10px;">Photo Gallery</h4>
        <div class="image-grid">
          ${prog.galleryImages.map(img => `<img src="${img}" alt="${prog.title}">`).join('')}
        </div>` : ''}
    </div>
  `).join('');
}

function renderMembersAndAttendance() {
  const membersList = document.getElementById('membersList');
  const totalMembersEl = document.getElementById('totalMembers');
  const totalProgramsEl = document.getElementById('totalPrograms');
  const totalAttendanceEl = document.getElementById('totalAttendance');
  if (!membersList || !totalMembersEl) return;

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
      </div>`;
    return;
  }

  membersList.innerHTML = members.map(member => {
    const memberAttendance = attendance.filter(a => a.memberId === member.id).length;
    const totalProgramsDone = programs.filter(p => !p.isUpcoming).length;
    const attendanceRate = totalProgramsDone > 0 ? Math.round((memberAttendance / totalProgramsDone) * 100) : 0;
    return `
      <div class="member-card">
        <div class="member-header">
          <div class="avatar">${getInitials(member.name)}</div>
          <div class="member-info">
            <h4>${member.name}</h4>
            <div class="join-date">Joined ${member.joinDate || '—'}</div>
          </div>
        </div>
        <div class="attendance-stat">
          <span style="color: var(--text-light); font-size: 14px;">Attendance</span>
          <span class="badge badge-date">${memberAttendance}/${totalProgramsDone} (${attendanceRate}%)</span>
        </div>
      </div>
    `;
  }).join('');
}

// ------------------ Modal functions (same as before) ------------------
function openMessageModal() { document.getElementById('messageModal').style.display = 'block'; }
function closeMessageModal() { document.getElementById('messageModal').style.display = 'none'; document.getElementById('messageForm').reset(); }
function openProgramModal() { document.getElementById('programModal').style.display = 'block'; }
function closeProgramModal() { document.getElementById('programModal').style.display = 'none'; document.getElementById('programForm').reset(); }
function openMemberModal() { document.getElementById('memberModal').style.display = 'block'; }
function closeMemberModal() { document.getElementById('memberModal').style.display = 'none'; document.getElementById('memberForm').reset(); }

function openAttendanceModal() {
  const programSelect = document.getElementById('attendanceProgram');
  const memberCheckboxes = document.getElementById('memberCheckboxes');

  programSelect.innerHTML = '<option value="">Choose a program</option>' +
    programs.map(p => `<option value="${p.id}">${p.title} - ${ (p.date && p.date.toDate) ? new Date(p.date.toDate()).toLocaleDateString() : p.date }</option>`).join('');

  memberCheckboxes.innerHTML = members.map(m => `
    <div class="checkbox-item">
      <input type="checkbox" id="member-${m.id}" value="${m.id}">
      <label for="member-${m.id}">${m.name}</label>
    </div>
  `).join('');

  document.getElementById('attendanceModal').style.display = 'block';
}
function closeAttendanceModal() { document.getElementById('attendanceModal').style.display = 'none'; document.getElementById('attendanceForm').reset(); }

// Close modals when clicking outside
window.onclick = function(event) {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  });
};

// ------------------ Firestore Writes ------------------
async function submitMessage(e) {
  e.preventDefault();
  const name = document.getElementById('messageName').value.trim();
  const messageText = document.getElementById('messageText').value.trim();
  const imageFiles = document.getElementById('messageImages').files;

  const images = [];
  for (let file of imageFiles) {
    const base64 = await fileToBase64(file);
    images.push(base64);
  }

  // write to Firestore
  try {
    await addDoc(messagesCol, {
      name,
      message: messageText,
      images,
      date: serverTimestamp()
    });
    // UI reset handled by onSnapshot listener
    closeMessageModal();
  } catch (err) {
    console.error('Error saving message:', err);
    alert('Failed to save message. Check console.');
  }
}

async function submitProgram(e) {
  e.preventDefault();
  const title = document.getElementById('programTitle').value.trim();
  const date = document.getElementById('programDate').value;
  const description = document.getElementById('programDesc').value.trim();
  const imageFile = document.getElementById('programImage').files[0];
  const galleryFiles = document.getElementById('programGallery').files;

  const featuredImage = imageFile ? await fileToBase64(imageFile) : null;
  const galleryImages = [];
  for (let f of galleryFiles) {
    galleryImages.push(await fileToBase64(f));
  }

  const isUpcoming = new Date(date) >= new Date();

  try {
    await addDoc(programsCol, {
      title,
      date,               // keep human-readable date string for display & attendance
      description,
      isUpcoming,
      featuredImage,
      galleryImages,
      createdAt: serverTimestamp()
    });
    closeProgramModal();
  } catch (err) {
    console.error('Error adding program:', err);
    alert('Failed to add program.');
  }
}

async function submitMember(e) {
  e.preventDefault();
  const name = document.getElementById('memberName').value.trim();
  const joinDate = new Date().toISOString().split('T')[0];

  try {
    await addDoc(membersCol, {
      name,
      joinDate,
      createdAt: serverTimestamp()
    });
    closeMemberModal();
  } catch (err) {
    console.error('Error adding member:', err);
    alert('Failed to add member.');
  }
}

async function submitAttendance(e) {
  e.preventDefault();
  const programId = document.getElementById('attendanceProgram').value;
  const checkboxes = document.querySelectorAll('#memberCheckboxes input[type="checkbox"]:checked');

  if (!programId || checkboxes.length === 0) {
    alert('Please select a program and at least one member');
    return;
  }

  // get selected program doc locally
  const program = programs.find(p => p.id === programId);
  if (!program) {
    alert('Selected program not found (try refreshing).');
    return;
  }

  try {
    // create a separate attendance doc per member
    for (let cb of checkboxes) {
      const memberId = cb.value;
      const member = members.find(m => m.id === memberId);
      // check existing attendance locally
      const exists = attendance.some(a => a.programId === programId && a.memberId === memberId);
      if (!exists) {
        await addDoc(attendanceCol, {
          programId,
          memberId,
          programTitle: program.title,
          memberName: member ? member.name : 'Unknown',
          date: program.date || null,
          createdAt: serverTimestamp()
        });
      }
    }
    closeAttendanceModal();
  } catch (err) {
    console.error('Error recording attendance:', err);
    alert('Failed to record attendance.');
  }
}

// ------------------ Real-time listeners ------------------
// Messages: newest first by timestamp
onSnapshot(query(messagesCol, orderBy('date', 'desc')), snapshot => {
  messages = snapshot.docs.map(d => {
    return { ...d.data(), id: d.id };
  });
  renderMessages();
});

// Programs: order by createdAt desc (or date)
onSnapshot(query(programsCol, orderBy('createdAt', 'desc')), snapshot => {
  programs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  renderPrograms();
  renderMembersAndAttendance(); // update counts dependent on programs
});

// Members: newest first
onSnapshot(query(membersCol, orderBy('createdAt', 'desc')), snapshot => {
  members = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  renderMembersAndAttendance();
});

// Attendance: newest first
onSnapshot(query(attendanceCol, orderBy('createdAt', 'desc')), snapshot => {
  attendance = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  renderMembersAndAttendance();
});

// ------------------ Tabs initialization (same as original) ------------------
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn, .bottom-nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-btn, .bottom-nav-btn').forEach(b => b.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      document.querySelectorAll(`[data-tab="${tabName}"]`).forEach(b => b.classList.add('active'));
      document.getElementById(tabName).classList.add('active');
    });
  });
}

// ------------------ Form bindings & init ------------------
document.addEventListener('DOMContentLoaded', () => {
  initTabs();

  // attach form handlers (forms already exist in HTML)
  document.getElementById('messageForm').addEventListener('submit', submitMessage);
  document.getElementById('programForm').addEventListener('submit', submitProgram);
  document.getElementById('memberForm').addEventListener('submit', submitMember);
  document.getElementById('attendanceForm').addEventListener('submit', submitAttendance);

  // initial empty renders (will be replaced by onSnapshot updates)
  renderMessages();
  renderPrograms();
  renderMembersAndAttendance();
});

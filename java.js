// -------------------------------
// 🔥 Firebase Setup
// -------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBbtDb7EIOmaP7ytK3IVGqFcyLJwKPfSnc",
    authDomain: "jamiat-7dbdb.firebaseapp.com",
    projectId: "jamiat-7dbdb",
    storageBucket: "jamiat-7dbdb.firebasestorage.app",
    messagingSenderId: "568010033874",
    appId: "1:568010033874:web:4af8a3b81634dca4e53b0b",
    measurementId: "G-84DJH4HE48"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// --------------------------------------------------
// 🔥 REALTIME LOADERS (Messages, Programs, Members)
// --------------------------------------------------

let messages = [];
let programs = [];
let members = [];
let attendanceRecords = [];

// ---- Load Messages ----
onSnapshot(query(collection(db, "messages"), orderBy("date", "desc")), (snapshot) => {
    messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderMessages();
});

// ---- Load Programs ----
onSnapshot(query(collection(db, "programs"), orderBy("date", "desc")), (snapshot) => {
    programs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderPrograms();
    fillAttendanceProgramDropdown();
});

// ---- Load Members ----
onSnapshot(collection(db, "members"), (snapshot) => {
    members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderMembers();
    fillMemberCheckboxes();
});

// ---- Load Attendance ----
onSnapshot(collection(db, "attendance"), (snapshot) => {
    attendanceRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    document.getElementById("totalAttendance").innerText = attendanceRecords.length;
});

// --------------------------------------------------
// 🔥 IMAGE UPLOADER (common function)
// --------------------------------------------------
async function uploadImage(file, folder) {
    const imageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
}

// --------------------------------------------------
// 🟦 POST MESSAGE
// --------------------------------------------------
async function submitMessage(e) {
    e.preventDefault();

    const name = document.getElementById("messageName").value;
    const messageText = document.getElementById("messageText").value;
    const images = document.getElementById("messageImages").files;

    let imageURLs = [];

    for (let img of images) {
        const url = await uploadImage(img, "messageImages");
        imageURLs.push(url);
    }

    await addDoc(collection(db, "messages"), {
        name,
        message: messageText,
        images: imageURLs,
        date: Date.now()
    });

    closeMessageModal();
}

// --------------------------------------------------
// 🟩 ADD PROGRAM
// --------------------------------------------------
async function submitProgram(e) {
    e.preventDefault();

    const title = document.getElementById("programTitle").value;
    const date = document.getElementById("programDate").value;
    const desc = document.getElementById("programDesc").value;

    const featureImg = document.getElementById("programImage").files[0];
    const galleryImgs = document.getElementById("programGallery").files;

    let featureURL = "";
    let galleryURLs = [];

    if (featureImg) featureURL = await uploadImage(featureImg, "programFeatured");

    for (let img of galleryImgs) {
        const url = await uploadImage(img, "programGallery");
        galleryURLs.push(url);
    }

    await addDoc(collection(db, "programs"), {
        title,
        date,
        desc,
        featureImg: featureURL,
        gallery: galleryURLs
    });

    closeProgramModal();
}

// --------------------------------------------------
// 🟨 ADD MEMBER
// --------------------------------------------------
async function submitMember(e) {
    e.preventDefault();

    const name = document.getElementById("memberName").value;

    await addDoc(collection(db, "members"), {
        name
    });

    closeMemberModal();
}

// --------------------------------------------------
// 🟥 RECORD ATTENDANCE
// --------------------------------------------------
async function submitAttendance(e) {
    e.preventDefault();

    const programId = document.getElementById("attendanceProgram").value;
    const checkboxes = document.querySelectorAll(".member-check");
    let attended = [];

    checkboxes.forEach(c => {
        if (c.checked) attended.push(c.value);
    });

    await addDoc(collection(db, "attendance"), {
        programId,
        members: attended,
        date: Date.now()
    });

    closeAttendanceModal();
}

// --------------------------------------------------
// 🔵 Render Functions (UI unchanged)
// --------------------------------------------------

function renderMessages() {
    const list = document.getElementById("messagesList");
    list.innerHTML = "";

    messages.forEach(msg => {
        let html = `
            <div class="message-card">
                <h3>${msg.name}</h3>
                <p>${msg.message}</p>
        `;
        if (msg.images?.length) {
            html += `<div class="msg-imgs">`;
            msg.images.forEach(img => {
                html += `<img src="${img}" class="msg-img">`;
            });
            html += `</div>`;
        }
        html += `</div>`;
        list.innerHTML += html;
    });
}

function renderPrograms() {
    const list = document.getElementById("programsList");
    list.innerHTML = "";

    programs.forEach(p => {
        list.innerHTML += `
            <div class="program-card">
                <h3>${p.title}</h3>
                <p>${p.date}</p>
                <p>${p.desc}</p>
            </div>
        `;
    });

    document.getElementById("totalPrograms").innerText = programs.length;
}

function renderMembers() {
    const list = document.getElementById("membersList");
    list.innerHTML = "";

    members.forEach(m => {
        list.innerHTML += `
            <div class="member-card">${m.name}</div>
        `;
    });

    document.getElementById("totalMembers").innerText = members.length;
}

function fillAttendanceProgramDropdown() {
    const dropdown = document.getElementById("attendanceProgram");
    dropdown.innerHTML = "";

    programs.forEach(p => {
        dropdown.innerHTML += `<option value="${p.id}">${p.title}</option>`;
    });
}

function fillMemberCheckboxes() {
    const box = document.getElementById("memberCheckboxes");
    box.innerHTML = "";

    members.forEach(m => {
        box.innerHTML += `
            <label><input type="checkbox" class="member-check" value="${m.id}"> ${m.name}</label>
        `;
    });
}

// --------------------------------------------------
// Tab switching (same as your original code)
// --------------------------------------------------
const tabBtns = document.querySelectorAll(".tab-btn");
const tabs = document.querySelectorAll(".tab-content");

tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".tab-btn.active").classList.remove("active");
        btn.classList.add("active");

        document.querySelector(".tab-content.active").classList.remove("active");
        document.getElementById(btn.dataset.tab).classList.add("active");
    });
});

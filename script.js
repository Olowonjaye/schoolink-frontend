const API_BASE = 'https://schoolink-api.up.railway.app'; // ✅ Use your real URL

// ⚙️ API helper for all backend calls
async function apiRequest(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (!res.ok) {
      let msg = `Error ${res.status}`;
      const contentType = res.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        const errorBody = await res.json();
        msg = errorBody.message || JSON.stringify(errorBody);
      }
      throw new Error(msg);
    }
    return await res.json();
  } catch (err) {
    console.error('API error:', err);
    alert(`❌ ${err.message}`);
    throw err;
  }
}


// Produce report trait rows (unchanged)
function generateTraitRows(traits) {
  return traits.map(t => `<tr><td>${t}</td><td>___</td></tr>`).join('');
}

// ============================================
// 🌐 ROLE‑BASED LOGIN CONTROL (unchanged)
// ============================================

let currentUser = null;

function showLogin(role) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('login-forms').style.display = 'block';
  document.getElementById('login-title').textContent = `${role.toUpperCase()} LOGIN`;
  document.getElementById('loginForm').dataset.role = role;
}

function backToMain() {
  document.getElementById('login-screen').style.display = 'block';
  document.getElementById('login-forms').style.display = 'none';
}

document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const role = this.dataset.role;
  currentUser = {
    username: document.getElementById('username').value,
    role: role
  };
    loadDashboard(role);
});

function showResultsViewer() {
  showParentReport();
}

// ============================================
// 🧭 SIDEBAR MENU (PER ROLE) – unchanged
// ============================================

function loadDashboard(role) {
  document.getElementById('login-forms').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';
  document.getElementById('notification-panel').style.display =
    role === 'parent' || role === 'admin' ? 'block' : 'none';

  const menu = document.getElementById('sidebar-menu');
  menu.innerHTML = '';

  const sections = {
    teacher: [
      { label: '📋 Mark Attendance', action: showAttendanceForm },
      { label: '📝 Enter Results', action: showResultsForm },
      { label: '📄 Generate Report Card', action: generateReportCard }
    ],
    parent: [
      { label: '📊 View Results', action: showResultsViewer },
      { label: '📆 Attendance Progress', action: showAttendanceViewer },
      { label: '💳 Fees Status', action: showFeesStatus }
    ],
    admin: [
      { label: '👨‍🎓 Student Management', action: showStudentManagement },
      { label: '📋 Mark Attendance', action: showAttendanceForm },
      { label: '📝 Enter Results', action: showResultsForm },
      { label: '📄 Generate Report Card', action: generateReportCard },
      { label: '📊 View Results', action: showResultsViewer },
      { label: '📆 Attendance Progress', action: showAttendanceViewer },
      { label: '💳 Fees Status', action: showFeesStatus },
      { label: '📤 Messages', action: showMessagesAdmin }
    ]
  };

  sections[role].forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.label;
    li.onclick = item.action;
    menu.appendChild(li);
  });
}

// ============================================
// 📋 STUDENTS MANAGEMENT (Backend‑Ready)
// ============================================

async function showStudentManagement() {
  document.getElementById('dynamic-content').innerHTML = `
    <h3>👨‍🎓 Student Registration</h3>
    <form id="studentRegForm">
      <label>Full Name: <input type="text" id="studentName" required /></label>
      <label>Gender:
        <select id="studentGender" required>
          <option value="">Select</option><option>Male</option><option>Female</option>
        </select>
      </label>
      <label>Class:
        <select id="studentClass" required>
          <option>KG1</option><option>KG2</option>
          <option>Primary 1</option><option>Primary 2</option><option>Primary 3</option>
          <option>Primary 4</option><option>Primary 5</option>
          <option>JSS1</option><option>JSS2</option><option>JSS3</option>
          <option>SSS1</option><option>SSS2</option><option>SSS3</option>
        </select>
      </label>
      <label>State of Origin: <input type="text" id="studentState" required /></label>
      <label>LGA of Origin: <input type="text" id="studentLGA" required /></label>
      <label>Student Address: <input type="text" id="studentAddress" required /></label>
      <h4>👪 Parent Information</h4>
      <label>Parent Name: <input type="text" id="parentName" required /></label>
      <label>Parent Address: <input type="text" id="parentAddress" required /></label>
      <label>Occupation: <input type="text" id="parentOccupation" required /></label>
      <label>Parent State: <input type="text" id="parentState" required /></label>
      <label>Parent LGA: <input type="text" id="parentLGA" required /></label>
      <label>Phone: <input type="text" id="parentPhone" required /></label>
      <label>Email: <input type="email" id="parentEmail" required /></label>
      <button type="submit">Register Student</button>
    </form>
    <hr style="margin:2rem 0;" />
    <h3>⬆️⬇️ Bulk Import/Export Students</h3>
    <input type="file" id="csvUpload" accept=".csv" />
    <button onclick="importStudentsFromCSV()">⬆️ Import CSV</button>
    <button onclick="exportStudentsToCSV()">⬇️ Export to CSV</button>
    <h3 style="margin-top:2rem;">📋 Registered Students</h3>
    <div id="studentTable"></div>
  `;

  document.getElementById('studentRegForm').addEventListener('submit', saveStudentRecord);
  await loadStudentTable(); // Fetch and display from backend
}

async function saveStudentRecord(e) {
  e.preventDefault();

  const student = {
    name: document.getElementById('studentName').value.trim(),
    gender: document.getElementById('studentGender').value,
    class: document.getElementById('studentClass').value,
    state: document.getElementById('studentState').value.trim(),
    lga: document.getElementById('studentLGA').value.trim(),
    address: document.getElementById('studentAddress').value.trim(),
    admissionNo: generateAdmissionNumber(document.getElementById('studentClass').value),
    parent: {
      name: document.getElementById('parentName').value.trim(),
      address: document.getElementById('parentAddress').value.trim(),
      occupation: document.getElementById('parentOccupation').value.trim(),
      state: document.getElementById('parentState').value.trim(),
      lga: document.getElementById('parentLGA').value.trim(),
      phone: document.getElementById('parentPhone').value.trim(),
      email: document.getElementById('parentEmail').value.trim()
    }
  };

  try {
    const saved = await apiRequest('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });
    alert(`✅ Student registered: ${saved.name}`);
    await showStudentManagement();  // Refresh view and table
  } catch {
    // Any error is handled inside apiRequest()
  }
}

// ============================================
// 📋 LOAD STUDENTS FROM BACKEND AND DISPLAY
// ============================================

async function loadStudentTable() {
  try {
    const records = await apiRequest('/api/students');

    if (!records.length) {
      document.getElementById('studentTable').innerHTML = `<p>No student registered yet.</p>`;
      return;
    }

    const table = `
      <table border="1" width="100%" cellpadding="8">
        <thead>
          <tr>
            <th>Name</th><th>Gender</th><th>Class</th><th>Admission No</th>
            <th>State</th><th>LGA</th><th>Address</th>
            <th>Parent Name</th><th>Address</th><th>Occupation</th>
            <th>State</th><th>LGA</th>
            <th>Phone</th><th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(s => `
            <tr>
              <td>${s.name}</td>
              <td>${s.gender}</td>
              <td>${s.class}</td>
              <td>${s.admissionNo}</td>
              <td>${s.state}</td>
              <td>${s.lga}</td>
              <td>${s.address}</td>
              <td>${s.parent?.name || ''}</td>
              <td>${s.parent?.address || ''}</td>
              <td>${s.parent?.occupation || ''}</td>
              <td>${s.parent?.state || ''}</td>
              <td>${s.parent?.lga || ''}</td>
              <td>${s.parent?.phone || ''}</td>
              <td>${s.parent?.email || ''}</td>
              <td>
                <button onclick="editStudent('${s._id}')">✏️</button>
                <button onclick="deleteStudent('${s._id}')">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    document.getElementById('studentTable').innerHTML = table;
  } catch {
    // Errors are already handled inside apiRequest()
  }
}

// ============================================
// 📋 EDIT AND DELETE LOGIC (Backend Version)
// ============================================

async function deleteStudent(id) {
  if (!confirm("Are you sure you want to delete this student?")) return;

  try {
    await apiRequest(`/api/students/${id}`, 'DELETE');
    alert('✅ Student deleted.');
    await loadStudentTable(); // Refresh the table
  } catch {
    // Errors are already handled in apiRequest
  }
}

async function editStudent(id) {
  try {
    const student = await apiRequest(`/api/students/${id}`);
    if (!student) return alert("Student not found");

    // Fill the form with existing student data
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentGender').value = student.gender;
    document.getElementById('studentClass').value = student.class;
    document.getElementById('studentState').value = student.state;
    document.getElementById('studentLGA').value = student.lga;
    document.getElementById('studentAddress').value = student.address;

    document.getElementById('parentName').value = student.parent?.name || '';
    document.getElementById('parentAddress').value = student.parent?.address || '';
    document.getElementById('parentOccupation').value = student.parent?.occupation || '';
    document.getElementById('parentState').value = student.parent?.state || '';
    document.getElementById('parentLGA').value = student.parent?.lga || '';
    document.getElementById('parentPhone').value = student.parent?.phone || '';
    document.getElementById('parentEmail').value = student.parent?.email || '';

    // Remove old submit event and attach a new one for update
    const oldForm = document.getElementById('studentRegForm');
    const newForm = oldForm.cloneNode(true);
    oldForm.replaceWith(newForm);

    newForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const updatedStudent = {
        name: document.getElementById('studentName').value.trim(),
        gender: document.getElementById('studentGender').value,
        class: document.getElementById('studentClass').value,
        state: document.getElementById('studentState').value.trim(),
        lga: document.getElementById('studentLGA').value.trim(),
        address: document.getElementById('studentAddress').value.trim(),
        parent: {
          name: document.getElementById('parentName').value.trim(),
          address: document.getElementById('parentAddress').value.trim(),
          occupation: document.getElementById('parentOccupation').value.trim(),
          state: document.getElementById('parentState').value.trim(),
          lga: document.getElementById('parentLGA').value.trim(),
          phone: document.getElementById('parentPhone').value.trim(),
          email: document.getElementById('parentEmail').value.trim()
        }
      };

      try {
        await apiRequest(`/api/students/${id}`, 'PUT', updatedStudent);
        alert('✅ Student updated successfully.');
        showStudentManagement();
      } catch {
        // Handled by apiRequest
      }
    });

  } catch {
    // Error already handled in apiRequest
  }
}

// ============================================
// 📋 WEEKLY & DAILY ATTENDANCE MARKING (Backend Version)
// ============================================

async function showAttendanceForm() {
  const students = await apiRequest('/api/students');
  const classes = [...new Set(students.map(s => s.class))];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  document.getElementById('dynamic-content').innerHTML = `
    <h3>📋 Attendance (Mon–Fri)</h3>
    <form id="attendanceHeaderForm">
      <label>📅 Term:
        <select id="attendanceTerm" required>
          <option value="">-- Select Term --</option>
          <option>First Term</option>
          <option>Second Term</option>
          <option>Third Term</option>
        </select>
      </label>
      <label>📆 Week:
        <select id="attendanceWeek" required>
          <option value="">-- Select Week --</option>
          ${Array.from({ length: 14 }, (_, i) => `<option>Week ${i + 1}</option>`).join('')}
        </select>
      </label>
      <label>🏫 Class:
        <select id="attendanceClassSelect" required>
          <option value="">-- Select Class --</option>
          ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </label>
      <button type="submit">➡️ Load Students</button>
    </form>
    <div id="attendanceContainer" style="margin-top:1.5rem;"></div>
  `;

  document.getElementById('attendanceHeaderForm').addEventListener('submit', async e => {
    e.preventDefault();
    const term = document.getElementById('attendanceTerm').value;
    const week = document.getElementById('attendanceWeek').value;
    const selectedClass = document.getElementById('attendanceClassSelect').value;

    const list = students.filter(s => s.class === selectedClass);
    if (!list.length) {
      return document.getElementById('attendanceContainer').innerHTML =
        `<p>No students found for class ${selectedClass}.</p>`;
    }

    const headerCols = days.map(d => `<th>${d}</th>`).join('');
    const rows = list.map(s => `
      <tr>
        <td>${s.name}</td>
        ${days.map(d => `
          <td>
            <select data-id="${s._id}" data-day="${d}">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="holiday">Public Holiday</option>
            </select>
          </td>
        `).join('')}
      </tr>
    `).join('');

    document.getElementById('attendanceContainer').innerHTML = `
      <form id="attendanceForm">
        <table border="1" cellpadding="5" width="100%">
          <thead>
            <tr>
              <th>Student Name</th>${headerCols}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <button type="submit">✅ Submit Attendance</button>
      </form>
    `;

    document.getElementById('attendanceForm').addEventListener('submit', async e2 => {
      e2.preventDefault();
      const selects = document.querySelectorAll('#attendanceForm select');
      const entries = [];

      selects.forEach(sel => {
        entries.push({
          studentId: sel.dataset.id,
          day: sel.dataset.day,
          status: sel.value
        });
      });

      const record = {
        class: selectedClass,
        term,
        week,
        date: new Date().toISOString(),
        entries
      };

      try {
        await apiRequest('/api/attendance', 'POST', record);
        alert(`✅ Attendance saved for ${selectedClass} — ${term}, ${week}`);
        showAttendanceForm(); // reset
      } catch {
        // already handled in apiRequest
      }
    });
  });
}

// ============================================
// 📝 ENTER RESULTS FORM (Backend Version)
// ============================================

async function showResultsForm() {
  const students = await apiRequest('/api/students');
  const classes = [...new Set(students.map(s => s.class))];
  const subjects = [
    'Mathematics', 'English Language', 'Basic Science', 'Social Studies',
    'Agricultural Science', 'Civic Education', 'Computer Studies',
    'Physical Health Ed.', 'Yoruba Language', 'Home Economics',
    'Islamic Studies', 'Quantitative Reasoning', 'Verbal Reasoning', 'Creative Arts'
  ];

  document.getElementById('dynamic-content').innerHTML = `
    <h3>📝 Enter Student Results</h3>
    <form id="classSelectorForm">
      <label>Select Class:
        <select id="resultClassSelect" required>
          <option value="">-- Choose Class --</option>
          ${classes.map(cls => `<option value="${cls}">${cls}</option>`).join('')}
        </select>
      </label>
      <button type="submit">➡️ Load Students</button>
    </form>
    <div id="resultsEntryArea" style="margin-top: 2rem;"></div>
  `;

  document.getElementById('classSelectorForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const selectedClass = document.getElementById('resultClassSelect').value;
    const filteredStudents = students.filter(s => s.class === selectedClass);

    if (filteredStudents.length === 0) {
      return document.getElementById('resultsEntryArea').innerHTML = `<p>No students found in selected class.</p>`;
    }

    let tableHeaders = subjects.map(s => `<th colspan="3">${s}</th>`).join('');
    let subHeaders = subjects.map(() => `<th>CA1</th><th>CA2</th><th>Exam</th>`).join('');

    let formRows = filteredStudents.map(s => {
      return `<tr><td>${s.name}</td>` + subjects.map(subj => `
        <td><input type="number" class="ca1" data-student="${s._id}" data-subject="${subj}" data-type="ca1" min="0" max="20" /></td>
        <td><input type="number" class="ca2" data-student="${s._id}" data-subject="${subj}" data-type="ca2" min="0" max="20" /></td>
        <td><input type="number" class="exam" data-student="${s._id}" data-subject="${subj}" data-type="exam" min="0" max="60" /></td>
      `).join('') + `</tr>`;
    }).join('');

    document.getElementById('resultsEntryArea').innerHTML = `
      <form id="resultsEntryForm">
        <table border="1" cellpadding="5" width="100%">
          <thead>
            <tr><th rowspan="2">Student Name</th>${tableHeaders}</tr>
            <tr>${subHeaders}</tr>
          </thead>
          <tbody>${formRows}</tbody>
        </table>
        <button type="submit" style="margin-top:1rem;">✅ Save Results</button>
      </form>
    `;

    // Input validation
    document.querySelectorAll('#resultsEntryForm input[type="number"]').forEach(input => {
      input.addEventListener('input', () => {
        const type = input.dataset.type;
        const value = parseInt(input.value);
        if ((type === 'ca1' || type === 'ca2') && value > 20) {
          alert(`❌ ${type.toUpperCase()} cannot exceed 20`);
          input.value = '';
        } else if (type === 'exam' && value > 60) {
          alert('❌ Exam score cannot exceed 60');
          input.value = '';
        }
      });
    });

    // Submit results to backend
    document.getElementById('resultsEntryForm').addEventListener('submit', async function (e2) {
      e2.preventDefault();
      const inputs = document.querySelectorAll('#resultsEntryForm input');
      const groupedResults = {};

      inputs.forEach(input => {
        const studentId = input.dataset.student;
        const subject = input.dataset.subject;
        const type = input.dataset.type;
        const score = parseInt(input.value);
        if (!groupedResults[studentId]) groupedResults[studentId] = {};
        if (!groupedResults[studentId][subject]) groupedResults[studentId][subject] = { ca1: 0, ca2: 0, exam: 0 };

        groupedResults[studentId][subject][type] = isNaN(score) ? null : score;
      });

      const payload = Object.keys(groupedResults).map(studentId => ({
        studentId,
        subjects: groupedResults[studentId]
      }));

      try {
        await apiRequest('/api/results', 'POST', { results: payload });
        alert('✅ Results saved successfully.');
        showResultsForm(); // Reload view
      } catch {
        // Handled in apiRequest
      }
    });
  });
}

// ============================================
// 📄 REPORT CARD GENERATOR (TEACHER/ADMIN)
// ============================================

// ========================= Load Student List =========================
// This function fetches the list of students for a given class
async function loadStudentsForClass(className) {
  try {
    const res = await fetch(`/api/students?class=${encodeURIComponent(className)}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const students = await res.json(); // Expect an array of student objects
    return students;
  } catch (error) {
    alert('Error fetching student list: ' + error.message);
    return [];
  }
}

// ========================= Calculate Grade and Remark =========================
function getGradeAndRemark(totalScore) {
  // Assuming scoring out of 100
  if (totalScore >= 70) {
    return { grade: 'A', remark: 'Excellent' };
  } else if (totalScore >= 60) {
    return { grade: 'B', remark: 'Very Good' };
  } else if (totalScore >= 50) {
    return { grade: 'C', remark: 'Good' };
  } else if (totalScore >= 40) {
    return { grade: 'D', remark: 'Fair' };
  } else {
    return { grade: 'F', remark: 'Poor' };
  }
}

// ========================= Generate Report Card =========================
// Main function to fetch result data and build report card HTML
async function generateReportCard() {
  try {
    // Prompt user for class
    const className = prompt('Enter class (e.g., JSS1, SS2):');
    if (!className) {
      alert('Class is required.');
      return;
    }
    // Fetch student list for the selected class
    const students = await loadStudentsForClass(className);
    if (students.length === 0) {
      alert('No students found for class ' + className);
      return;
    }
    // Prompt user to select a student by admission number
    const studentListText = students.map(s => `${s.admissionNo} - ${s.name}`).join('\n');
    const admissionNo = prompt('Enter student Admission No from the list:\n' + studentListText);
    if (!admissionNo) {
      alert('Student selection is required.');
      return;
    }

    // Fetch student result using admission number
    const res = await fetch(`/api/results/${encodeURIComponent(admissionNo)}`);
    if (!res.ok) {
      throw new Error(`Result not found (status: ${res.status})`);
    }
    const result = await res.json(); // Expect an object with student result data

    // ================= Build Report Card HTML =================
    let html = '';
    // School and term details
    html += `<h2>${result.schoolName || 'SCHOOL NAME'}</h2>`;
    html += `<p><strong>Report Sheet:</strong> ${result.term || ''} ${result.session || ''}</p>`;
    // Student information
    html += `<p><strong>Name:</strong> ${result.name || ''}</p>`;
    html += `<p><strong>Class:</strong> ${result.class || className}</p>`;
    html += `<p><strong>Admission No:</strong> ${result.admissionNo || admissionNo}</p>`;
    if (result.noInClass !== undefined) {
      html += `<p><strong>No in Class:</strong> ${result.noInClass}</p>`;
    }
    if (result.position !== undefined) {
      html += `<p><strong>Position:</strong> ${result.position}</p>`;
    }
    // Attendance
    if (result.attendance) {
      html += `<p><strong>Days Open:</strong> ${result.attendance.daysOpen || ''}</p>`;
      html += `<p><strong>Days Present:</strong> ${result.attendance.daysPresent || ''}</p>`;
      html += `<p><strong>Days Absent:</strong> ${result.attendance.daysAbsent || ''}</p>`;
    }

    // Subjects table
    html += `<table border="1" cellspacing="0" cellpadding="5">
      <tr>
        <th>Subject</th><th>CA1</th><th>CA2</th><th>Exam</th>
        <th>Total</th><th>Grade</th><th>Remark</th>
      </tr>`;
    let grandTotal = 0;
    let subjectCount = 0;
    if (Array.isArray(result.subjects)) {
      result.subjects.forEach(sub => {
        const ca1 = sub.ca1 || 0;
        const ca2 = sub.ca2 || 0;
        const exam = sub.exam || 0;
        const total = ca1 + ca2 + exam;
        grandTotal += total;
        subjectCount += 1;
        const { grade, remark } = getGradeAndRemark(total);
        html += `<tr>
          <td>${sub.name || ''}</td>
          <td>${ca1}</td>
          <td>${ca2}</td>
          <td>${exam}</td>
          <td>${total}</td>
          <td>${grade}</td>
          <td>${remark}</td>
        </tr>`;
      });
    }
    html += `</table>`;

    // Totals and averages
    if (subjectCount > 0) {
      const average = (grandTotal / subjectCount).toFixed(2);
      html += `<p><strong>Total Score:</strong> ${grandTotal}</p>`;
      html += `<p><strong>Average Score:</strong> ${average}</p>`;
      const finalGR = getGradeAndRemark(grandTotal / subjectCount);
      html += `<p><strong>Final Grade:</strong> ${finalGR.grade}</p>`;
      html += `<p><strong>Final Remark:</strong> ${finalGR.remark}</p>`;
    }

    // Affective Traits
    if (result.traits && typeof result.traits === 'object') {
      html += `<h3>Affective Traits</h3>`;
      html += `<table border="1" cellspacing="0" cellpadding="5">
        <tr><th>Trait</th><th>Rating</th></tr>`;
      for (const [trait, rating] of Object.entries(result.traits)) {
        html += `<tr><td>${trait}</td><td>${rating}</td></tr>`;
      }
      html += `</table>`;
    }

    // Psychomotor Skills
    if (result.psychomotor && typeof result.psychomotor === 'object') {
      html += `<h3>Psychomotor Skills</h3>`;
      html += `<table border="1" cellspacing="0" cellpadding="5">
        <tr><th>Skill</th><th>Rating</th></tr>`;
      for (const [skill, rating] of Object.entries(result.psychomotor)) {
        html += `<tr><td>${skill}</td><td>${rating}</td></tr>`;
      }
      html += `</table>`;
    }

    // Teacher and principal remarks
    if (result.teacherRemark) {
      html += `<p><strong>Class Teacher's Remark:</strong> ${result.teacherRemark}</p>`;
    }
    if (result.principalRemark) {
      html += `<p><strong>Principal's Remark:</strong> ${result.principalRemark}</p>`;
    }
    if (result.nextTermStart) {
      html += `<p><strong>Next Term Begins:</strong> ${result.nextTermStart}</p>`;
    }

    // Print button
    html += `<p><button id="printBtn">Print Report Card</button></p>`;

    // Insert report card HTML into container
    const container = document.getElementById('reportCardContainer');
    if (container) {
      container.innerHTML = html;
      document.getElementById('printBtn').addEventListener('click', () => {
        window.print();
      });
    } else {
      console.error('Report card container not found.');
    }

  } catch (error) {
    alert('Error generating report card: ' + error.message);
  }
}

// ============================================
// 📊 GRADE & REMARK UTILITIES
// ============================================

/**
 * Returns a grade letter based on score out of 100
 * @param {number} score - Total score (0-100)
 * @returns {string} Grade ('A' to 'F')
 */
function getGrade(score) {
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * Returns a performance remark based on grade
 * @param {string} grade - Grade letter ('A', 'B', 'C', 'D', 'F')
 * @returns {string} Remark
 */
function getRemark(grade) {
  switch (grade) {
    case 'A': return 'Excellent';
    case 'B': return 'Very Good';
    case 'C': return 'Good';
    case 'D': return 'Fair';
    case 'F': return 'Poor';
    default: return 'No Remark';
  }
}

/**
 * Combined utility to get both grade and remark from score
 * @param {number} score - Total score (0-100)
 * @returns {{grade: string, remark: string}}
 */
function getGradeAndRemark(score) {
  const grade = getGrade(score);
  const remark = getRemark(grade);
  return { grade, remark };
}

// ============================================
// 📄 SHOW REPORT (PARENT VIEW - BACKEND API)
// ============================================

async function showParentReport() {
  const currentParentEmail = localStorage.getItem('loggedInParent'); // must be set at login

  if (!currentParentEmail) {
    document.getElementById('dynamic-content').innerHTML = `<p>❌ You are not logged in.</p>`;
    return;
  }

  try {
    // Fetch all students and results from API
    const [studentsRes, resultsRes] = await Promise.all([
      fetch('/api/students'),
      fetch('/api/results')
    ]);

    const students = await studentsRes.json();
    const allResults = await resultsRes.json();

    const myChildren = students.filter(s => s.parent?.email === currentParentEmail);

    if (myChildren.length === 0) {
      document.getElementById('dynamic-content').innerHTML = `<p>❌ No children linked to your account.</p>`;
      return;
    }

    document.getElementById('dynamic-content').innerHTML = `
      <h3>📊 Your Child’s Results</h3>
      <label>Select Your Child:
        <select id="childSelector">
          ${myChildren.map(c => `<option value="${c.id}">${c.name} - ${c.class}</option>`).join('')}
        </select>
      </label>
      <div id="reportDisplay" style="margin-top:1rem;"></div>
    `;

    document.getElementById('childSelector').addEventListener('change', () => {
      const selectedId = document.getElementById('childSelector').value;
      const student = myChildren.find(s => s.id == selectedId);
      const studentResult = allResults[selectedId];

      if (!studentResult || !studentResult.subjects) {
        document.getElementById('reportDisplay').innerHTML = `<p>⚠️ No results found for ${student.name}.</p>`;
        return;
      }

      const subjectRows = Object.entries(studentResult.subjects).map(([subject, score]) => {
        const ca1 = score.ca1 || 0;
        const ca2 = score.ca2 || 0;
        const exam = score.exam || 0;
        const total = ca1 + ca2 + exam;
        const { grade, remark } = getGradeAndRemark(total);

        return `
          <tr>
            <td>${subject}</td>
            <td>${ca1}</td>
            <td>${ca2}</td>
            <td>${exam}</td>
            <td>${total}</td>
            <td>${grade}</td>
            <td>${remark}</td>
          </tr>
        `;
      }).join('');

      document.getElementById('reportDisplay').innerHTML = `
        <table border="1" cellpadding="5" width="100%">
          <thead>
            <tr>
              <th>Subject</th><th>CA1</th><th>CA2</th><th>Exam</th>
              <th>Total</th><th>Grade</th><th>Remark</th>
            </tr>
          </thead>
          <tbody>${subjectRows}</tbody>
        </table>
      `;
    });

    // Trigger initial load
    document.getElementById('childSelector').dispatchEvent(new Event('change'));

  } catch (error) {
    console.error(error);
    document.getElementById('dynamic-content').innerHTML = `<p>❌ Error fetching results.</p>`;
  }
  function getGrade(score) {
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function getRemark(grade) {
  switch (grade) {
    case 'A': return 'Excellent';
    case 'B': return 'Very Good';
    case 'C': return 'Good';
    case 'D': return 'Fair';
    case 'F': return 'Poor';
    default: return 'No Remark';
  }
}

function getGradeAndRemark(score) {
  const grade = getGrade(score);
  const remark = getRemark(grade);
  return { grade, remark };
}

}


// ============================================
// 📆 PARENT VIEW - ATTENDANCE PROGRESS (API)
// ============================================

async function showAttendanceViewer() {
  const currentParentEmail = localStorage.getItem('loggedInParent');

  if (!currentParentEmail) {
    document.getElementById('dynamic-content').innerHTML = `<p>❌ Not logged in. Please sign in as a parent.</p>`;
    return;
  }

  try {
    const [studentsRes, attendanceRes] = await Promise.all([
      fetch('/api/students'),
      fetch('/api/attendance')
    ]);

    const students = await studentsRes.json();
    const attendanceRecords = await attendanceRes.json();

    const myChildren = students.filter(s => s.parent?.email === currentParentEmail);

    if (myChildren.length === 0) {
      document.getElementById('dynamic-content').innerHTML = `<p>❌ No registered children found.</p>`;
      return;
    }

    // Build selector
    document.getElementById('dynamic-content').innerHTML = `
      <h3>📆 Weekly Attendance Summary</h3>
      <label>Select Your Child:
        <select id="childAttendanceSelector">
          ${myChildren.map(c => `<option value="${c.id}">${c.name} - ${c.class}</option>`).join('')}
        </select>
      </label>
      <div id="attendanceSummaryDisplay" style="margin-top:1.5rem;"></div>
    `;

    document.getElementById('childAttendanceSelector').addEventListener('change', () => {
      const selectedId = parseInt(document.getElementById('childAttendanceSelector').value);
      const student = myChildren.find(s => s.id === selectedId);

      const childRecords = attendanceRecords.filter(r =>
        r.class === student.class &&
        r.entries.some(e => e.id === selectedId)
      );

      if (childRecords.length === 0) {
        document.getElementById('attendanceSummaryDisplay').innerHTML = `<p>No attendance records for ${student.name}.</p>`;
        return;
      }

      let rows = childRecords.map(r => {
        const entry = r.entries.find(e => e.id === selectedId);
        const summary = r.entries
          .filter(e => e.id === selectedId)
          .reduce((acc, e) => {
            acc[e.status] = (acc[e.status] || 0) + 1;
            return acc;
          }, {});

        return `
          <tr>
            <td>${r.term}</td>
            <td>${r.week}</td>
            <td>${r.date}</td>
            <td>${summary.present || 0}</td>
            <td>${summary.absent || 0}</td>
            <td>${summary.holiday || 0}</td>
          </tr>
        `;
      }).join('');

      document.getElementById('attendanceSummaryDisplay').innerHTML = `
        <table border="1" cellpadding="6" width="100%">
          <thead>
            <tr style="background:#f0f0f0;">
              <th>Term</th><th>Week</th><th>Date</th>
              <th>✅ Present</th><th>❌ Absent</th><th>📛 Holiday</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    });

    // Trigger initial load
    document.getElementById('childAttendanceSelector').dispatchEvent(new Event('change'));

  } catch (err) {
    console.error(err);
    document.getElementById('dynamic-content').innerHTML = `<p>❌ Error loading attendance.</p>`;
  }
}

// ============================================
// 💳 PARENT VIEW - FEES STATUS (API VERSION)
// ============================================

async function showFeesStatus() {
  const currentParentEmail = localStorage.getItem('loggedInParent');

  if (!currentParentEmail) {
    document.getElementById('dynamic-content').innerHTML = `<p>❌ You are not logged in. Please log in as a parent.</p>`;
    return;
  }

  try {
    const [studentsRes, feesRes] = await Promise.all([
      fetch('/api/students'),
      fetch('/api/fees')
    ]);

    const students = await studentsRes.json();
    const feeRecords = await feesRes.json();

    const myChildren = students.filter(s => s.parent?.email === currentParentEmail);

    if (myChildren.length === 0) {
      document.getElementById('dynamic-content').innerHTML = `<p>❌ No registered children found.</p>`;
      return;
    }

    document.getElementById('dynamic-content').innerHTML = `
      <h3>💳 Termly Fees Payment Status</h3>
      <label>Select Your Child:
        <select id="childFeeSelector">
          ${myChildren.map(c => `<option value="${c.id}">${c.name} - ${c.class}</option>`).join('')}
        </select>
      </label>
      <div id="feesStatusDisplay" style="margin-top:1.5rem;"></div>
    `;

    document.getElementById('childFeeSelector').addEventListener('change', () => {
      const selectedId = parseInt(document.getElementById('childFeeSelector').value);
      const student = myChildren.find(s => s.id === selectedId);

      const childFees = feeRecords.filter(fee => fee.studentId === selectedId);

      if (childFees.length === 0) {
        document.getElementById('feesStatusDisplay').innerHTML = `<p>No fee records available for ${student.name}.</p>`;
        return;
      }

      let rows = childFees.map(fee => {
        const statusColor = fee.status === 'Paid' ? 'green' : (fee.status === 'Partially Paid' ? 'orange' : 'red');
        return `
          <tr>
            <td>${fee.term}</td>
            <td>${fee.session}</td>
            <td>₦${fee.amount}</td>
            <td>₦${fee.paid}</td>
            <td style="color:${statusColor}; font-weight:bold;">${fee.status}</td>
            <td>${fee.paymentDate || 'N/A'}</td>
          </tr>
        `;
      }).join('');

      document.getElementById('feesStatusDisplay').innerHTML = `
        <table border="1" cellpadding="6" width="100%">
          <thead style="background:#f0f0f0;">
            <tr>
              <th>Term</th><th>Session</th>
              <th>Total Fees</th><th>Amount Paid</th>
              <th>Status</th><th>Payment Date</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    });

    // Trigger auto-load
    document.getElementById('childFeeSelector').dispatchEvent(new Event('change'));

  } catch (error) {
    console.error('Error loading fee status:', error);
    document.getElementById('dynamic-content').innerHTML = `<p>❌ Failed to load fees data.</p>`;
  }
}

// ============================================
// 📬 ADMIN - VIEW MESSAGES FROM PARENTS (API VERSION)
// ============================================

async function showMessagesAdmin() {
  try {
    const res = await fetch('/api/messages');
    const messages = await res.json();

    // Filter messages sent by parents (you may use a `role` or `senderType` field instead in real DB)
    const parentMessages = messages.filter(msg => msg.senderType === 'parent');

    if (parentMessages.length === 0) {
      document.getElementById('dynamic-content').innerHTML = `
        <h3>📬 Parent Messages</h3>
        <p>No messages from parents yet.</p>
      `;
      return;
    }

    let rows = parentMessages.map(msg => `
      <tr>
        <td>${msg.senderName || 'Unknown'}</td>
        <td>${msg.senderEmail}</td>
        <td>${new Date(msg.timestamp).toLocaleString()}</td>
        <td>${msg.subject || '—'}</td>
        <td><button onclick="viewParentMessage('${msg._id}')">📨 View</button></td>
      </tr>
    `).join('');

    document.getElementById('dynamic-content').innerHTML = `
      <h3>📬 Messages from Parents</h3>
      <table border="1" cellpadding="6" width="100%">
        <thead style="background:#f0f0f0;">
          <tr>
            <th>Sender</th><th>Email</th><th>Date</th><th>Subject</th><th>Action</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div id="messageDetail" style="margin-top:2rem;"></div>
    `;
  } catch (err) {
    console.error('Error fetching messages:', err);
    document.getElementById('dynamic-content').innerHTML = `
      <h3>📬 Parent Messages</h3>
      <p>❌ Unable to load messages. Please try again later.</p>
    `;
  }
  async function viewParentMessage(id) {
  try {
    const res = await fetch(`/api/messages/${id}`);
    const msg = await res.json();

    document.getElementById('messageDetail').innerHTML = `
      <h4>📨 Message from ${msg.senderName || 'Unknown'} (${msg.senderEmail})</h4>
      <p><strong>Subject:</strong> ${msg.subject || '—'}</p>
      <p><strong>Date:</strong> ${new Date(msg.timestamp).toLocaleString()}</p>
      <p><strong>Message:</strong><br>${msg.body}</p>
    `;
  } catch (error) {
    console.error(error);
    document.getElementById('messageDetail').innerHTML = `<p>❌ Failed to load message.</p>`;
  }
}

}

// ============================================
// 📩 PARENT MESSAGE SENDER (API VERSION)
// ============================================

document.getElementById('messageForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const message = document.getElementById('parentMessage').value.trim();
  const parentEmail = localStorage.getItem('loggedInParent');

  if (!message) {
    return alert('❌ Message cannot be empty.');
  }

  if (!parentEmail) {
    return alert('❌ You must be logged in as a parent to send a message.');
  }

  const senderName = localStorage.getItem('loggedInParentName') || 'Unknown Parent';

  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderName,
        senderEmail: parentEmail,
        subject: 'Parent Feedback',
        body: message,
        senderType: 'parent',
        timestamp: new Date().toISOString()
      })
    });

    if (!res.ok) throw new Error('Failed to send message');

    alert('✅ Message sent to admin.');
    document.getElementById('parentMessage').value = '';
  } catch (err) {
    console.error(err);
    alert('❌ Failed to send message. Try again later.');
  }
});

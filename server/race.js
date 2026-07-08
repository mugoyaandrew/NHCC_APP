async function simulateRaceCondition() {
  console.log('--- STARTING CONCURRENCY TEST ---');
  
  // 1. Login to get token
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@nhcc.go.ug', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // 2. Get the current project
  const projectRes = await fetch('http://localhost:3001/api/projects', { headers });
  const projects = await projectRes.json();
  const project = projects[0];
  console.log(`Target: Project ${project.id} (Current Version: ${project.version})`);

  // 3. User A and User B both try to save changes at the EXACT same millisecond
  console.log('\n[!] User A and User B both click save at the exact same millisecond...');
  
  const userARequest = fetch(`http://localhost:3001/api/projects/${project.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ ...project, status: 'in_progress', version: project.version })
  }).then(r => r.json().then(d => ({ status: r.status, data: d })));

  const userBRequest = fetch(`http://localhost:3001/api/projects/${project.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ ...project, budget: 9999999, version: project.version })
  }).then(r => r.json().then(d => ({ status: r.status, data: d })));

  // 4. Wait for both responses
  const results = await Promise.all([userARequest, userBRequest]);

  // 5. Output Results
  results.forEach((result, index) => {
    const user = index === 0 ? 'User A' : 'User B';
    if (result.status === 200) {
      console.log(`✅ ${user} Success! New Version is now: ${result.data.version}`);
    } else {
      console.log(`❌ ${user} Failed! Server blocked it: ${result.data.error}`);
    }
  });
}

simulateRaceCondition().catch(console.error);

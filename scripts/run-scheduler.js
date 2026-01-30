const { exec } = require('child_process');
const path = require('path');

console.log('Starting tweet scheduler...');
console.log('Will check for tweets every 15 minutes');
console.log('Press Ctrl+C to stop');

function runScheduler() {
  const scriptPath = path.join(__dirname, 'scheduler.js');
  
  exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
  });
}

// 初回実行
runScheduler();

// 15分ごとに実行 (900000ms = 15分)
setInterval(runScheduler, 900000);

console.log('Scheduler is running. Next check in 15 minutes...');
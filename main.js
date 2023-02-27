const fs = require('fs');

async function execute(exporter) {
  console.log('Starting sync...');
  var exporterClass = require('./exporters/' + exporter);

  var exporterInstance = new exporterClass();
  await exporterInstance.start();
}

async function executeAll() {
  var exporters = fs.readdirSync('./exporters/');

  for (let i = 0; i < exporters.length; i++) {
    const file = exporters[i];
    if (file.indexOf('.js') < 0) {
      await execute(file);
    }
  }
}

async function main() {
  console.log('### netboxvms exporter ###');
  console.log(new Date());
  if (process.argv.length > 2) {
    var exporter = process.argv[2];
    console.log('Requested exporter ' + exporter);
    exporter = exporter.indexOf('.js') < 0 ? exporter + '.js' : exporter;
    console.log('Executing ' + exporter + '...');
    await execute(exporter);
  } else {
    console.log('Executing all exporters in 5 seconds...');
    setTimeout(async () => {
      await executeAll();
    }, 5000);
  }
}

main();

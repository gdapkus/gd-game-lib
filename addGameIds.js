const fs = require('fs');
const path = require('path');

// Directory where JSON files are stored
const directoryPath = path.join(__dirname, 'public/gameCache');

// Function to add `id` field to JSON files
function addIdFieldToJsonFiles() {
  // Read the directory for all JSON files
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return console.error('Unable to scan directory:', err);
    }

    // Process each JSON file
    files.forEach(file => {
      // Only process JSON files
      if (path.extname(file) === '.json') {
        const gameId = path.basename(file, '.json'); // Extract the ID from the filename (removes '.json')

        // Read the JSON file
        const filePath = path.join(directoryPath, file);
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            return console.error('Error reading file:', err);
          }

          try {
            const jsonData = JSON.parse(data);

            // Add the `id` field to the JSON data if it's not already present
            if (!jsonData.gameDetails) {
              jsonData.gameDetails = {};
            }

            jsonData.gameDetails.id = gameId;

            // Write the updated JSON back to the file
            fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8', err => {
              if (err) {
                console.error('Error writing file:', err);
              } else {
                console.log(`Successfully added id ${gameId} to ${file}`);
              }
            });
          } catch (parseError) {
            console.error('Error parsing JSON from file:', file, parseError);
          }
        });
      }
    });
  });
}

// Run the function
addIdFieldToJsonFiles();

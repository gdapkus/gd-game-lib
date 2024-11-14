const fs = require('fs');
const path = require('path');
const axios = require('axios');

const cacheDir = 'public/gameCache';
const bggUsersFile = 'config/bggUsers.json';
const apiUrl = 'https://boardgamegeek.com/api/collections?objectid=';

// Helper function to wait for a given time
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Read BGG users from the JSON file
function getBggUsers() {
    if (!fs.existsSync(bggUsersFile)) {
        console.error('bggUsers.json file not found');
        return [];
    }
    const usersData = JSON.parse(fs.readFileSync(bggUsersFile, 'utf8'));
    return usersData;
}

// Add postdate to each game in the collection using the API
async function addPostdateToCollection(user) {
    const sanitizedUserName = user.username.replace(/\s+/g, '_');
    const cacheFilePath = path.join(cacheDir, `collectionCache_${sanitizedUserName}.json`);

    if (!fs.existsSync(cacheFilePath)) {
        console.log(`Cache file for user ${user.username} not found.`);
        return;
    }

    const collectionData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
    let modified = false;


    for (const game of collectionData.games) {
        if (!game.postdate || !game.rating || !game.ratingTimestamp) { // Check if data is missing
            try {
                // Fetch all items with this objectid and the user's userid
                const response = await axios.get(`${apiUrl}${game.id}&objecttype=thing&userid=${user.userid}`);
                
                // Find the item in the response data that matches the game's collid
                const matchingItem = response.data.items.find(item => item.collid === game.collid);
                
                if (matchingItem) {
                    const postdate = matchingItem.postdate ? matchingItem.postdate.split('T')[0] : null; // Extract only date part
                    const rating = matchingItem.rating || null;
                    const ratingTimestamp = matchingItem.ratingTimestamp ? matchingItem.ratingTimestamp.split('T')[0] : null;

                    // Update game details
                    game.postdate = postdate;
                    game.rating = rating;
                    game.ratingTimestamp = ratingTimestamp;
                    modified = true;

                    console.log(`Retrieved postdate for ${user.username}'s game ${game.name} (${game.postdate}).`);
                } else {
                    console.log(`No matching item with collid ${game.collid} found for game ${game.name}.`);
                }				
				


       //         await wait(2500); // Wait 3 seconds before the next API call
            } catch (error) {
                console.error(`Failed to fetch postdate for game ${game.id} for user ${user.username}:`, error.message);
            }
        }
    }

    if (modified) {
        fs.writeFileSync(cacheFilePath, JSON.stringify(collectionData, null, 2));
        console.log(`Saved updates for user ${user.username}'s collection.`);
    } else {
        console.log(`No updates needed for user ${user.username}'s collection.`);
    }
}

// Process each user's collection
async function updateAllCollections() {
    const users = getBggUsers();

    for (const user of users) {
        console.log(`Processing collection for user: ${user.username}`);
        await addPostdateToCollection(user);
    }

    console.log('Completed updating all collections.');
}

// Run the update process
updateAllCollections();

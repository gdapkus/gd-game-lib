// server.js
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { createTrelloCard, getTrelloLists, getGameDetails } = require('./src/services/trelloCards');
const xml2js = require('xml2js');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Add this line for x-www-form-urlencoded
const path = require('path');
const fs = require('fs');
// Constants
const cacheDir = 'public/gameCache'; // Subdirectory for cache files

const bggUsersPath = path.join(__dirname, 'config', 'bggUsers.json');
const bggUsers = JSON.parse(fs.readFileSync(bggUsersPath, 'utf8'));

// Test Route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route is working!' });
});

// Load and serve BGG users data
app.get('/bgg-users', (req, res) => {
    res.json(bggUsers); // Send the data to the frontend
});

// Route to get Trello lists
app.get('/getTrelloLists', async (req, res) => {
  const trelloToken = req.query.token; // Pass the token as a query parameter or through headers
  if (!trelloToken) {
    return res.status(400).json({ error: 'Trello token is required' });
  }
  try {
    const lists = await getTrelloLists(trelloToken);
    res.json(lists);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Trello lists' });
  }
});

// Route to create a Trello card
app.post('/createTrelloCard', async (req, res) => {
  const { listId, gameId, trelloToken } = req.body;
  
  console.log('Received data:', { listId, gameId, trelloToken }); // Log received data

  if (!listId || !gameId || !trelloToken) {
    return res.status(400).json({ error: 'listId, gameId, and trelloToken are required' });
  }
  try {
    await createTrelloCard(listId, gameId, trelloToken);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create Trello card' });
  }
});

//route for Callback to test authorization and save cookie
app.get('/trelloCallback', (req, res) => {
    res.send(`
        <script>
            const token = new URLSearchParams(window.location.hash.substring(1)).get('token');
            if (token) {
                window.location.href = '/api/authorizeTrello?token=' + token;
            } else {
                alert('Authorization failed. Please try again.');
                window.close();
            }
        </script>
    `);
});

//route to load the Authorize Trello with a popup window and callback tht test's the authorization.
app.get('/authorizeTrello', async (req, res) => {
    const trelloKey = process.env.TRELLO_KEY;
    const token = req.query.token;

    if (token) {
        try {
            const response = await axios.get(`https://api.trello.com/1/members/me`, {
                params: {
                    key: trelloKey,
                    token: token
                }
            });

            if (response.data && response.data.id) {
                res.cookie('BGGCard', token);
				res.cookie('BGGCard', token, {
					maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
				});
                res.send(`
                    <script>
                        if (window.opener) {
                            window.close();
                        } else {
                            window.location.href = '/';
                        }
                    </script>
                `);
            } else {
                res.send(`
                    <script>
                        alert('Invalid token. Please try again.');
                        window.close();
                    </script>
                `);
            }
        } catch (error) {
            res.send(`
                <script>
                    alert('Invalid token. Please try again.');
                    window.close();
                </script>
            `);
        }
    } else {
        res.send(`
            <h2>Authorize Trello</h2>
            <p>To authorize Trello, please click the link below:</p>
            <button onclick="openAuthWindow()">Authorize Trello</button>
            <script>
                function openAuthWindow() {
					const callbackUrl = encodeURIComponent(window.location.origin + '/api/trelloCallback');
					const authWindow = window.open('https://trello.com/1/authorize?expiration=never&key=${trelloKey}&scope=read,write&response_type=token&return_url=' + callbackUrl, 'authWindow', 'width=600,height=400');
                }
            </script>
        `);
    }
});

// Route for /games, defaulting to 'gdapkus'
app.get('/games', async (req, res) => {
    const bggUserId = 'gdapkus';
    await handleGamesRequest(bggUserId, res);
});

// Route for /games/:bggUserId, accepting a specific user ID
app.get('/games/:bggUserId', async (req, res) => {
    const { bggUserId } = req.params;
    await handleGamesRequest(bggUserId, res);
});

// Helper function to handle the games request logic
async function handleGamesRequest(bggUserId, res) {
    const cacheFilePath = path.join(__dirname, `public/gameCache/gamesCache_${bggUserId}.json`);
    const collectionCachePath = path.join(__dirname, `public/gameCache/collectionCache_${bggUserId}.json`);

    let cacheDate = getTimeStamp(cacheFilePath);
    let collectionDate = getTimeStamp(collectionCachePath);

    try {
        console.log(`Cache Date: ${new Date(cacheDate).toISOString()}`);
        console.log(`Collection Date: ${new Date(collectionDate).toISOString()}`);

        // Check if cache is valid based on the collection timestamp
        if (fs.existsSync(cacheFilePath) && cacheDate >= collectionDate) {
            const cachedData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
            console.log('Serving games from cache');
            return res.json({ games: cachedData.games, collectionDate: new Date(collectionDate).toISOString() });
        }

        // If cache is not valid, read collection data and fetch game details
        if (fs.existsSync(collectionCachePath)) {
            const collectionData = JSON.parse(fs.readFileSync(collectionCachePath, 'utf8'));
            collectionDate = new Date(collectionData.timestamp).getTime(); // Update collectionDate from the file
            console.log('Building new Cache from Collection Data');

            // Fetch game details for each game from the individual game JSON files
            const gameDetails = collectionData.games.map(game => {
                const gameDetailsFile = path.join(__dirname, `public/gameCache/${game.id}.json`);
                if (fs.existsSync(gameDetailsFile)) {
                    const gameData = JSON.parse(fs.readFileSync(gameDetailsFile, 'utf8'));
					const bestAtCount = Array.isArray(gameData.gameDetails.bestAtCount) ? gameData.gameDetails.bestAtCount : [];
        const bestAtCountText = bestAtCount.length > 0 ? bestAtCount.join(', ') : 'N/A';
                    return {
                        id: game.id,
                        name: gameData.gameDetails.name,
                        type: gameData.gameDetails.type,
                        lastmodified: game.lastmodified,
                        thumbnail: gameData.gameDetails.thumbnail,
                        link: gameData.gameDetails.link,
                        minPlayers: gameData.gameDetails.minPlayers,
                        maxPlayers: gameData.gameDetails.maxPlayers,
                        bestAtCount: bestAtCountText
                    };
                }
                return null;
            });

            // Filter out any games that couldn't be fetched properly
            const filteredGames = gameDetails.filter(game => game !== null);

            // Sort games by lastmodified, newest to oldest
            filteredGames.sort((a, b) => new Date(b.lastmodified) - new Date(a.lastmodified));

            // Save the fetched game list to cache with a timestamp
            cacheDate = new Date();
            const cacheData = {
                timestamp: cacheDate.toISOString(),
                games: filteredGames
            };
            fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData), 'utf8');

            return res.json({ games: filteredGames, collectionDate: new Date(collectionDate).toISOString() });
        } else {
            return res.status(500).json({ error: 'Collection cache not found.' });
        }
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'Failed to fetch games' });
    }
}



//BGG data load routes
//route to load  a collection for a user
app.get('/loadCollection/:bggUserId', async (req, res) => {
    const { bggUserId } = req.params;

    try {
        const message = await loadCollection(bggUserId);
        res.send(message);
    } catch (error) {
      console.error(`Load Collection failed: ${error.message}`);
        res.status(500).send(error.message);
    }
});


//route to load  game details for alls games from a collection with 3-second delay between each entry
app.get('/loadDetails/:bggUserName', async (req, res) => {
    const { bggUserName } = req.params;
    const cachedCollection = getCachedCollection(bggUserName);

    for (const game of cachedCollection) {
		const isCached = isGameDetailsCached(game.id)
//		console.log(`Checking Game ID:${game.id}: ${isCached}`);
        if (!isCached) {
            const data = await getGameDetails(game.id);
            await wait(3000); // wait 3 seconds before moving on to the next game
        }
    }
    res.send('Game details loading process completed.');
});


// function to save the BGG collection response to a local JSON cache
async function loadCollection(userName) {
    const sanitizedUserName = userName.replace(/\s+/g, '_');
	const collectionUrl = `https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(userName)}&own=1`;
    const cacheFilePath = path.join(__dirname, `public/gameCache/collectionCache_${sanitizedUserName}.json`);
	const bggUsersFile = 'config/bggUsers.json';
	const usersData = JSON.parse(fs.readFileSync(bggUsersFile, 'utf8'));
	const user = usersData.find(user => user.username === userName);
	const apiUrl = 'https://boardgamegeek.com/api/collections?objectid=';

  const maxRetries = 2; // Set the number of retries
  let retries = 0;
    let cacheModified = false;

    let cachedData = { games: [], timestamp: new Date().toISOString() };
    if (fs.existsSync(cacheFilePath)) {
        cachedData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
    }

    const existingGamesMap = new Map(cachedData.games.map(game => [game.collid, game]));


  while (retries <= maxRetries) {
    try {
      const response = await axios.get(collectionUrl); // Fetch BGG collection
      const result = await xml2js.parseStringPromise(response.data); // Parse XML response
	  
            // Use a `for...of` loop to handle asynchronous API calls sequentially
            const newGamesList = [];
            for (const game of result.items.item) {
                const status = game.status[0].$;
                const newGameData = {
                    id: game.$.objectid,
                    collid: game.$.collid,
                    name: game.name[0]._,
                    image: game.image[0],
                    thumbnail: game.thumbnail[0],
                    lastmodified: status.lastmodified,
                    numplays: game.numplays[0],
                    status: {
                        own: status.own === '1',
                        prevowned: status.prevowned === '1',
                        fortrade: status.fortrade === '1',
                        want: status.want === '1',
                        wanttoplay: status.wanttoplay === '1',
                        wanttobuy: status.wanttobuy === '1',
                        wishlist: status.wishlist === '1',
                        wishlistpriority: parseInt(status.wishlistpriority, 10) || null,
                        preordered: status.preordered === '1'
                    }
                };

                const existingGame = existingGamesMap.get(newGameData.collid);
                
                if (!existingGame || existingGame.lastmodified !== newGameData.lastmodified) {
                    cacheModified = true;

                        // fetch `postdate`, `rating`, and `ratingTimestamp` for new items and in case Rating has changed
						const detailsResponse = await axios.get(`${apiUrl}${newGameData.id}&objecttype=thing&userid=${user.userid}`);
                        const matchingItem = detailsResponse.data.items.find(item => item.collid === newGameData.collid);
                        if (matchingItem) {
                            newGameData.postdate = matchingItem.postdate ? matchingItem.postdate.split('T')[0] : null;
                            newGameData.rating = matchingItem.rating || null;
                            newGameData.ratingTimestamp = matchingItem.rating_tstamp ? matchingItem.rating_tstamp.split('T')[0] : null;
                        
                    }
                    newGamesList.push(newGameData);
                } else {
                    // If the game hasn't changed, keep the existing data
                    newGamesList.push(existingGame);
                }
            }
	
	if (cacheModified) {
      const cacheData = {
        timestamp: new Date().toISOString(),
        games: newGamesList
      };
	      // Write the updated cache to the file
      fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData, null, 2));
	}

	console.log(`Cache modified: ${cacheModified}`);
      return cacheModified ? 'Collection loaded successfully. Refresh to view the cached data.' : 'No changes to collection.';
    } catch (error) {
      retries += 1;
      console.error(`Attempt ${retries} failed: ${error.message}`);

      if (retries > maxRetries) {
        throw new Error(`Failed to load BGG collection after ${retries} attempts.`);
      }

      await wait(5000); // Wait for 5 seconds before retrying
    }
  }
}


//function to load the cached collection from the json
function getCachedCollection(userName) {
    const sanitizedUserName = userName.replace(/\s+/g, '_');
    const cacheFilePath = path.join(cacheDir, `collectionCache_${sanitizedUserName}.json`); 

    if (fs.existsSync(cacheFilePath)) {
        const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
        return cacheData.games;
    }

    return [];
}

//Function to check if a json file exists for a given game ID
function isGameDetailsCached(gameId) {
    const cacheFilePath = path.join(cacheDir, `${gameId}.json`);
    return fs.existsSync(cacheFilePath);
}



// Helper function to add a delay
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to get the timestamp from the cache file
function getTimeStamp(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return new Date(fileData.timestamp).getTime();
}


const PORT = process.env.EXPRESS_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

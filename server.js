// server.js
require('dotenv').config();
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
const cacheDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds


// Test Route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route is working!' });
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
                        alert('Token set successfully.');
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


// Serve game list API
app.get('/games', async (req, res) => {
  try {
    const bggUserId = process.env.BGG_USER_ID;
    const cacheFilePath = path.join(__dirname, `public/gameCache/collectionCache_${bggUserId}.json`);

    // Read the cached game list JSON file
    const collectionData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));

    // Fetch game details for each game from the individual game JSON files
    const gameDetails = collectionData.games.map(game => {
      const gameDetailsFile = path.join(__dirname, `public/gameCache/${game.id}.json`);
      if (fs.existsSync(gameDetailsFile)) {
        const gameData = JSON.parse(fs.readFileSync(gameDetailsFile, 'utf8'));
        return {
          id: game.id,
          name: gameData.gameDetails.name,
          type: gameData.gameDetails.type,
          thumbnail: gameData.gameDetails.thumbnail,
          link: gameData.gameDetails.link,
          minPlayers: gameData.gameDetails.minPlayers,
          maxPlayers: gameData.gameDetails.maxPlayers,
          bestAtCount: gameData.gameDetails.bestAtCount || 'N/A'
        };
      }
      return null;
    });

    // Filter out any games that couldn't be fetched properly
    const filteredGames = gameDetails.filter(game => game !== null);

    res.json({ games: filteredGames });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});



//BGG data load routes
//route to load  a collection for a user
app.get('/loadCollection', async (req, res) => {
    const bggUserId = process.env.BGG_USER_ID;

    try {
        const message = await loadCollection(bggUserId);
        res.send(message);
    } catch (error) {
      console.error(`Load Collection failed: ${error.message}`);
        res.status(500).send(error.message);
    }
});

// function to save the BGG collection response to a local JSON cache
async function loadCollection(userId) {
  const collectionUrl = `https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(userId)}&own=1`;
    const cacheFilePath = path.join(__dirname, `public/gameCache/collectionCache_${userId}.json`);


  const maxRetries = 2; // Set the number of retries
  let retries = 0;

  while (retries <= maxRetries) {
    try {
      const response = await axios.get(collectionUrl); // Fetch BGG collection
      const result = await xml2js.parseStringPromise(response.data); // Parse XML response
      const games = result.items.item.map(game => ({
        id: game.$.objectid,
        name: game.name[0]._,
        image: game.image[0],
        thumbnail: game.thumbnail,
        numplays: game.numplays
      }));

      const cacheData = {
        timestamp: new Date().toISOString(),
        games: games
      };

      // Write the cache to the file
      fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData));

      return 'Collection loaded successfully. You can now view the cached data.';
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


//route to load  game details for alls games from a collection with 5 second delay between each entry
app.get('/loadDetails', async (req, res) => {
    const userId = process.env.BGG_USER_ID; 
    const cachedCollection = getCachedCollection(userId);

    let errors = [];

    for (const game of cachedCollection) {
        if (!isGameDetailsCached(game.id)) {
			console.log(`Caching Game ID:${game.id}`);
            const { data, error } = await getGameDetails(game.id);
            if (error) {
                errors.push({ id: game.id, name: game.name });
            }
            await wait(3000); // wait 3 seconds before moving on to the next game
        }
    }

    const stats = {
        errors: errors
    };

    res.json(stats);
});


//function to load the cached collection from the json
function getCachedCollection(userId) {
    const sanitizedUserId = userId.replace(/\s+/g, '_');
    const cacheFilePath = path.join(cacheDir, `collectionCache_${sanitizedUserId}.json`); 

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




const PORT = process.env.EXPRESS_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

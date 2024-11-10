require('dotenv').config();
const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

// Constants
const cacheDir = './public/gameCache'; // Subdirectory for cache files
const cacheDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds



//BGG FUNCTIONS
//function to load game details for bggGameId from a json file.  If not available or old, pull from BGG API
async function getGameDetails(bggGameId) {
    const cacheFilePath = path.join(cacheDir, `${bggGameId}.json`);
    // Check if the cache file exists and is still valid
    if (fs.existsSync(cacheFilePath)) {
        const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
        const cacheTimestamp = new Date(cacheData.timestamp).getTime();
        if (Date.now() - cacheTimestamp < cacheDuration) {
            // Cache is valid, return the cached data
            return { data: cacheData.gameDetails, error: null };
        }
    }

    // Query the BGG API for game details
    try {
        console.log(`Retrieving Game ID:${bggGameId}`);
        const response = await axios.get(`https://boardgamegeek.com/xmlapi2/thing`, { params: { id: bggGameId } });
        const result = await xml2js.parseStringPromise(response.data);
        const game = result.items.item[0];
        const gameName = Array.isArray(game.name) ? game.name[0].$.value : game.name.$.value;
        let bestAtCount = null;
        try {
            const pollSummary = game['poll-summary'] ? game['poll-summary'].find(poll => poll.$.name === 'suggested_numplayers') : null;
            if (pollSummary) {
                const bestAtResult = pollSummary.result.find(res => res.$.name === 'bestwith');
                if (bestAtResult && bestAtResult.$.value) {
                    bestAtCount = bestAtResult.$.value.match(/\d+/) ? bestAtResult.$.value.match(/\d+/)[0] : null;
                }
            }
        } catch (err) {
            bestAtCount = null; // Set to null if any error occurs while parsing
        }

        const gameDetails = {
			id: bggGameId,
            name: gameName || 'Error',
            type: game.$.type || 'Error',
            description: game.description[0] || 'Error',
            image: game.image[0] || 'Error',
            thumbnail: game.thumbnail[0] || 'Error',
            link: `https://boardgamegeek.com/thing/${bggGameId}` || 'Error',
            minPlayers: game.minplayers[0].$.value || 'Error',
            maxPlayers: game.maxplayers[0].$.value || 'Error',
            yearPublished: game.yearpublished ? game.yearpublished[0].$.value : 'N/A',
            playingTime: game.playingtime ? game.playingtime[0].$.value : 'N/A',
            minPlayingTime: game.minplaytime ? game.minplaytime[0].$.value : 'N/A',
            maxPlayingTime: game.maxplaytime ? game.maxplaytime[0].$.value : 'N/A',
           bestAtCount: bestAtCount
        };

        // Only store if there's no error
        if (gameDetails.name !== 'Error') {
            const cacheData = {
                timestamp: new Date().toISOString(),
                gameDetails: gameDetails
            };
            fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData));
        }

        return { data: gameDetails, error: null };
    } catch (error) {
        console.error(`Error fetching game details (${bggGameId}):`, error);
        return { data: null, error: bggGameId };
    }
}



//TRELLO FUNCTIONS
//function to grab trello lists that exist on the board (you could make this static
async function getTrelloLists(trelloToken) {
    try {
        const response = await axios.get(`https://api.trello.com/1/boards/${process.env.TRELLO_BOARD_ID}/lists`, {
            params: {
                key: process.env.TRELLO_KEY,
                token: trelloToken
            }
        });
        return response.data.filter(list => list.name.startsWith('Want') || list.name === 'Dreamland');
    } catch (error) {
        console.error('Error fetching Trello lists:', error);
    }
}


//function to create the card on the appropriate board and list, then add member and vote based on the user adding
//(also adds 'owned by' tag which is hardcoded, but could use collection data.)
async function createTrelloCard(listId, gameId, trelloToken) {
    const { data: gameDetails, error } = await getGameDetails(gameId);

    if (error) {
        console.error(`Failed to get game details for game ID: ${gameId}`);
        return;
    }
	
	// Attempt to get instructional video link
	const videoLink = await getInstructionalVideoLink(gameId);
	
    try {
        const bestAtText = gameDetails.bestAtCount ? `, best:${gameDetails.bestAtCount}` : '';
        const cardTitle = `${gameDetails.name} (${gameDetails.minPlayers}-${gameDetails.maxPlayers}p${bestAtText})`;
        const response = await axios.post('https://api.trello.com/1/cards', {
            name: cardTitle,
            desc: gameDetails.description,
            idList: listId,
            key: process.env.TRELLO_KEY,
            token: trelloToken
        });

        const cardId = response.data.id;
        console.log(`Card created successfully with ID: ${cardId}`);
		
        const memberResponse = await axios.get(`https://api.trello.com/1/members/me`, {
            params: {
                key: process.env.TRELLO_KEY,
                token: trelloToken
            }
        });
        const memberId = memberResponse.data.id;
        console.log(`Retrieved memberID: ${memberId}`);
		
        await axios.post(`https://api.trello.com/1/cards/${cardId}/idMembers`, {
            value: memberId,
            key: process.env.TRELLO_KEY,
            token: trelloToken
        });
        console.log('Added member to the card.');
		
		await axios.post(`https://api.trello.com/1/cards/${cardId}/membersVoted`, {
			value: memberId,
			key: process.env.TRELLO_KEY,
			token: trelloToken
			});
		console.log('Voted on the card.');

        await axios.post(`https://api.trello.com/1/cards/${cardId}/labels`, {
            name: 'Owned by Greg',
            color: 'green',
            key: process.env.TRELLO_KEY,
            token: trelloToken
        });
        console.log("Label 'Owned by Greg' added to the card.");

        if (gameDetails.image) {
            await axios.post(`https://api.trello.com/1/cards/${cardId}/attachments`, {
                url: gameDetails.image,
                key: process.env.TRELLO_KEY,
                token: trelloToken
            });
            console.log('Cover image attached successfully.');
        }

        if (gameDetails.link) {
            await axios.post(`https://api.trello.com/1/cards/${cardId}/attachments`, {
                url: gameDetails.link,
                key: process.env.TRELLO_KEY,
                token: trelloToken
            });
            console.log('Game link attached successfully.');
        }
		
        if (videoLink) {
            await axios.post(`https://api.trello.com/1/cards/${cardId}/attachments`, {
                url: videoLink,
                key: process.env.TRELLO_KEY,
                token: trelloToken
            });
            console.log('Video link attached successfully.');
        }
    } catch (error) {
        console.error('Error creating Trello card:', error);
    }
}

/**
 * Function to get the instructional video link for a game by its BGG ID
 * @param {string} gameId - The BoardGameGeek game ID
 * @returns {Promise<string|null>} - The YouTube link to the instructional video or null if not found
 */
async function getInstructionalVideoLink(gameId) {
    try {
        // Request to BGG video API to retrieve video data
        const videoResponse = await axios.get(`https://api.geekdo.com/api/videos/overview`, {
            params: {
                objectid: gameId,
                objecttype: 'thing'
            }
        });

        // Access the instructional video directly
        const instructionalVideo = videoResponse.data.videos.instructional;
        if (instructionalVideo && instructionalVideo.videohost === "youtube" && instructionalVideo.extvideoid) {
            // Construct and return the YouTube link
            return `https://www.youtube.com/watch?v=${instructionalVideo.extvideoid}`;
        }

        // Return null if no instructional video is found
        return null;
    } catch (error) {
        console.error(`Failed to fetch instructional video for Game ID ${gameId}:`, error);
        return null;
    }
}



// Export the functions
module.exports = { createTrelloCard, getTrelloLists, getGameDetails};
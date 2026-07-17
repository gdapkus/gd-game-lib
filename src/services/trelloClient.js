// Client-side Trello integration. Calls the Trello REST API directly from the
// browser (Trello sends Access-Control-Allow-Origin: * on all endpoints), so
// this works with no backend present, e.g. on a static deploy.

const TRELLO_KEY = import.meta.env.VITE_TRELLO_KEY;
const TRELLO_BOARD_ID = import.meta.env.VITE_TRELLO_BOARD_ID;

async function fetchGameDetails (gameId) {
  const response = await fetch(`/gameCache/${gameId}.json`);
  if (!response.ok) {
    throw new Error(`Game details not found for game ID: ${gameId}`);
  }
  const cache = await response.json();
  return cache.gameDetails;
}

async function fetchBggUsers () {
  const response = await fetch('/bggUsers.json');
  return response.ok ? response.json() : [];
}

async function fetchCollection (username) {
  const sanitizedUsername = username.replace(/\s+/g, '_');
  const response = await fetch(`/gameCache/collectionCache_${sanitizedUsername}.json`);
  return response.ok ? response.json() : null;
}

async function trelloPost (path, token, body) {
  const response = await fetch(`https://api.trello.com/1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, key: TRELLO_KEY, token }),
  });
  if (!response.ok) {
    throw new Error(`Trello request failed: ${path}`);
  }
  return response.json();
}

export async function getTrelloLists (token) {
  const response = await fetch(
    `https://api.trello.com/1/boards/${TRELLO_BOARD_ID}/lists?key=${TRELLO_KEY}&token=${token}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch Trello lists');
  }
  const lists = await response.json();
  return lists.filter(list => list.name.startsWith('Want') || list.name === 'Dreamland');
}

export async function getTrelloMember (token) {
  const response = await fetch(
    `https://api.trello.com/1/members/me?key=${TRELLO_KEY}&token=${token}`
  );
  if (!response.ok) {
    throw new Error('Invalid Trello token');
  }
  return response.json();
}

export async function createTrelloCard (listId, gameId, token) {
  const gameDetails = await fetchGameDetails(gameId);

  const bestAtCount = Array.isArray(gameDetails.bestAtCount) && gameDetails.bestAtCount.length
    ? gameDetails.bestAtCount.join(', ')
    : null;
  const bestAtText = bestAtCount ? `, best:${bestAtCount}` : '';
  const cardTitle = `${gameDetails.name} (${gameDetails.minPlayers}-${gameDetails.maxPlayers}p${bestAtText})`;

  const card = await trelloPost('/cards', token, {
    name: cardTitle,
    desc: gameDetails.description,
    idList: listId,
  });

  const member = await getTrelloMember(token);
  await trelloPost(`/cards/${card.id}/idMembers`, token, { value: member.id });
  await trelloPost(`/cards/${card.id}/membersVoted`, token, { value: member.id });

  if (gameDetails.image) {
    await trelloPost(`/cards/${card.id}/attachments`, token, { url: gameDetails.image });
  }
  if (gameDetails.link) {
    await trelloPost(`/cards/${card.id}/attachments`, token, { url: gameDetails.link });
  }

  const bggUsers = await fetchBggUsers();
  for (const user of bggUsers) {
    const collection = await fetchCollection(user.username);
    if (!collection) continue;
    const owns = collection.games.some(g => g.id === gameId && g.status?.own);
    if (owns) {
      await trelloPost(`/cards/${card.id}/labels`, token, {
        name: `Owned by ${user.name}`,
        color: user.color,
      });
    }
  }

  return card;
}

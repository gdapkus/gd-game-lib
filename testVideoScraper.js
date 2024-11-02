const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeVideos(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const videos = [];
    $('.summary-video-item').each((index, element) => {
      const title = $(element).find('.summary-item-title a').text().trim();
      const thumbs = $(element).find('.summary-item-counts-item .fi-like').next().text().trim();
      
      videos.push({
        title: title,
        thumbs: parseInt(thumbs, 10) || 0, // Parses thumbs as an integer, defaulting to 0 if not found
      });

      // Log each video title and thumbs count
      console.log(`Video: ${title}, Thumbs: ${thumbs}`);
    });

    // Check if any videos were found
    if (videos.length === 0) {
      console.log({ message: 'No instructional videos found.' });
      return { message: 'No instructional videos found.' };
    }

    return videos;
  } catch (error) {
    console.error('Error scraping videos:', error);
    return { message: 'Error scraping videos' };
  }
}

// Test the function
scrapeVideos('https://boardgamegeek.com/boardgame/367966/videos/instructional')
  .then((videos) => {
    if (videos.message) {
      console.log(videos.message);
    } else {
      console.log('All videos found:', videos);
    }
  });

async function scrapeSavedLinks() {
    let posts = new Set();
    let lastHeight = document.body.scrollHeight;
    
    console.log("Starting collection scraping... Auto-scroll active.");
    
    while (true) {
        // Find all anchor tags pointing to posts or reels
        let anchors = document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]');
        anchors.forEach(a => posts.add(a.href));
        
        // Scroll down to the bottom of the page
        window.scrollTo(0, document.body.scrollHeight);
        
        // Wait 2 seconds for Instagram's server to load the next batch of items
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        let newHeight = document.body.scrollHeight;
        if (newHeight === lastHeight) {
            // Double check if it truly reached the bottom
            await new Promise(resolve => setTimeout(resolve, 3000));
            if (document.body.scrollHeight === lastHeight) {
                break; // Exit loop when no new content loads
            }
        }
        lastHeight = newHeight;
        console.log(`Found ${posts.size} unique video/post links so far...`);
    }
    
    const linksArray = Array.from(posts);
    console.log("Scraping complete! Total links found:", linksArray.length);
    
    // Automatically trigger a download of the text file containing all links
    const blob = new Blob([linksArray.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'instagram_saved_links.txt';
    a.click();
}

scrapeSavedLinks();
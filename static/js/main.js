document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "https://mnyah.onrender.com"; // Backend hosted on Render

    const fetchBtn = document.getElementById("fetch-playlist-btn");
    const playlistUrlInput = document.getElementById("playlist-url");
    const playlistSection = document.getElementById("playlist-section");
    const playlistCover = document.getElementById("playlist-cover");
    const playlistTitle = document.getElementById("playlist-title");
    const playlistCreator = document.getElementById("playlist-creator");
    const songList = document.getElementById("song-list");
    const downloadAllContainer = document.getElementById("download-all-container");
    const downloadAllBtn = document.getElementById("download-all-btn");
    const progressSection = document.getElementById("progress-section");
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");

    let songs = [];

    function fadeIn(el) {
        el.classList.remove("hidden");
        setTimeout(() => el.classList.add("visible"), 10);
    }
    function fadeOut(el) {
        el.classList.remove("visible");
        setTimeout(() => el.classList.add("hidden"), 400);
    }

    // Fetch Playlist
    fetchBtn.addEventListener("click", async () => {
        const url = playlistUrlInput.value.trim();
        if (!url) return alert("Please enter a playlist link");

        try {
            const res = await fetch(`${API_BASE}/get_playlist?url=${encodeURIComponent(url)}`);
            if (!res.ok) throw new Error("Failed to load playlist, make sure the link is valid, and the playlist is public.");

            const data = await res.json();
            songs = data.songs;

            playlistCover.src = data.cover || "static/images/default-cover.png";
            playlistTitle.textContent = data.title || "Unknown Playlist";
            playlistCreator.textContent = data.creator || "Unknown Creator";

            fadeIn(playlistSection);
            fadeIn(downloadAllContainer);
            fadeIn(songList);

            songList.innerHTML = "";
            songs.forEach((song, index) => {
                const songItem = document.createElement("div");
                songItem.className = "song-item";
                const displayTitle = song.artist ? `${song.title} - ${song.artist}` : song.title;
                songItem.innerHTML = `
                    <img src="${song.cover}" alt="Cover" class="song-cover">
                    <div class="song-title">${displayTitle}</div>
                `;
                songList.appendChild(songItem);
            });

            observeSongs();
        } catch (err) {
            console.error(err);
            alert("Failed to load playlist.");
        }
    });

    // Animate songs when visible
    function observeSongs() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                }
            });
        }, { threshold: 0.2 });
        document.querySelectorAll(".song-item").forEach(item => observer.observe(item));
    }

    // Download All
    downloadAllBtn.addEventListener("click", async () => {
        fadeOut(downloadAllContainer);
        setTimeout(() => fadeIn(progressSection), 400);

        progressBar.style.width = "0%";
        progressText.textContent = `Downloading – song (0/${songs.length})`;
        const detailedProgress = document.getElementById('detailed-progress');
        detailedProgress.textContent = "Starting downloads...";

        let completed = 0;
        for (let i = 0; i < songs.length; i++) {
            const song = songs[i];
            const displayTitle = song.title.length > 30 ? song.title.substring(0, 30) + '...' : song.title;
            progressText.textContent = `Downloading – ${displayTitle} (${i + 1}/${songs.length})`;

            try {
                detailedProgress.textContent = "🎵 Searching YouTube (using ISRC if available)...";

                const params = new URLSearchParams({ 
                    title: song.title, 
                    artist: song.artist || '', 
                    isrc: song.isrc || '' 
                });
                const response = await fetch(`${API_BASE}/download_song?${params}`);

                if (response.ok) {
                    detailedProgress.textContent = "✅ Download complete!";
                } else {
                    const error = await response.json();
                    detailedProgress.textContent = `❌ Failed: ${error.error || 'Unknown error'}`;
                    console.error(`Error downloading ${song.title}:`, error);
                }

                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err) {
                detailedProgress.textContent = `❌ Network error downloading ${displayTitle}`;
                console.error(`Error downloading ${song.title}:`, err);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            completed++;
            progressBar.style.width = `${(completed / songs.length) * 100}%`;
        }

        progressText.textContent = "All downloads complete! Creating ZIP...";
        detailedProgress.textContent = "📦 Packaging files into ZIP archive...";
        window.location.href = `${API_BASE}/download_all`;
    });

    // Single Song Download
    songList.addEventListener("click", async (e) => {
        if (e.target.classList.contains("song-download-btn")) {
            const index = e.target.dataset.index;
            const song = songs[index];
            e.target.textContent = "Downloading...";
            try {
                const params = new URLSearchParams({ 
                    title: song.title, 
                    artist: song.artist || '', 
                    isrc: song.isrc || '' 
                });
                const res = await fetch(`${API_BASE}/download_song?${params}`);
                e.target.textContent = res.ok ? "Downloaded" : "Error";
            } catch (err) {
                e.target.textContent = "Error";
            }
        }
    });
});

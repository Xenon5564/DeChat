import React from 'react';

export const embedProviders =[
    {
        name: 'YouTube',
        regex: /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
        render: (match) => {
            const videoId = match[1];
            return (
                <div className="mt-2" key={`yt-${videoId}`}>
                    <iframe 
                        width="400" 
                        height="225" 
                        src={`https://www.youtube.com/embed/${videoId}`} 
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        className="rounded-lg shadow-md"
                        border-radius="5"
                    ></iframe>
                </div>
            );
        }
    },
    {
        name: 'Spotify',
        regex: /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/i,
        render: (match) => {
            const trackId = match[1];
            return (
                <div className="mt-2" key={`spotify-${trackId}`}>
                    <iframe 
                        src={`https://open.spotify.com/embed/track/${trackId}`}
                        width="400" height="80" 
                        frameBorder="0" 
                        allowtransparency="true" 
                        allow="encrypted-media"
                    ></iframe>
                </div>
            );
        }
    },
    {
    name: 'Link',
    regex: /(https?:\/\/[^\s]+)/i, 
    render: (match) => {
        const url = match[0];
        return (
            <div className="mt-2" key={`link-${url}`}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                    {url}
                </a>
            </div>
        );
    }
} 
    
];

export default embedProviders;
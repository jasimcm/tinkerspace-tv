// Favourite apps shown first (in this order) when installed on the TV.
// IDs are Samsung Smart TV application IDs.
var FAVORITE_APPS = [
    { id: 'TnkSpace01.TinkerSpace', name: 'TinkerSpace', color: '#111111' },
    { id: '3201907018807', name: 'Netflix',      color: '#b20710' },
    { id: '111299001912',  name: 'YouTube',      color: '#cc0000' },
    { id: '3201910019365', name: 'Prime Video',  color: '#00a8e1' },
    { id: '3201901017640', name: 'Disney+',      color: '#0b3c8c' },
    { id: '3201606009684', name: 'Spotify',      color: '#1db954' },
    { id: '3201807016597', name: 'Apple TV',     color: '#333740' },
    { id: '3201512006963', name: 'Plex',         color: '#c88a00' },
    { id: 'org.tizen.browser', name: 'Internet', color: '#5a4fcf' }
];

// Apps that should never appear as tiles.
var HIDDEN_APP_PATTERNS = [/^TvHome0001\./, /^org\.tizen\.(homescreen|volume|setting-|.*-service)/];

var TILE_PALETTE = ['#3d5afe', '#7c4dff', '#00897b', '#e65100', '#ad1457', '#2e7d32', '#455a64', '#6d4c41'];

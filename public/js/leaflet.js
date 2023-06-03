
export const displayMap = locations => {
    const loc = locations[0].coordinates;
    let map = L.map('map').setView([loc[1], loc[0]], 8);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    map.zoomControl.remove();



    locations.map(loc => {
        L.marker([loc.coordinates[1], loc.coordinates[0]],
        {alt: 'Tours'}).addTo(map) 
        .bindPopup(
            L.popup({
                maxWidth: 250,
                minWidth: 100,
                className: `mapboxgl-popup-content`,
            })
        )
        .setPopupContent(
            `<div class="">${loc.day}: ${loc.description}<div/>`
        )
        ;
    })
}
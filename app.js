/*
 * CommuteGuard Pro application logic.
 * This script obtains the user’s current position using the Geolocation API,
 * geocodes the destination via a public OpenStreetMap-based API and computes
 * a driving route using OSRM. The resulting travel time is subtracted from
 * the desired arrival time to recommend a wake‑up time. Errors are
 * communicated back to the user via the result element.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('commuteForm');
  const resultElem = document.getElementById('result');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dest = document.getElementById('destination').value.trim();
    const arrival = document.getElementById('arrivalTime').value;

    resultElem.textContent = 'Calculating…';

    if (!dest) {
      resultElem.textContent = 'Please enter a destination.';
      return;
    }
    if (!arrival) {
      resultElem.textContent = 'Please choose your desired arrival time.';
      return;
    }
    // Check for geolocation support
    if (!('geolocation' in navigator)) {
      resultElem.textContent = 'Geolocation is not supported by your browser.';
      return;
    }

    // Get current position
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const startLat = pos.coords.latitude;
      const startLon = pos.coords.longitude;

      try {
        // Forward geocode the destination using a free, CORS‑enabled API
        const geoRes = await fetch(`https://geocode.maps.co/search?q=${encodeURIComponent(dest)}`);
        if (!geoRes.ok) throw new Error('Failed to geocode destination');
        const geoData = await geoRes.json();
        if (!geoData || geoData.length === 0) {
          resultElem.textContent = 'Destination not found.';
          return;
        }
        const destLat = geoData[0].lat;
        const destLon = geoData[0].lon;

        // Fetch route information from OSRM. This returns duration in seconds.
        const routeRes = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${destLon},${destLat}?overview=false`
        );
        if (!routeRes.ok) throw new Error('Failed to calculate route');
        const routeData = await routeRes.json();
        if (!routeData.routes || routeData.routes.length === 0) {
          resultElem.textContent = 'Could not calculate route.';
          return;
        }
        const travelSeconds = routeData.routes[0].duration;
        const travelMinutes = Math.ceil(travelSeconds / 60);

        // Parse the arrival time (HH:MM) into minutes past midnight
        const [arrH, arrM] = arrival.split(':').map(Number);
        const arrTotal = arrH * 60 + arrM;
        let wakeTotal = arrTotal - travelMinutes;
        // If the result is negative, assume the wake time is on the previous day
        while (wakeTotal < 0) wakeTotal += 24 * 60;
        const wakeH = Math.floor(wakeTotal / 60) % 24;
        const wakeM = wakeTotal % 60;
        const wakeTimeStr = `${String(wakeH).padStart(2, '0')}:${String(wakeM).padStart(2, '0')}`;

        resultElem.textContent =
          `Wake up at ${wakeTimeStr}. Estimated travel time: ${travelMinutes} minute${travelMinutes === 1 ? '' : 's'}.`;
      } catch (err) {
        console.error(err);
        resultElem.textContent = 'An error occurred while calculating your commute. Please try again.';
      }
    }, (err) => {
      // Handle geolocation errors
      switch (err.code) {
        case err.PERMISSION_DENIED:
          resultElem.textContent = 'Permission to access location was denied.';
          break;
        case err.POSITION_UNAVAILABLE:
          resultElem.textContent = 'Location information is unavailable.';
          break;
        case err.TIMEOUT:
          resultElem.textContent = 'The request to get your location timed out.';
          break;
        default:
          resultElem.textContent = 'An unknown error occurred while retrieving your location.';
      }
    });
  });
});

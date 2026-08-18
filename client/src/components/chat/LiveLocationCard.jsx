import {
  FaMapMarkerAlt,
  FaExternalLinkAlt,
} from "react-icons/fa";

function LiveLocationCard({
  latitude,
  longitude,
  active = true,
}) {
  const openGoogleMaps = () => {
    if (
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined
    ) {
      return;
    }

    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-white border shadow-md">

      {/* Map preview area */}
      <div className="relative h-40 bg-gray-200">

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center">

            <div className="relative">
              <span className="absolute inline-flex h-12 w-12 rounded-full bg-red-400 opacity-30 animate-ping" />

              <div className="relative w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg">
                <FaMapMarkerAlt size={22} />
              </div>
            </div>

            {latitude !== null && longitude !== null && (
              <span className="mt-2 text-xs bg-white px-2 py-1 rounded-lg shadow">
                Live location
              </span>
            )}

          </div>
        </div>

      </div>

      {/* Details */}
      <div className="p-4">

        <div className="flex items-center gap-2">

          <span
            className={`w-2.5 h-2.5 rounded-full ${
              active
                ? "bg-red-500 animate-pulse"
                : "bg-gray-400"
            }`}
          />

          <p className="font-semibold">
            {active
              ? "Live Location"
              : "Live Location Ended"}
          </p>

        </div>

        {latitude !== null &&
          latitude !== undefined &&
          longitude !== null &&
          longitude !== undefined ? (
          <>
            <p className="text-xs text-gray-500 mt-2">
              Location is updating in real-time
            </p>

            <button
              onClick={openGoogleMaps}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium transition"
            >
              <FaExternalLinkAlt size={13} />
              Open in Google Maps
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-500 mt-2">
            Waiting for location...
          </p>
        )}

      </div>
    </div>
  );
}

export default LiveLocationCard;
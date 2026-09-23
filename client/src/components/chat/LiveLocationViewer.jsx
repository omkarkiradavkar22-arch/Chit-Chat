import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  FaTimes,
  FaCrosshairs,
  FaLocationArrow,
} from "react-icons/fa";


// ========================================
// PROFILE PHOTO MARKER
// ========================================

const createProfileMarker = (profilePic, isMe = false) => {
  const fallback = isMe ? "ME" : "U";

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:50px;
        height:50px;
        border-radius:50%;
        background:#111827;
        border:3px solid #22c55e;
        box-shadow:0 3px 12px rgba(0,0,0,.45);
        overflow:hidden;
        display:flex;
        align-items:center;
        justify-content:center;
        color:white;
        font-size:11px;
        font-weight:700;
      ">
        ${
          profilePic
            ? `
              <img
                src="${profilePic}"
                style="
                  width:100%;
                  height:100%;
                  object-fit:cover;
                "
              />
            `
            : fallback
        }
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });
};


// ========================================
// AUTO FIT BOTH USERS
// ========================================

function FitLiveLocations({
  myLiveLocation,
  otherLiveLocation,
}) {
  const map = useMap();

  useEffect(() => {
    const points = [];

    if (
      myLiveLocation?.active &&
      myLiveLocation.latitude != null &&
      myLiveLocation.longitude != null
    ) {
      points.push([
        Number(myLiveLocation.latitude),
        Number(myLiveLocation.longitude),
      ]);
    }

    if (
      otherLiveLocation?.active &&
      otherLiveLocation.latitude != null &&
      otherLiveLocation.longitude != null
    ) {
      points.push([
        Number(otherLiveLocation.latitude),
        Number(otherLiveLocation.longitude),
      ]);
    }

    if (points.length === 2) {
      map.fitBounds(points, {
        padding: [70, 70],
        maxZoom: 16,
        animate: true,
      });
    } else if (points.length === 1) {
      map.flyTo(points[0], 16, {
        animate: true,
        duration: 0.7,
      });
    }
  }, [
    myLiveLocation?.latitude,
    myLiveLocation?.longitude,
    myLiveLocation?.active,
    otherLiveLocation?.latitude,
    otherLiveLocation?.longitude,
    otherLiveLocation?.active,
    map,
  ]);

  return null;
}


// ========================================
// RECENTER BUTTON
// ========================================

function RecenterButton({
  myLiveLocation,
  otherLiveLocation,
}) {
  const map = useMap();

  const handleRecenter = () => {
    const points = [];

    if (
      myLiveLocation?.active &&
      myLiveLocation.latitude != null &&
      myLiveLocation.longitude != null
    ) {
      points.push([
        Number(myLiveLocation.latitude),
        Number(myLiveLocation.longitude),
      ]);
    }

    if (
      otherLiveLocation?.active &&
      otherLiveLocation.latitude != null &&
      otherLiveLocation.longitude != null
    ) {
      points.push([
        Number(otherLiveLocation.latitude),
        Number(otherLiveLocation.longitude),
      ]);
    }

    if (points.length === 2) {
      map.fitBounds(points, {
        padding: [70, 70],
        maxZoom: 16,
        animate: true,
      });
    } else if (points.length === 1) {
      map.flyTo(points[0], 16, {
        animate: true,
        duration: 0.7,
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleRecenter}
      className="
        absolute
        right-4
        bottom-5
        z-[1000]

        w-11 h-11
        rounded-full

        bg-white
        dark:bg-gray-800

        text-gray-800
        dark:text-white

        shadow-lg

        flex
        items-center
        justify-center

        hover:bg-gray-100
        dark:hover:bg-gray-700
      "
      title="Show live locations"
    >
      <FaCrosshairs size={17} />
    </button>
  );
}


// ========================================
// MAIN COMPONENT
// ========================================

function LiveLocationViewer({
  myLiveLocation,
  otherLiveLocation,
  currentUser,
  otherUser,
  onClose,
}) {

  const myActive =
    myLiveLocation?.active &&
    myLiveLocation.latitude != null &&
    myLiveLocation.longitude != null;

  const otherActive =
    otherLiveLocation?.active &&
    otherLiveLocation.latitude != null &&
    otherLiveLocation.longitude != null;


  // No one is sharing anymore
  if (!myActive && !otherActive) {
    return null;
  }


  const initialLocation = myActive
    ? [
        Number(myLiveLocation.latitude),
        Number(myLiveLocation.longitude),
      ]
    : [
        Number(otherLiveLocation.latitude),
        Number(otherLiveLocation.longitude),
      ];


  const myMarkerIcon = useMemo(
    () =>
      createProfileMarker(
        currentUser?.profilePic,
        true
      ),
    [currentUser?.profilePic]
  );


  const otherMarkerIcon = useMemo(
    () =>
      createProfileMarker(
        otherUser?.profilePic,
        false
      ),
    [otherUser?.profilePic]
  );


  return (
    <div
      className="
        fixed inset-0
        z-[9999]

        flex flex-col

        bg-white
        dark:bg-gray-950
      "
    >

      {/* =========================
          HEADER
      ========================= */}

      <div
        className="
          h-16
          shrink-0

          px-4

          flex items-center
          justify-between

          bg-white
          dark:bg-gray-900

          border-b
          border-gray-200
          dark:border-gray-700
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              w-10 h-10
              rounded-full

              bg-green-100
              dark:bg-green-500/15

              flex items-center
              justify-center
            "
          >
            <FaLocationArrow
              size={17}
              className="text-green-500"
            />
          </div>


          <div>

            <div className="flex items-center gap-2">

              <p
                className="
                  font-semibold
                  text-gray-900
                  dark:text-white
                "
              >
                Live Location
              </p>

              <span
                className="
                  px-2 py-0.5
                  rounded-full

                  bg-green-500
                  text-white

                  text-[10px]
                  font-bold
                "
              >
                LIVE
              </span>

            </div>


            <p
              className="
                text-xs
                text-gray-500
                dark:text-gray-400
              "
            >
              {myActive && otherActive
                ? "2 people sharing live location"
                : "1 person sharing live location"}
            </p>

          </div>

        </div>


        <button
          type="button"
          onClick={onClose}
          className="
            w-10 h-10
            rounded-full

            flex
            items-center
            justify-center

            text-gray-600
            dark:text-gray-300

            hover:bg-gray-100
            dark:hover:bg-gray-800
          "
        >
          <FaTimes size={18} />
        </button>

      </div>


      {/* =========================
          MAP
      ========================= */}

      <div className="relative flex-1 min-h-0">

        <MapContainer
          center={initialLocation}
          zoom={16}
          scrollWheelZoom={true}
          zoomControl={true}
          className="w-full h-full"
        >

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />


          {/* MY MARKER */}

          {myActive && (
            <Marker
              position={[
                Number(myLiveLocation.latitude),
                Number(myLiveLocation.longitude),
              ]}
              icon={myMarkerIcon}
            />
          )}


          {/* OTHER USER MARKER */}

          {otherActive && (
            <Marker
              position={[
                Number(otherLiveLocation.latitude),
                Number(otherLiveLocation.longitude),
              ]}
              icon={otherMarkerIcon}
            />
          )}


          <FitLiveLocations
            myLiveLocation={myLiveLocation}
            otherLiveLocation={otherLiveLocation}
          />


          <RecenterButton
            myLiveLocation={myLiveLocation}
            otherLiveLocation={otherLiveLocation}
          />

        </MapContainer>

      </div>


      {/* =========================
          BOTTOM USERS
      ========================= */}

      <div
        className="
          shrink-0

          bg-white
          dark:bg-gray-900

          border-t
          border-gray-200
          dark:border-gray-700
        "
      >

        {/* MY LOCATION */}

        {myActive && (
          <div
            className="
              px-4 py-3

              flex
              items-center
              gap-3

              border-b
              border-gray-200
              dark:border-gray-700
            "
          >

            {currentUser?.profilePic ? (
              <img
                src={currentUser.profilePic}
                alt={currentUser?.name || "You"}
                className="
                  w-10 h-10
                  rounded-full
                  object-cover
                "
              />
            ) : (
              <div
                className="
                  w-10 h-10
                  rounded-full

                  bg-green-100
                  dark:bg-green-500/15

                  flex
                  items-center
                  justify-center
                "
              >
                <FaLocationArrow
                  className="text-green-500"
                />
              </div>
            )}


            <div className="flex-1 min-w-0">

              <p
                className="
                  text-sm
                  font-semibold

                  text-gray-900
                  dark:text-white
                "
              >
                You
              </p>

              <div className="flex items-center gap-1.5">

                <span
                  className="
                    w-2 h-2
                    rounded-full
                    bg-green-500
                  "
                />

                <p
                  className="
                    text-xs
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  Sharing live location
                </p>

              </div>

            </div>

          </div>
        )}


        {/* OTHER USER */}

        {otherActive && (
          <div
            className="
              px-4 py-3

              flex
              items-center
              gap-3
            "
          >

            {otherUser?.profilePic ? (
              <img
                src={otherUser.profilePic}
                alt={otherUser?.name || "User"}
                className="
                  w-10 h-10
                  rounded-full
                  object-cover
                "
              />
            ) : (
              <div
                className="
                  w-10 h-10
                  rounded-full

                  bg-green-100
                  dark:bg-green-500/15

                  flex
                  items-center
                  justify-center
                "
              >
                <FaLocationArrow
                  className="text-green-500"
                />
              </div>
            )}


            <div className="flex-1 min-w-0">

              <p
                className="
                  text-sm
                  font-semibold

                  text-gray-900
                  dark:text-white

                  truncate
                "
              >
                {otherUser?.name || "User"}
              </p>

              <div className="flex items-center gap-1.5">

                <span
                  className="
                    w-2 h-2
                    rounded-full
                    bg-green-500
                  "
                />

                <p
                  className="
                    text-xs
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  Updated just now
                </p>

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}

export default LiveLocationViewer;

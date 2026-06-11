import React from "react";
import { SettingsIcon } from "../assets/icons";
import { POLL_INTERVAL_MS } from "../App";

interface IProps {
  setShowInfo: (show: boolean) => void;
}

const InfoDialog: React.FC<IProps> = ({ setShowInfo }) => {
  return (
    <div
      className="dialog-overlay info-overlay"
      onClick={() => setShowInfo(false)}
    >
      <div className="dialog info-dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="info-title">About Flight Radar</h2>

        <div className="info-body">
          <p>
            Flight Radar is a simple live aircraft tracking tool that displays
            flights within a configurable radius of any location on a
            radar-style map.
          </p>
          <p>
            <span className="info-green">Green</span> icons represent aircraft
            within the radar's range. <span className="info-red">Red</span>{" "}
            icons represent stationary aircraft on the ground.
          </p>
          <p>
            Aircraft are plotted in real time with their callsign, heading, and
            altitude. Click on any aircraft to track it and see its flight
            trail. Open the settings icon{" "}
            <SettingsIcon className="info-settings-icon" /> to change the centre
            location and radar radius.
          </p>
          <hr className="info-divider" />
          <h3 className="info-heading">Data sources</h3>
          <p>
            Flight data is provided by{" "}
            <a
              href="https://airplanes.live"
              target="_blank"
              rel="noopener noreferrer"
              className="info-link"
            >
              airplanes.live
            </a>
            . Data is refreshed every {POLL_INTERVAL_MS / 1000} seconds.
          </p>
          <p>
            Coastline geometry is from{" "}
            <a
              href="https://github.com/nvkelso/natural-earth-vector/"
              target="_blank"
              rel="noopener noreferrer"
              className="info-link"
            >
              Natural Earth
            </a>
            .
          </p>
          <p>
            Route information is available for each flight by clicking on the
            aircraft icon. Data is fetched from{" "}
            <a
              href="https://www.adsbdb.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="info-link"
            >
              www.adsbdb.com/
            </a>
            .
          </p>
          <hr className="info-divider" />
          <p>
            This project is open source and built for fun, without any
            commercial intent. It is not affiliated with any airline or aviation
            authority.
          </p>
          <p>
            Source code can be found on{" "}
            <a
              href="https://github.com/nakkim/planes-radar"
              target="_blank"
              rel="noopener noreferrer"
              className="info-link"
            >
              GitHub
            </a>
          </p>
        </div>

        <div className="dialog-actions">
          <button className="radar-btn" onClick={() => setShowInfo(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoDialog;

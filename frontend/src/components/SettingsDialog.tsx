import React from "react";
import "../App.css";
import { SettingsIcon } from "../assets/icons";

interface IProps {
  locate: () => void;
  locating: boolean;
  geoError: string | null;
  draftLat: string;
  draftLon: string;
  draftRadius: number;
  setDraftLat: (lat: string) => void;
  setDraftLon: (lon: string) => void;
  setDraftRadius: (radius: number) => void;
  setShowSettings: (show: boolean) => void;
  applySettings: () => void;
}

const SettingsDialog: React.FC<IProps> = ({
  locate,
  locating,
  geoError,
  draftLat,
  draftLon,
  draftRadius,
  setDraftLat,
  setDraftLon,
  setDraftRadius,
  setShowSettings,
  applySettings,
}) => {
  return (
    <div className="dialog-overlay" onClick={() => setShowSettings(false)}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2>
          <SettingsIcon width="1.05rem" height="1.05rem" /> Settings
        </h2>

        <div className="dialog-section">
          <button
            className="radar-btn locate-btn"
            onClick={locate}
            disabled={locating}
          >
            {locating ? "⟳ Locating…" : "◎ Use My Location"}
          </button>
        </div>

        <div className="dialog-section">
          <label>Latitude</label>
          <input
            className="radar-input"
            type="number"
            value={draftLat}
            onChange={(e) => setDraftLat(e.target.value)}
            step="0.0001"
          />
          <label>Longitude</label>
          <input
            className="radar-input"
            type="number"
            value={draftLon}
            onChange={(e) => setDraftLon(e.target.value)}
            step="0.0001"
          />
        </div>

        <div className="dialog-section">
          <label>
            Radius: <span className="radius-value">{draftRadius} km</span>
          </label>
          <input
            className="radar-slider"
            type="range"
            min={10}
            max={250}
            value={draftRadius}
            onChange={(e) => setDraftRadius(Number(e.target.value))}
          />
          <div className="slider-labels">
            <span>10 km</span>
            <span>250 km</span>
          </div>
        </div>

        {geoError && <p className="error dialog-error">{geoError}</p>}

        <div className="dialog-actions">
          <button className="radar-btn" onClick={() => setShowSettings(false)}>
            Cancel
          </button>
          <button
            className="radar-btn radar-btn-primary"
            onClick={applySettings}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;

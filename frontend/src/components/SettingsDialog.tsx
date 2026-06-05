import React from "react";
import type { CSSProperties } from "react";
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
  settings: {
    lat: number;
    lon: number;
    radius: number;
  };
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 300,
  },
  dialog: {
    background: "#020f02",
    border: "1px solid #00cc44",
    padding: "28px 32px",
    minWidth: "320px",
    maxWidth: "90vw",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    boxShadow: "0 0 40px rgba(0, 200, 0, 0.2)",
  },
  title: {
    fontSize: "1.05rem",
    color: "#00ff66",
    letterSpacing: "2px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "0.78rem",
    color: "rgba(0, 200, 60, 0.75)",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  radiusValue: {
    color: "#00ff66",
    textTransform: "none",
    letterSpacing: 0,
  },
  input: {
    background: "rgba(0, 30, 0, 0.85)",
    border: "1px solid rgba(0, 180, 0, 0.45)",
    color: "#00ff66",
    fontFamily: "monospace",
    fontSize: "0.9rem",
    padding: "7px 10px",
    outline: "none",
    width: "100%",
  },
  slider: {
    width: "100%",
    accentColor: "#00ff44",
    cursor: "pointer",
    height: "4px",
  },
  sliderLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.7rem",
    color: "rgba(0, 180, 0, 0.55)",
  },
  button: {
    background: "rgba(0, 40, 0, 0.85)",
    border: "1px solid #00b4008c",
    color: "#00ee44",
    fontFamily: "monospace",
    fontSize: "0.85rem",
    padding: "8px 18px",
    cursor: "pointer",
    transition:
      "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
  },
  buttonHover: {
    background: "rgba(0, 80, 0, 0.95)",
    border: "1px solid #00ff66",
    color: "#00ff66",
  },
  primaryButton: {
    borderColor: "#00cc44",
    color: "#00ff66",
  },
  primaryButtonHover: {
    background: "rgba(0, 120, 0, 0.95)",
  },
  locateButton: {
    alignSelf: "flex-start",
    border: "1px solid #00b4008c",
    fontSize: "0.9rem",
    padding: "9px 20px",
    letterSpacing: "1px",
  },
  buttonDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  error: {
    fontSize: "0.8rem",
    color: "#ff4444",
  },
};

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
  const [isLocateHovered, setIsLocateHovered] = React.useState(false);
  const [isCancelHovered, setIsCancelHovered] = React.useState(false);
  const [isApplyHovered, setIsApplyHovered] = React.useState(false);

  return (
    <div style={styles.overlay} onClick={() => setShowSettings(false)}>
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>
          <SettingsIcon width="1.05rem" height="1.05rem" /> Settings
        </h2>

        <div style={styles.section}>
          <button
            style={{
              ...styles.button,
              ...styles.locateButton,
              ...(isLocateHovered && !locating ? styles.buttonHover : {}),
              ...(locating ? styles.buttonDisabled : {}),
            }}
            onClick={locate}
            onMouseEnter={() => setIsLocateHovered(true)}
            onMouseLeave={() => setIsLocateHovered(false)}
            disabled={locating}
          >
            {locating ? "⟳ Locating…" : "◎ Use My Location"}
          </button>
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Latitude</label>
          <input
            style={styles.input}
            type="number"
            value={draftLat}
            onChange={(e) => setDraftLat(e.target.value)}
            step="0.0001"
          />
          <label style={styles.label}>Longitude</label>
          <input
            style={styles.input}
            type="number"
            value={draftLon}
            onChange={(e) => setDraftLon(e.target.value)}
            step="0.0001"
          />
        </div>

        <div style={styles.section}>
          <label style={styles.label}>
            Radius: <span style={styles.radiusValue}>{draftRadius} km</span>
          </label>
          <input
            style={styles.slider}
            type="range"
            min={10}
            max={250}
            value={draftRadius}
            onChange={(e) => setDraftRadius(Number(e.target.value))}
          />
          <div style={styles.sliderLabels}>
            <span>10 km</span>
            <span>250 km</span>
          </div>
        </div>

        {geoError && <p style={styles.error}>{geoError}</p>}

        <div style={styles.actions}>
          <button
            style={{
              ...styles.button,
              ...(isCancelHovered ? styles.buttonHover : {}),
            }}
            onMouseEnter={() => setIsCancelHovered(true)}
            onMouseLeave={() => setIsCancelHovered(false)}
            onClick={() => setShowSettings(false)}
          >
            Cancel
          </button>
          <button
            style={{
              ...styles.button,
              ...styles.primaryButton,
              ...(isApplyHovered ? styles.buttonHover : {}),
              ...(isApplyHovered ? styles.primaryButtonHover : {}),
            }}
            onMouseEnter={() => setIsApplyHovered(true)}
            onMouseLeave={() => setIsApplyHovered(false)}
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

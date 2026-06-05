import React from "react";
import type { CSSProperties } from "react";

interface IProps {
  setShowInfo: (show: boolean) => void;
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
    maxWidth: "480px",
    width: "90vw",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow: "0 0 40px rgba(0, 200, 0, 0.2)",
  },
  title: {
    fontSize: "1.05rem",
    color: "#00ff66",
    letterSpacing: "2px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: 0,
  },
  body: {
    color: "rgba(0, 220, 80, 0.85)",
    fontSize: "0.88rem",
    lineHeight: "1.65",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  p: {
    margin: 0,
  },
  link: {
    color: "#00ff66",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  },
  divider: {
    borderColor: "rgba(0, 180, 0, 0.25)",
    borderStyle: "solid",
    borderWidth: "0 0 1px 0",
    margin: "4px 0",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
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
};

const InfoDialog: React.FC<IProps> = ({ setShowInfo }) => {
  const [isCloseHovered, setIsCloseHovered] = React.useState(false);

  return (
    <div style={styles.overlay} onClick={() => setShowInfo(false)}>
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>ℹ About Planes Radar</h2>

        <div style={styles.body}>
          <p style={styles.p}>
            Planes Radar is a simple live aircraft tracking tool that displays
            flights within a configurable radius of any location on a
            radar-style map.
          </p>
          <p style={styles.p}>
            Aircraft are plotted in real time with their callsign, heading, and
            altitude. Click on any aircraft to track it and see its flight
            trail. Use the ⚙ settings to change the centre location and radar
            radius.
          </p>
          <hr style={styles.divider} />
          <p style={styles.p}>
            <strong style={{ color: "#00ff66" }}>Data source:</strong> Flight
            data is provided by{" "}
            <a
              href="https://airplanes.live"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              airplanes.live
            </a>
            , a community-driven ADS-B aggregator network. Data is refreshed
            every 5 seconds.
          </p>
          <p style={styles.p}>
            Coastline geometry is from{" "}
            <a
              href="https://github.com/nvkelso/natural-earth-vector/"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              Natural Earth
            </a>
            .
          </p>
          <p>
            Source code can be found on{" "}
            <a
              href="https://github.com/nakkim/planes-radar"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              GitHub
            </a>
          </p>
        </div>

        <div style={styles.actions}>
          <button
            style={{
              ...styles.button,
              ...(isCloseHovered ? styles.buttonHover : {}),
            }}
            onMouseEnter={() => setIsCloseHovered(true)}
            onMouseLeave={() => setIsCloseHovered(false)}
            onClick={() => setShowInfo(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoDialog;

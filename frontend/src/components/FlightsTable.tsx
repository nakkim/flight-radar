import type { CSSProperties } from "react";
import type { Flight } from "../App";

interface IProps {
  flights: Flight[];
  hovered: Flight | null;
  selected: Flight | null;
  setHovered: (flight: Flight | null) => void;
  setSelected: (flight: Flight | null) => void;
}

const styles: Record<string, CSSProperties> = {
  table: {
    borderCollapse: "collapse",
    width: "100%",
    maxWidth: "700px",
    fontSize: "0.8rem",
  },
  headerCell: {
    border: "1px solid rgba(0, 150, 0, 0.3)",
    padding: "6px 10px",
    textAlign: "left",
    color: "#00ff66",
    background: "rgba(0, 60, 0, 0.5)",
  },
  bodyCell: {
    border: "1px solid rgba(0, 150, 0, 0.3)",
    padding: "6px 10px",
    textAlign: "left",
  },
  row: {
    cursor: "pointer",
  },
  activeRow: {
    background: "rgba(0, 100, 0, 0.3)",
  },
};

const FlightsTable: React.FC<IProps> = ({
  flights,
  hovered,
  selected,
  setHovered,
  setSelected,
}) => {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.headerCell}>Flight</th>
          <th style={styles.headerCell}>Reg</th>
          <th style={styles.headerCell}>Type</th>
          <th style={styles.headerCell}>Distance</th>
          <th style={styles.headerCell}>Heading</th>
          <th style={styles.headerCell}>Bearing</th>
        </tr>
      </thead>
      <tbody>
        {flights.map((f) => (
          <tr
            key={f.r}
            style={{
              ...styles.row,
              ...(selected?.r === f.r || hovered?.r === f.r
                ? styles.activeRow
                : {}),
            }}
            onMouseEnter={() => setHovered(f)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setSelected(selected?.r === f.r ? null : f)}
          >
            <td style={styles.bodyCell}>{f.flight || "—"}</td>
            <td style={styles.bodyCell}>{f.r || "—"}</td>
            <td style={styles.bodyCell}>{f.desc || "—"}</td>
            <td style={styles.bodyCell}>{f.distance} km</td>
            <td style={styles.bodyCell}>{f.true_heading ?? f.track}°</td>
            <td style={styles.bodyCell}>{f.heading}°</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default FlightsTable;

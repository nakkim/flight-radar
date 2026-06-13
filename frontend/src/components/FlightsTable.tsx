import type { Flight } from "../types/types";
import { getVerticalTrend } from "../utils/utils";

interface IProps {
  flights: Flight[];
  hovered: Flight | null;
  selected: Flight | null;
  setHovered: (flight: Flight | null) => void;
  setSelected: (flight: Flight | null) => void;
}

const FlightsTable: React.FC<IProps> = ({
  flights,
  hovered,
  selected,
  setHovered,
  setSelected,
}) => {
  return (
    <table className="flight-table">
      <thead>
        <tr>
          <th>Flight</th>
          <th>Reg</th>
          <th>Type</th>
          <th>Distance</th>
          <th>Altitude</th>
        </tr>
      </thead>
      <tbody>
        {flights.map((f) => (
          <tr
            key={f.r}
            className={
              selected?.r === f.r || hovered?.r === f.r ? "active" : ""
            }
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHovered(f)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setSelected(selected?.r === f.r ? null : f)}
          >
            <td>{f.flight || "—"}</td>
            <td>{f.r || "—"}</td>
            <td>{f.desc || "—"}</td>
            <td>{f.distance} km</td>
            <td>
              {f.alt_baro === "ground"
                ? "ground"
                : getVerticalTrend(Number(f.baro_rate)) + `${f.alt_baro} ft`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default FlightsTable;

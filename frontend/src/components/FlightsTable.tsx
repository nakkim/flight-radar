import type { Flight } from "../App";

interface IProps {
  flights: Flight[];
  hovered: Flight | null;
  setHovered: (flight: Flight | null) => void;
}

const FlightsTable: React.FC<IProps> = ({ flights, hovered, setHovered }) => {
  return (
    <table className="flight-table">
      <thead>
        <tr>
          <th>Flight</th>
          <th>Reg</th>
          <th>Type</th>
          <th>Distance</th>
          <th>Heading</th>
          <th>Bearing</th>
        </tr>
      </thead>
      <tbody>
        {flights.map((f) => (
          <tr
            key={f.r}
            className={hovered?.r === f.r ? "active" : ""}
            onMouseEnter={() => setHovered(f)}
            onMouseLeave={() => setHovered(null)}
          >
            <td>{f.flight || "—"}</td>
            <td>{f.r || "—"}</td>
            <td>{f.desc || "—"}</td>
            <td>{f.distance} km</td>
            <td>{f.true_heading ?? f.track}°</td>
            <td>{f.heading}°</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default FlightsTable;

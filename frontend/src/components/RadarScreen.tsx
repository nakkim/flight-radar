import type { Flight } from "../App";
import type { FlightRoute } from "../App";
import { decodeHTMLEntities, getVerticalTrend } from "../utils/utils";

interface IProps {
  hovered: Flight | null;
  hoveredPos: { x: number; y: number } | null;
  hoveredRoute: FlightRoute | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void;
  handleCanvasClick: (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => void;
  setHovered: (flight: Flight | null) => void;
  setHoveredPos: (pos: { x: number; y: number } | null) => void;
  CANVAS_SIZE: number;
}

const RadarScreen: React.FC<IProps> = ({
  hovered,
  hoveredPos,
  hoveredRoute,
  canvasRef,
  handleMouseMove,
  handleCanvasClick,
  setHovered,
  setHoveredPos,
  CANVAS_SIZE,
}) => {
  return (
    <div className="radar-wrap">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ cursor: hovered ? "pointer" : "default" }}
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
        onMouseLeave={() => {
          setHovered(null);
          setHoveredPos(null);
        }}
      />
      {hovered &&
        hoveredPos &&
        (() => {
          const offset = 12;
          const onRight = hoveredPos.x <= CANVAS_SIZE / 2;
          const baroRate = Number(hovered.baro_rate);
          const verticalTrend =
            Number.isFinite(baroRate) &&
            baroRate > 0 &&
            Math.abs(baroRate) > 100
              ? "▲ "
              : Number.isFinite(baroRate) &&
                baroRate < 0 &&
                Math.abs(baroRate) > 100
              ? "▼ "
              : "";
          return (
            <div
              className="tooltip"
              style={{
                ...(onRight
                  ? {
                      left: hoveredPos.x + offset,
                      top: hoveredPos.y - offset,
                    }
                  : {
                      right: CANVAS_SIZE - hoveredPos.x + offset,
                      top: hoveredPos.y - offset,
                    }),
              }}
            >
              <strong>{hovered.flight || "—"}</strong>
              <br />
              {hovered.r || "—"}
              <br />
              {hovered.desc || "—"}
              <br />
              Origin:{" "}
              {hoveredRoute && hoveredRoute.origin ? (
                <>{hoveredRoute.origin}</>
              ) : (
                "-"
              )}
              <br />
              Destination:{" "}
              {hoveredRoute && hoveredRoute.destination ? (
                <>{hoveredRoute.destination}</>
              ) : (
                "-"
              )}
              <br />
              Route:{" "}
              {hoveredRoute &&
              hoveredRoute.routeText &&
              hoveredRoute.origin &&
              hoveredRoute.destination ? (
                <>{decodeHTMLEntities(hoveredRoute.routeText)}</>
              ) : (
                "-"
              )}
              <br />
              Altitude:{" "}
              {hovered.alt_baro === "ground"
                ? "ground"
                : getVerticalTrend(Number(hovered.baro_rate)) +
                  `${hovered.alt_baro} ft`}
              <br />
              IAS: {hovered.ias ?? "—"} {hovered.ias ? "kt" : ""} <br />
              TAS: {hovered.tas ?? "—"} {hovered.tas ? "kt" : ""} <br />
              Distance: {hovered.distance ?? "—"} {hovered.distance ? "km" : ""}{" "}
              <br />
              Bearing: {hovered.heading ?? "—"}
              {hovered.heading ? "°" : ""} <br />
            </div>
          );
        })()}
    </div>
  );
};

export default RadarScreen;

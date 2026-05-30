import type { Flight } from "../App";

interface IProps {
  hovered: Flight | null;
  hoveredPos: { x: number; y: number } | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void;
  setHovered: (flight: Flight | null) => void;
  setHoveredPos: (pos: { x: number; y: number } | null) => void;
  CANVAS_SIZE: number;
}

const RadarScreen: React.FC<IProps> = ({
  hovered,
  hoveredPos,
  canvasRef,
  handleMouseMove,
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
        onMouseMove={handleMouseMove}
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
            Number.isFinite(baroRate) && baroRate > 0
              ? "▲ "
              : Number.isFinite(baroRate) && baroRate < 0
              ? "▼ "
              : "";
          return (
            <div
              className="tooltip"
              style={
                onRight
                  ? {
                      left: hoveredPos.x + offset,
                      top: hoveredPos.y - offset,
                    }
                  : {
                      right: CANVAS_SIZE - hoveredPos.x + offset,
                      top: hoveredPos.y - offset,
                    }
              }
            >
              <strong>{hovered.flight || "—"}</strong>
              <br />
              {hovered.r || "—"}
              <br />
              {hovered.desc || "—"}
              <br />
              Altitude: {verticalTrend}
              {hovered.alt_baro} ft
              <br />
              IAS: {hovered.ias} kt <br />
              TAS: {hovered.tas} kt <br />
              Distance: {hovered.distance} km <br />
              Bearing: {hovered.heading}°
            </div>
          );
        })()}
    </div>
  );
};

export default RadarScreen;

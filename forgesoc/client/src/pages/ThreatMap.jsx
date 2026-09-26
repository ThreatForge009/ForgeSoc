import { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

// HQ coordinate
const HQ_LAT = 39.9;
const HQ_LNG = -75.2;

const SEVERITY_COLOR = {
  CRITICAL: '#ff4d5e',
  HIGH: '#ff9f43',
  MEDIUM: '#f5d547',
  LOW: '#4c9ef1',
  INFO: '#5a7185',
};

const ipToLatLng = (ip) => {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = (hash << 5) - hash + ip.charCodeAt(i);
    hash |= 0;
  }
  const lat = ((Math.abs(hash) % 1000) / 1000) * 140 - 70;
  const lng = ((Math.abs(hash * 31) % 1000) / 1000) * 360 - 180;
  return { lat, lng };
};

const ThreatMap = () => {
  const globeEl = useRef();
  const [alerts, setAlerts] = useState([]);
  const [geoMap, setGeoMap] = useState({});
  const [arcsData, setArcsData] = useState([]);
  const [ringsData, setRingsData] = useState([]);
  const socketCtx = useSocket();

  useEffect(() => {
    // Initial fetch
    api.get('/alerts', { params: { limit: 40 } }).then((res) => {
      const withIp = res.data.alerts.filter((a) => a.sourceIp);
      setAlerts(withIp);

      const ips = [...new Set(withIp.map((a) => a.sourceIp))];
      if (ips.length) {
        api.get('/geo/batch', { params: { ips: ips.join(',') } }).then((geoRes) => setGeoMap(geoRes.data));
      }
    });
  }, []);

  useEffect(() => {
    const socket = socketCtx?.socket;
    if (!socket) return undefined;
    const onNew = (alert) => {
      if (!alert.sourceIp) return;
      setAlerts((prev) => [alert, ...prev].slice(0, 60));
      api.get('/geo/batch', { params: { ips: alert.sourceIp } }).then((geoRes) =>
        setGeoMap((prev) => ({ ...prev, ...geoRes.data }))
      );
    };
    socket.on('alert:new', onNew);
    return () => socket.off('alert:new', onNew);
  }, [socketCtx?.socket]);

  useEffect(() => {
    // Compute arcs and rings
    const newArcs = [];
    const newRings = [{ lat: HQ_LAT, lng: HQ_LNG, color: '#3fe0c5', maxR: 5 }]; // HQ ring
    
    alerts.forEach((alert) => {
      const real = geoMap[alert.sourceIp];
      const { lat, lng } = real ? { lat: real.lat, lng: real.lng } : ipToLatLng(alert.sourceIp);
      const color = SEVERITY_COLOR[alert.severity] || '#5a7185';
      
      newArcs.push({
        startLat: lat,
        startLng: lng,
        endLat: HQ_LAT,
        endLng: HQ_LNG,
        color: color,
        severity: alert.severity,
        ip: alert.sourceIp,
      });

      newRings.push({
        lat,
        lng,
        color,
        maxR: alert.severity === 'CRITICAL' ? 3 : 1.5,
      });
    });

    setArcsData(newArcs);
    setRingsData(newRings);
  }, [alerts, geoMap]);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.pointOfView({ lat: 30, lng: -40, altitude: 2.2 }, 1000);
    }
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full relative">
      <div className="z-10 absolute top-6 left-6 bg-[#0f1620]/60 p-6 rounded-xl backdrop-blur-xl border border-[#3fe0c5]/30 shadow-[0_0_30px_rgba(63,224,197,0.15)] pointer-events-none">
        <h2 className="font-mono text-xl text-[#3fe0c5] font-bold mb-2 tracking-wider uppercase text-shadow-glow">Live Threat Map</h2>
        <p className="text-xs text-[#c9d6e3]/80 max-w-[280px] leading-relaxed">
          Real-time global attack vectors mapped against HQ. Satellite imagery with active connection streams.
        </p>
        <div className="mt-5 flex flex-col gap-2.5 font-mono text-[11px] tracking-widest uppercase">
          {Object.entries(SEVERITY_COLOR).map(([sev, hex]) => (
            <div key={sev} className="flex items-center gap-3 text-forge-text font-semibold">
              <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: hex, color: hex }} />
              <span style={{ color: hex, textShadow: `0 0 10px ${hex}` }}>{sev}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 text-sm font-mono font-bold text-forge-accent text-shadow-glow">
          {alerts.length} ACTIVE THREATS
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-[600px] rounded-xl overflow-hidden border border-forge-border/30 relative shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0a0e14]/40 to-[#0a0e14] pointer-events-none z-10" />
        <Globe
          ref={globeEl}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="#000000"
          arcsData={arcsData}
          arcStartLat={d => d.startLat}
          arcStartLng={d => d.startLng}
          arcEndLat={d => d.endLat}
          arcEndLng={d => d.endLng}
          arcColor={d => d.color}
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={1500}
          arcAltitudeAutoScale={0.3}
          arcStroke={0.5}
          
          ringsData={ringsData}
          ringColor={d => d.color}
          ringMaxRadius={d => d.maxR}
          ringPropagationSpeed={3}
          ringRepeatPeriod={1000}
        />
      </div>
    </div>
  );
};

export default ThreatMap;

import React from 'react';
import ComingSoon from '../../components/ComingSoon';

export default function Geofencing() {
  return <ComingSoon title="Geo-fencing" />;
}

// ----------------------------------------------------
// Sub-Page 1: Geo Dashboard with Interactive Vector Map
// ----------------------------------------------------
function GeoDashboard() {
  const { selectedClientId, agency, forceRefresh } = useApp();
  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  
  // Zone editor states
  const [radius, setRadius] = useState(300);
  const [zoneName, setZoneName] = useState('New Indiranagar Zone');
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (selectedClientId) {
      loadZones(selectedClientId);
    }
  }, [selectedClientId]);

  const loadZones = async (clientId) => {
    const { data } = await supabase.from('geo_fence_zones').eq('client_id', clientId);
    setZones(data || []);
    if (data && data.length > 0) {
      setSelectedZoneId(data[0].id);
      setRadius(data[0].radius_meters || 300);
      setZoneName(data[0].name || '');
    }
  };

  const handleToggleZone = async (zoneId, activeState) => {
    const list = JSON.parse(localStorage.getItem('db_geo_fence_zones') || '[]');
    const updated = list.map(z => z.id === zoneId ? { ...z, is_active: !activeState } : z);
    localStorage.setItem('db_geo_fence_zones', JSON.stringify(updated));
    window.dispatchEvent(new Event('local_db_change'));
    loadZones(selectedClientId);
  };

  const handleSaveNewZone = async () => {
    try {
      const newZone = {
        client_id: selectedClientId || 'cli_kovai_id',
        agency_id: agency?.id || 'age_default_id',
        name: zoneName,
        zone_type: 'radius',
        center_lat: 12.97189 + (Math.random() - 0.5) * 0.01,
        center_lng: 77.64115 + (Math.random() - 0.5) * 0.01,
        radius_meters: radius,
        address: '100 Feet Road Sector, Indiranagar',
        color: '#06B6D4',
        is_active: true
      };

      await supabase.from('geo_fence_zones').insert(newZone);
      
      // Update onboarding progress for 'setup_geofence'
      const onboardingSteps = JSON.parse(localStorage.getItem('db_onboarding_progress') || '[]');
      const updatedOnboarding = onboardingSteps.map(step => 
        step.step_key === 'setup_geofence' ? { ...step, is_completed: true, completed_at: new Date().toISOString() } : step
      );
      localStorage.setItem('db_onboarding_progress', JSON.stringify(updatedOnboarding));

      window.dispatchEvent(new Event('local_db_change'));
      forceRefresh();
      loadZones(selectedClientId);
      setIsDrawing(false);
      alert('Geo-fence zone created.');
    } catch (e) {
      alert('Failed saving new fence zone.');
    }
  };

  const selectedZone = zones.find(z => z.id === selectedZoneId);

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-panel-white border border-border-light rounded p-4">
        {[
          { label: 'Fences Created', val: zones.length.toString() },
          { label: 'Active Campaigns', val: '1 campaign' },
          { label: 'Triggers Sent', val: '142 triggers' },
          { label: 'Avg CTR Rate', val: '8.42% CTR' }
        ].map((met, i) => (
          <div key={i} className="flex flex-col">
            <span className="font-mono text-[9px] uppercase font-bold text-text-muted">{met.label}</span>
            <span className="text-sm font-bold text-text-primary font-mono mt-0.5">{met.val}</span>
          </div>
        ))}
      </div>

      {/* Split view Map (60%) & Zones list (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[440px]">
        
        {/* Left Column: Glowing vector map */}
        <div className="lg:col-span-2 bg-dark-panel border border-dark-surface rounded-lg relative overflow-hidden flex items-center justify-center p-4 h-full">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          
          {/* Mock Vector Map Canvas Grid */}
          <div className="w-full h-full relative flex items-center justify-center">
            {/* Mock Indiranagar Road Lines */}
            <svg className="absolute inset-0 w-full h-full text-dark-surface" fill="none">
              <path d="M0,80 L400,120 L800,90" stroke="#1F2937" strokeWidth="3" />
              <path d="M120,0 L200,400 L250,800" stroke="#1F2937" strokeWidth="2" />
              <path d="M0,280 L450,220 L800,290" stroke="#1F2937" strokeWidth="3.5" />
            </svg>

            {/* Glowing Active Zone circles */}
            {selectedZone && (
              <div 
                className="absolute w-44 h-44 rounded-full border-2 border-primary-cyan/40 bg-primary-cyan/10 flex items-center justify-center animate-pulse"
                style={{ width: `${radius / 2}px`, height: `${radius / 2}px` }}
              >
                <div className="w-3 h-3 rounded-full bg-primary-cyan border-2 border-white shadow-lg"></div>
                <span className="absolute -top-6 bg-[#111827]/90 text-white font-mono text-[9px] px-1.5 py-0.5 rounded border border-border-medium whitespace-nowrap">
                  {selectedZone.name} ({radius}m)
                </span>
              </div>
            )}

            {/* Map pointer indicators */}
            <div className="absolute bottom-4 left-4 font-mono text-[10px] text-text-muted">
              COORDS: 12.9718° N, 77.6411° E (Bangalore)
            </div>
          </div>
        </div>

        {/* Right Column: Zones list & editor */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-4 flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-page-bg pb-2">
              <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">
                GEOGRAPHIC FENCES
              </span>
              <button 
                onClick={() => setIsDrawing(true)}
                className="font-mono text-[10px] font-bold text-primary-cyan hover:underline cursor-pointer"
              >
                + CREATE ZONE
              </button>
            </div>

            {/* Drawing mode Editor panel */}
            {isDrawing ? (
              <div className="space-y-3 bg-page-bg/40 p-3 rounded border border-page-bg text-xs">
                <div className="space-y-1">
                  <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Zone Name</label>
                  <input type="text" value={zoneName} onChange={e => setZoneName(e.target.value)} className="w-full border border-border-light rounded px-2 py-1 text-xs" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Fence Radius</label>
                    <span className="font-mono text-[9px] font-bold text-primary-cyan">{radius}m</span>
                  </div>
                  <input type="range" min="100" max="600" step="50" value={radius} onChange={e => setRadius(Number(e.target.value))} className="w-full h-1 bg-page-bg rounded-lg appearance-none cursor-pointer text-primary-cyan" />
                </div>

                <div className="flex gap-2 pt-2 border-t border-page-bg">
                  <button type="button" onClick={() => setIsDrawing(false)} className="flex-1 py-1 border border-border-light text-[10px] rounded hover:bg-page-bg cursor-pointer">Cancel</button>
                  <button type="button" onClick={handleSaveNewZone} className="flex-1 py-1 bg-primary-cyan text-white text-[10px] font-semibold rounded hover:bg-primary-cyan-hover cursor-pointer">Save Fence</button>
                </div>
              </div>
            ) : (
              /* Zones toggles list */
              <div className="divide-y divide-page-bg text-xs overflow-y-auto max-h-[220px]">
                {zones.length === 0 ? (
                  <div className="py-8 text-center text-text-muted">No fences found.</div>
                ) : (
                  zones.map(z => (
                    <div 
                      key={z.id} 
                      onClick={() => {
                        setSelectedZoneId(z.id);
                        setRadius(z.radius_meters || 300);
                      }}
                      className={`py-2.5 flex items-center justify-between cursor-pointer hover:bg-page-bg/10 ${
                        selectedZoneId === z.id ? 'bg-cyan-50/20 px-1 rounded' : ''
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 truncate max-w-[70%]">
                        <span className="font-semibold text-text-primary truncate">{z.name}</span>
                        <span className="font-mono text-[9px] text-text-muted">Radius: {z.radius_meters || 300}m</span>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleZone(z.id, z.is_active);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase cursor-pointer ${
                          z.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-page-bg text-text-secondary'
                        }`}
                      >
                        {z.is_active ? 'ACTIVE' : 'PAUSED'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {!isDrawing && (
            <button 
              onClick={() => navigate('/geofencing/campaigns')}
              className="w-full py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold mt-4 transition-colors cursor-pointer"
            >
              Compose Fenced SMS Campaign
            </button>
          )}
        </div>

      </div>

    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 2: Geo Campaigns builder step wizard
// ----------------------------------------------------
function GeoCampaignBuilder() {
  const { agency, activeClient, forceRefresh } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [usedModel, setUsedModel] = useState('');
  const [isWriting, setIsWriting] = useState(false);

  const handleLaunch = async () => {
    if (!name || !message) return;


    try {
      const { data: zones } = await supabase.from('geo_fence_zones').eq('client_id', activeClient.id);
      const zoneId = zones && zones.length > 0 ? zones[0].id : 'zone_kovai_1';

      await supabase.from('geo_campaigns').insert({
        zone_id: zoneId,
        agency_id: agency.id,
        client_id: activeClient.id,
        name,
        trigger_type: 'dwell',
        dwell_time_seconds: 120,
        action_type: 'sms',
        message_title: name,
        message_body: message,
        status: 'active',
        budget_daily: 20.00
      });

      window.dispatchEvent(new Event('local_db_change'));
      forceRefresh();
      alert('Fenced campaign launched successfully.');
      navigate('/geofencing');
    } catch (e) {
      alert('Failed saving campaign.');
    }
  };

  const generateMessage = async () => {
    setIsWriting(true);
    try {
      const { data } = await supabase.functions.invoke('ai-generate', {
        body: {
          action: 'geo-msg',
          input: { clientName: activeClient?.name || 'Client' },
          agency_id: agency.id
        }
      });
      setMessage(data.output);
      if (data.model_name) setUsedModel(data.model_name);
      forceRefresh();
      alert('AI GMB notification message drafted.');
    } catch (e) {
      alert('Failed drafting message.');
    } finally {
      setIsWriting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/geofencing')} className="text-xs font-mono text-text-secondary hover:text-primary-cyan cursor-pointer">← GEOFENCING HOME</button>
          <span className="text-xs text-text-muted font-mono">/</span>
          <span className="text-xs font-mono font-bold text-text-primary uppercase">COMPOSING SMS CAMPAIGN</span>
        </div>
        <span className="font-mono text-xs text-text-secondary">STEP {step} OF 4</span>
      </div>

      <div className="bg-panel-white border border-border-light rounded shadow p-6 space-y-6">
        
        {/* Step progress bar */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-sm ${s === step ? 'bg-primary-cyan' : s < step ? 'bg-primary-cyan/40' : 'bg-page-bg'}`} />
          ))}
        </div>

        {/* STEP 1: Name campaign */}
        {step === 1 && (
          <div className="space-y-1">
            <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase font-sans">Campaign Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Indiranagar Lunch Special Alert" className="w-full border border-border-light rounded px-3 py-1.5 text-xs" />
          </div>
        )}

        {/* STEP 2: Trigger types */}
        {step === 2 && (
          <div className="space-y-3 text-xs text-text-secondary select-none">
            <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">Select trigger actions</label>
            <div className="flex gap-2">
              {['enter_zone', 'exit_zone', 'dwell_time_2min'].map(t => (
                <button key={t} type="button" className="px-3 py-1.5 border border-primary-cyan bg-cyan-50/20 text-primary-cyan font-bold rounded uppercase">
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Write message */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase">SMS Push Message</label>
              <button type="button" onClick={generateMessage} className="font-mono text-[9px] font-bold text-primary-cyan flex items-center gap-0.5 cursor-pointer">
                <Sparkles size={11} />
                <span>AI WRITE MESSAGE</span>
              </button>
            </div>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type push notification copy..." className="w-full border border-border-light rounded p-3 text-xs h-28 font-sans focus:outline-none" />
            {usedModel && message && <AiOutputBadge modelName={usedModel} />}
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="p-4 bg-page-bg/40 border border-border-light rounded space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">Name:</span>
                <span className="font-semibold text-text-primary">{name}</span>
              </div>
              <div className="flex justify-between border-t border-page-bg pt-2 mt-2">
                <span className="text-text-secondary text-left mr-3">Message:</span>
                <span className="text-text-primary text-right italic">"{message}"</span>
              </div>
            </div>

            <button onClick={handleLaunch} className="w-full py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white text-xs font-semibold rounded cursor-pointer transition-colors">
              LAUNCH CAMPAIGN
            </button>
          </div>
        )}

        {/* Action triggers */}
        <div className="flex justify-between border-t border-border-light pt-4 mt-6">
          <button 
            type="button" 
            disabled={step === 1}
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            className="px-3.5 py-1.5 border border-border-light rounded text-xs text-text-secondary hover:bg-page-bg disabled:opacity-40 cursor-pointer"
          >
            Back
          </button>
          {step < 4 ? (
            <button 
              type="button"
              onClick={() => setStep(prev => Math.min(4, prev + 1))}
              className="px-3.5 py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer"
            >
              Next Step
            </button>
          ) : null}
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 3: Competitor Conquest
// ----------------------------------------------------
function GeoCompetitorsConquest() {
  const navigate = useNavigate();
  return (
    <div className="p-8 text-center bg-panel-white border border-border-light rounded font-sans">
      <p className="text-xs text-text-secondary mb-3">To monitor competitor physical store layouts and map overlap bounds, launch geofencing.</p>
      <Link to="/geofencing" className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold inline-block">Open Geofencing Dashboard</Link>
    </div>
  );
}

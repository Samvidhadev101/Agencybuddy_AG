import React from 'react';
import ComingSoon from '../../components/ComingSoon';

export default function Reputation() {
  return <ComingSoon title="Reputation" />;
}


// ----------------------------------------------------
// Sub-Page 1: Reputation Dashboard
// ----------------------------------------------------
function ReputationDashboard() {
  const { selectedClientId, forceRefresh } = useApp();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (selectedClientId) {
      supabase.from('reviews').eq('client_id', selectedClientId).order('review_date', { ascending: false }).then(({ data }) => {
        setReviews(data || []);
      });
    }
  }, [selectedClientId]);

  // Compute stats
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  // Compute distribution
  const ratingsCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    ratingsCounts[r.rating] = (ratingsCounts[r.rating] || 0) + 1;
  });

  const chartData = [
    { stars: '5 ★', count: ratingsCounts[5] },
    { stars: '4 ★', count: ratingsCounts[4] },
    { stars: '3 ★', count: ratingsCounts[3] },
    { stars: '2 ★', count: ratingsCounts[2] },
    { stars: '1 ★', count: ratingsCounts[1] }
  ];

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Metrics & Ratings breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core Average Display */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-[10px] font-bold text-text-secondary uppercase mb-2">
            Average customer rating
          </span>
          <h2 className="text-4xl font-extrabold text-text-primary tracking-tight font-sans">
            {averageRating} ★
          </h2>
          <div className="flex gap-1 text-yellow-400 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} fill={i < Math.round(Number(averageRating)) ? 'currentColor' : 'none'} stroke="currentColor" />
            ))}
          </div>
          <p className="text-[11px] text-text-secondary mt-3">
            Based on {totalReviews} tracked directory reviews.
          </p>
        </div>

        {/* Ratings Distribution bar chart */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-6 flex flex-col justify-between h-44">
          <span className="font-mono text-[10px] font-bold text-text-secondary uppercase border-b border-page-bg pb-1.5 mb-2">
            Ratings Distribution
          </span>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="90%">
              <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                <YAxis dataKey="stars" type="category" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <Bar dataKey="count" fill="#F59E0B" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actions Cards */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-6 flex flex-col justify-between h-44">
          <div className="space-y-3">
            <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-2">
              Reviews Controls
            </span>
            <div className="grid grid-cols-1 gap-1.5 pt-1">
              <button onClick={() => navigate('/reputation/respond')} className="w-full text-left py-1.5 px-3 border border-border-light hover:border-primary-cyan rounded text-xs flex justify-between items-center bg-panel-white cursor-pointer transition-colors font-medium">
                <span>Compose AI Review replies</span>
              </button>
              <button onClick={() => navigate('/reputation/generate')} className="w-full text-left py-1.5 px-3 border border-border-light hover:border-primary-cyan rounded text-xs flex justify-between items-center bg-panel-white transition-colors cursor-pointer font-medium">
                <span>Generate QR flyer cards</span>
                <span className="font-mono text-[10px] text-text-muted">QR flyers</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Reviews list */}
      <div className="bg-panel-white border border-border-light rounded shadow-sm p-6">
        <span className="font-mono text-[10px] font-bold text-text-secondary uppercase block border-b border-page-bg pb-2 mb-4">
          Recent Customer Feedbacks Logs
        </span>

        <div className="divide-y divide-page-bg text-xs">
          {reviews.length === 0 ? (
            <div className="py-8 text-center text-text-secondary">No reviews found.</div>
          ) : (
            reviews.map(rev => (
              <div key={rev.id} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">{rev.reviewer_name}</span>
                    <span className="font-mono text-[9px] text-text-muted uppercase">via {rev.platform}</span>
                    <span className="text-yellow-400 font-bold ml-1 font-mono">{rev.rating} ★</span>
                  </div>
                  <p className="text-text-secondary leading-relaxed font-sans">{rev.review_text}</p>
                  
                  {rev.response_text && (
                    <div className="mt-2 pl-3 border-l-2 border-primary-cyan bg-page-bg/40 p-2 rounded text-[11px] text-text-secondary">
                      <span className="font-mono text-[9px] font-bold text-primary-cyan block mb-0.5 uppercase">AGENCY RESPONSE:</span>
                      "{rev.response_text}"
                    </div>
                  )}
                </div>

                <div className="shrink-0 pt-1">
                  {rev.response_status === 'unresponded' ? (
                    <button 
                      onClick={() => navigate('/reputation/respond')}
                      className="px-2.5 py-1 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-[10px] font-semibold cursor-pointer"
                    >
                      Draft Reply
                    </button>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                      Responded
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 2: Review Responder
// ----------------------------------------------------
function ReviewResponder() {
  const { agency, selectedClientId, forceRefresh } = useApp();
  const navigate = useNavigate();

  const [unresponded, setUnresponded] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [usedModel, setUsedModel] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  useEffect(() => {
    if (selectedClientId) {
      loadReviews(selectedClientId);
    }
  }, [selectedClientId]);

  const loadReviews = async (clientId) => {
    const { data } = await supabase.from('reviews').eq('client_id', clientId).eq('response_status', 'unresponded');
    setUnresponded(data || []);
  };

  const handlePublishReply = async (e) => {
    e.preventDefault();
    if (!selectedReview || !replyText) return;

    try {
      const list = JSON.parse(localStorage.getItem('db_reviews') || '[]');
      const updated = list.map(rev => 
        rev.id === selectedReview.id 
          ? { ...rev, response_text: replyText, response_status: 'responded', responded_at: new Date().toISOString() } 
          : rev
      );
      localStorage.setItem('db_reviews', JSON.stringify(updated));
      window.dispatchEvent(new Event('local_db_change'));
      
      loadReviews(selectedClientId);
      setSelectedReview(null);
      setReplyText('');
      setUsedModel('');
      forceRefresh();
      alert('AI response published to listing dashboard.');
      navigate('/reputation');
    } catch (e) {
      alert('Failed saving response.');
    }
  };

  const handleAiDraft = async () => {

    setIsDrafting(true);
    try {
      const { data } = await supabase.functions.invoke('ai-generate', {
        body: {
          action: 'review-response',
          input: { topic: selectedReview.review_text },
          agency_id: agency.id
        }
      });
      setReplyText(data.output);
      if (data.model_name) setUsedModel(data.model_name);
      forceRefresh();
      alert('AI response generated.');
    } catch (e) {
      alert('Failed generating review response.');
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/reputation')} className="text-xs font-mono text-text-secondary hover:text-primary-cyan cursor-pointer">← REPUTATION HOME</button>
          <span className="text-xs text-text-muted font-mono">/</span>
          <span className="text-xs font-mono font-bold text-text-primary uppercase">DRAFT REVIEWS REPLIES</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Unresponded reviews list */}
        <div className="lg:col-span-2 bg-panel-white border border-border-light rounded shadow-sm overflow-hidden h-[340px] flex flex-col">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-page-bg/40 border-b border-border-light text-[10px] font-mono text-text-secondary uppercase">
                <th className="py-2.5 px-4 font-semibold">Reviewer</th>
                <th className="py-2.5 px-4 font-semibold">Stars</th>
                <th className="py-2.5 px-4 font-semibold">Feedback Content</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-page-bg text-xs">
              {unresponded.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-text-secondary">
                    All reviews answered! Good job.
                  </td>
                </tr>
              ) : (
                unresponded.map(rev => (
                  <tr 
                    key={rev.id} 
                    onClick={() => setSelectedReview(rev)}
                    className={`hover:bg-[#F0FDFA] transition-colors cursor-pointer ${
                      selectedReview?.id === rev.id ? 'bg-cyan-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-text-primary">{rev.reviewer_name}</td>
                    <td className="py-3 px-4 text-yellow-400 font-bold font-mono">{rev.rating} ★</td>
                    <td className="py-3 px-4 text-text-secondary truncate max-w-xs">{rev.review_text}</td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-primary-cyan hover:underline font-semibold">Answer →</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Answer Box Panel */}
        <div className="bg-panel-white border border-border-light rounded shadow-sm p-4 flex flex-col justify-between h-[340px]">
          {selectedReview ? (
            <div className="flex flex-col justify-between h-full">
              <div className="space-y-3 overflow-y-auto max-h-[160px] scrollbar-thin">
                <div className="flex justify-between items-start border-b border-page-bg pb-1.5">
                  <span className="font-mono text-[9px] font-bold text-text-secondary uppercase">
                    RATING: {selectedReview.rating} STARS
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">{selectedReview.platform}</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed bg-page-bg/30 p-2.5 border border-page-bg rounded italic">
                  "{selectedReview.review_text}"
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center border-t border-page-bg pt-2">
                  <span className="font-mono text-[9px] font-bold text-text-muted uppercase">DRAFT RESPONSE</span>
                  <button 
                    onClick={handleAiDraft}
                    disabled={isDrafting}
                    className="flex items-center gap-1 text-primary-cyan hover:text-primary-cyan-hover font-mono text-[10px] font-bold cursor-pointer"
                  >
                    <Sparkles size={11} />
                    <span>{isDrafting ? 'DRAFTING...' : 'AI REPLY'}</span>
                  </button>
                </div>
                <textarea 
                  value={replyText} 
                  onChange={e => setReplyText(e.target.value)} 
                  placeholder="Draft review answer text..." 
                  className="w-full border border-border-light rounded p-2 text-xs h-20 font-sans focus:outline-none"
                />
                {usedModel && replyText && <AiOutputBadge modelName={usedModel} />}

                <button 
                  onClick={handlePublishReply}
                  className="w-full py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white text-xs font-semibold rounded cursor-pointer transition-colors"
                >
                  Publish Response
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-xs text-text-muted p-6">
              Select an unanswered review row to draft response templates.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 3: Review Generation flyer
// ----------------------------------------------------
function ReviewGeneration() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/reputation')} className="text-xs font-mono text-text-secondary hover:text-primary-cyan cursor-pointer">← REPUTATION HOME</button>
          <span className="text-xs text-text-muted font-mono">/</span>
          <span className="text-xs font-mono font-bold text-text-primary uppercase">QR GENERATOR FLYER</span>
        </div>
      </div>

      <div className="bg-panel-white border border-border-light rounded shadow-sm p-6 flex flex-col items-center justify-center text-center space-y-4">
        <h3 className="text-sm font-semibold text-text-primary uppercase font-mono">Review Link Flyer QR Card</h3>
        <p className="text-xs text-text-secondary max-w-sm">Place this QR code flyer at the billing reception desks to collect patient or restaurant reviews instantly.</p>
        
        {/* Mock QR flyer visual */}
        <div className="border border-border-medium rounded-lg p-5 w-48 h-48 bg-panel-white flex flex-col items-center justify-center space-y-2 shadow-inner">
          <span className="text-[10px] font-bold text-primary-cyan font-mono tracking-widest">SCAN ME</span>
          {/* Mock QR dots grid */}
          <div className="w-24 h-24 bg-dark-panel rounded flex items-center justify-center">
            <span className="text-white text-2xl">QR</span>
          </div>
          <span className="text-[9px] font-bold text-text-muted font-mono uppercase">via Google GMB</span>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 4: Brand web mentions alerts
// ----------------------------------------------------
function BrandMentions() {
  const navigate = useNavigate();
  return (
    <div className="p-8 text-center bg-panel-white border border-border-light rounded font-sans">
      <p className="text-xs text-text-secondary mb-3">To monitor organic brand visibility across major search engine citations, visit AEO engine.</p>
      <Link to="/aeo" className="px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold inline-block">Open AEO Engine</Link>
    </div>
  );
}

// ----------------------------------------------------
// Sub-Page 5: Crisis Alerts Dashboard
// ----------------------------------------------------
function CrisisDashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/reputation')} className="text-xs font-mono text-text-secondary hover:text-primary-cyan cursor-pointer">← REPUTATION HOME</button>
          <span className="text-xs text-text-muted font-mono">/</span>
          <span className="text-xs font-mono font-bold text-text-primary uppercase">CRISIS CONTROLS</span>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 p-5 rounded-md text-left flex gap-3 items-start">
        <ShieldAlert className="text-error-red shrink-0" size={20} />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-error-red uppercase font-mono">CRISIS SYSTEM NOTIFICATION</h4>
          <p className="text-[11px] text-text-primary leading-relaxed">
            No negative review surges detected. Reputation indexes are holding stable at 4.7 stars.
          </p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Trade } from '@/lib/db';
import { CloseIcon, EditIcon, TrashIcon, CalendarIcon } from './Icons';
import { confirmAction } from '@/lib/toast';

interface TradeDetailModalProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => Promise<void>;
}

function TradeDetailModal({ trade, isOpen, onClose, onEdit, onDelete }: TradeDetailModalProps) {
  if (!isOpen || !trade) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = () => {
    confirmAction('Are you sure you want to delete this trade record? This action is permanent.', () => {
      onDelete(trade.id);
    });
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Trade #{trade.id} Details</h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Logged on {new Date(trade.createdAt).toLocaleDateString()}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Main Stats Card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <span style={{ 
                fontSize: '0.62rem', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                padding: '3px 8px', 
                borderRadius: '6px', 
                marginRight: '8px',
                background: trade.direction === 'Long' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                color: trade.direction === 'Long' ? 'var(--color-success)' : 'var(--color-danger)'
              }}>
                {trade.direction}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.2rem' }}>{trade.pair}</span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className={`trade-pnl ${trade.status.toLowerCase()}`} style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {trade.closed ? (
                  `${trade.pnl && trade.pnl >= 0 ? '+' : ''}${formatCurrency(trade.pnl || 0)}`
                ) : (
                  'Active'
                )}
              </div>
              {trade.closed && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Return: {((trade.pnl || 0) / (trade.riskAmount || 1)).toFixed(2)}R
                </div>
              )}
            </div>
          </div>

          {/* Trade Info Grid */}
          <div>
            <h3 className="detail-section-title">Trade Settings</h3>
            
            <div className="detail-card-row">
              <div className="detail-item">
                <span className="detail-label">Asset Type</span>
                <span className="detail-value">{trade.assetType}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Order Type</span>
                <span className="detail-value">{trade.orderType}</span>
              </div>
            </div>

            <div className="detail-card-row">
              <div className="detail-item">
                <span className="detail-label">Strategy</span>
                <span className="detail-value">{trade.strategy}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Lot Size / Units</span>
                <span className="detail-value mono">{trade.lotSize}</span>
              </div>
            </div>

            <div className="detail-card-row">
              <div className="detail-item">
                <span className="detail-label">Broker</span>
                <span className="detail-value">{trade.broker || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Session</span>
                <span className="detail-value">{trade.session || '—'}</span>
              </div>
            </div>

            {trade.closed && trade.tradeDuration && (
              <div className="detail-card-row">
                <div className="detail-item">
                  <span className="detail-label">Trade Duration</span>
                  <span className="detail-value mono">{trade.tradeDuration}</span>
                </div>
                <div className="detail-item">
                  {/* Empty for grid alignment */}
                </div>
              </div>
            )}

            <div className="detail-card-row">
              <div className="detail-item">
                <span className="detail-label">Entry Price</span>
                <span className="detail-value mono">{trade.entryPrice}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Exit Price</span>
                <span className="detail-value mono">{trade.closed ? trade.exitPrice : 'N/A'}</span>
              </div>
            </div>

            <div className="detail-card-row">
              <div className="detail-item">
                <span className="detail-label">Stop Loss</span>
                <span className="detail-value mono" style={{ color: 'var(--color-danger-hover)' }}>{trade.stopLossPrice}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Take Profit</span>
                <span className="detail-value mono" style={{ color: 'var(--color-success-hover)' }}>{trade.takeProfitPrice}</span>
              </div>
            </div>

            <div className="detail-card-row">
              <div className="detail-item">
                <span className="detail-label">Risk Amount</span>
                <span className="detail-value mono">{formatCurrency(trade.riskAmount)} ({trade.riskPercentage.toFixed(2)}%)</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Account Capital</span>
                <span className="detail-value mono">{formatCurrency(trade.accountBalance)}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="detail-section-title">Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <CalendarIcon size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Entry:</span>
                <span>{formatDate(trade.entryDate)}</span>
              </div>
              {trade.closed && trade.exitDate && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CalendarIcon size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Exit:</span>
                  <span>{formatDate(trade.exitDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {trade.entryReason && (
            <div>
              <h3 className="detail-section-title">Entry Reason &amp; Plan</h3>
              <div className="detail-textarea">{trade.entryReason}</div>
            </div>
          )}

          {trade.closed && trade.lessonsLearned && (
            <div>
              <h3 className="detail-section-title">Lessons &amp; Retrospective</h3>
              <div className="detail-textarea" style={{ borderColor: 'rgba(16, 185, 129, 0.15)', background: 'rgba(16, 185, 129, 0.01)' }}>
                {trade.lessonsLearned}
              </div>
            </div>
          )}

          {/* Tags & Mistakes */}
          {((trade.tags && trade.tags.length > 0) || (trade.mistakes && trade.mistakes.length > 0)) && (
            <div>
              <h3 className="detail-section-title">Trade Tags &amp; Mistakes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {trade.tags && trade.tags.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Tags:</span>
                    <div className="pill-selector">
                      {trade.tags.map(t => (
                        <span key={t} className="pill-option selected" style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary-hover)', borderColor: 'var(--color-primary-glow)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {trade.mistakes && trade.mistakes.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Mistakes &amp; Rule Violations:</span>
                    <div className="pill-selector">
                      {trade.mistakes.map(m => (
                        <span key={m} className="pill-option selected negative" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderColor: 'var(--color-danger-bg)' }}>{m}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Psychology */}
          <div>
            <h3 className="detail-section-title">Psychology &amp; Discipline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {trade.psychologyBefore.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Before Entry:</span>
                  <div className="pill-selector">
                    {trade.psychologyBefore.map(tag => (
                      <span key={tag} className="pill-option selected">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {trade.psychologyDuring.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>During Trade:</span>
                  <div className="pill-selector">
                    {trade.psychologyDuring.map(tag => (
                      <span key={tag} className="pill-option selected">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {trade.closed && trade.psychologyAfter && trade.psychologyAfter.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>After Exit:</span>
                  <div className="pill-selector">
                    {trade.psychologyAfter.map(tag => (
                      <span key={tag} className="pill-option selected">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {trade.psychologyFactors.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Discipline Factors:</span>
                  <div className="pill-selector">
                    {trade.psychologyFactors.map(tag => {
                      const isNeg = ['FOMO', 'Revenge Trading', 'Fear', 'Greed', 'Impatience', 'Overconfidence', 'Hesitation', 'Anxiety', 'Frustrated', 'Boredom'].includes(tag);
                      const isPos = ['Discipline', 'Patience'].includes(tag);
                      let cl = 'selected';
                      if (isNeg) cl = 'selected negative';
                      else if (isPos) cl = 'selected positive';
                      return (
                        <span key={tag} className={`pill-option ${cl}`}>{tag}</span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Charts / Screenshots */}
          {(trade.chartBefore || trade.chartAfter) && (
            <div>
              <h3 className="detail-section-title">Charts &amp; Visuals</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {trade.chartBefore && (
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Before Entry:</span>
                    <img src={trade.chartBefore} alt="Setup Before" className="detail-image" />
                  </div>
                )}
                {trade.chartAfter && (
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>After Exit:</span>
                    <img src={trade.chartAfter} alt="Setup After" className="detail-image" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="modal-footer" style={{ justifyContent: 'space-between',  }}>
          {/* <button className="btn btn-danger" onClick={handleDelete}>
            <TrashIcon size={16} />
            Delete
          </button> */}
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {/* <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button> */}
            <button className="btn btn-primary" onClick={() => onEdit(trade)}>
              <EditIcon size={16} />
              Edit Trade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(TradeDetailModal);

import React, { useState, useEffect } from 'react';
import { 
  X, Calculator, Calendar, CheckCircle2, PauseCircle, 
  Download, Share2, AlertCircle, FileText, Check 
} from 'lucide-react';
import { api } from '../api';

export default function BillModal({ customer, onClose }) {
  const currentMonth = new Date().toISOString().slice(0, 7); // e.g. '2026-09'
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState(null);

  const fetchCalculation = async (month) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.calculateBill(customer.subscription_id, month);
      setBillData(data);
      if (data.existingInvoice) {
        setSavedInvoice(data.existingInvoice);
      } else {
        setSavedInvoice(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to calculate pro-rated bill.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer && customer.subscription_id) {
      fetchCalculation(selectedMonth);
    }
  }, [customer, selectedMonth]);

  const handleGenerateInvoice = async () => {
    try {
      const res = await api.generateInvoice(customer.subscription_id, selectedMonth);
      setSavedInvoice(res.invoice);
    } catch (err) {
      setError(err.message || 'Invoice generation error');
    }
  };

  const copyWhatsAppSummary = () => {
    if (!billData) return;
    const calc = billData.calculation;
    const text = `🍱 *TIFFINFLOW PRO-RATED BILL FOR ${calc.billingMonth}* 🍱\n` +
      `👤 *Customer:* ${billData.customer.name} (${billData.customer.phone})\n` +
      `📦 *Plan:* ${billData.plan.name} (₹${billData.plan.monthly_price}/mo)\n\n` +
      `📅 *Total Weekdays in Month:* ${calc.totalWeekdaysInMonth}\n` +
      `✅ *Delivered Weekdays:* ${calc.deliveredDays} days\n` +
      `⏸️ *Paused / Leave Days:* ${calc.pausedDays} days\n` +
      `💰 *Daily Rate:* ₹${calc.dailyRate}/day\n\n` +
      `🎉 *Customer Savings (Unbilled):* ₹${calc.savingsForCustomer}\n` +
      `💵 *FINAL PRO-RATED AMOUNT PAYABLE:* ₹${calc.finalAmount}\n\n` +
      `_Thank you for dining with us! Pay via UPI or cash._`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '750px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px',
        position: 'relative'
      }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--color-amber-glow)',
            color: 'var(--color-amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calculator size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.4rem', color: '#fff' }}>Pro-Rated Month-End Invoice</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Billing customer strictly for weekdays served • <strong>{customer.name}</strong> ({customer.phone})
            </p>
          </div>

          {/* Month Selector */}
          <div>
            <input
              type="month"
              className="input-control"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ width: '160px', padding: '6px 10px', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {error && (
          <div style={{ background: 'var(--color-rose-glow)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            Calculating pro-rated billing breakdown...
          </div>
        ) : billData && (
          <div>
            {/* The Mathematical Formula Breakdown Box */}
            <div style={{
              background: 'rgba(11, 17, 32, 0.85)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-amber)' }}>
                  Transparent Mathematical Formula
                </span>
                {savedInvoice && (
                  <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                    <CheckCircle2 size={12} /> Invoice Saved #{savedInvoice.id}
                  </span>
                )}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                textAlign: 'center'
              }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monthly Plan</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>₹{billData.calculation.monthlyPrice}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Weekdays</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{billData.calculation.totalWeekdaysInMonth}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily Rate</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-amber)' }}>₹{billData.calculation.dailyRate}</div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#34d399' }}>Delivered Days</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>{billData.calculation.deliveredDays}</div>
                </div>

                <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#fb7185' }}>Paused Days</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fb7185' }}>{billData.calculation.pausedDays}</div>
                </div>
              </div>

              {/* Total Payable Row */}
              <div style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Formula applied:</span>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {billData.calculation.deliveredDays} delivered days × ₹{billData.calculation.dailyRate}/day
                  </div>
                  {billData.calculation.savingsForCustomer > 0 && (
                    <div style={{ fontSize: '0.82rem', color: '#34d399', marginTop: '2px' }}>
                      🎁 Customer saved ₹{billData.calculation.savingsForCustomer} on paused days!
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount to Pay</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>
                    ₹{billData.calculation.finalAmount}
                  </div>
                </div>
              </div>
            </div>

            {/* Itemized Day-by-Day Schedule Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="var(--color-amber)" />
                Itemized Day-by-Day Delivery Schedule ({selectedMonth})
              </h4>

              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead style={{ background: 'rgba(11, 17, 32, 0.9)', position: 'sticky', top: 0 }}>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 12px' }}>Date</th>
                      <th style={{ padding: '8px 12px' }}>Day</th>
                      <th style={{ padding: '8px 12px' }}>Status</th>
                      <th style={{ padding: '8px 12px' }}>Reason / Notes</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Charged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billData.calculation.itemizedDays.map((d) => (
                      <tr key={d.date} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                        <td style={{ padding: '6px 12px', color: '#fff' }}>{d.date}</td>
                        <td style={{ padding: '6px 12px', color: 'var(--text-secondary)' }}>{d.dayName}</td>
                        <td style={{ padding: '6px 12px' }}>
                          {d.status === 'DELIVERED' && (
                            <span style={{ color: '#34d399', fontWeight: 600 }}>Delivered</span>
                          )}
                          {d.status === 'PAUSED' && (
                            <span style={{ color: '#fb7185', fontWeight: 600 }}>Paused (Leave)</span>
                          )}
                          {d.status === 'WEEKEND' && (
                            <span style={{ color: 'var(--text-muted)' }}>Weekend</span>
                          )}
                          {d.status === 'NOT_STARTED' && (
                            <span style={{ color: 'var(--text-muted)' }}>Before Start</span>
                          )}
                        </td>
                        <td style={{ padding: '6px 12px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {d.reason || (d.status === 'DELIVERED' ? 'Lunch Delivered' : '-')}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, color: d.charge > 0 ? '#fff' : 'var(--text-muted)' }}>
                          ₹{d.charge}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <button
                onClick={copyWhatsAppSummary}
                className="btn-secondary"
                style={{ fontSize: '0.85rem', padding: '10px 16px' }}
              >
                {copied ? <Check size={16} color="#34d399" /> : <Share2 size={16} />}
                {copied ? 'Copied WhatsApp Bill!' : 'Copy Bill for WhatsApp'}
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={onClose} className="btn-secondary">
                  Close
                </button>
                
                {!savedInvoice ? (
                  <button onClick={handleGenerateInvoice} className="btn-primary">
                    <FileText size={16} />
                    Save Official Invoice
                  </button>
                ) : (
                  <button disabled className="btn-secondary" style={{ color: '#34d399', borderColor: '#34d399' }}>
                    <CheckCircle2 size={16} /> Saved
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Search, ArrowUpDown, ChevronLeft, ChevronRight, PauseCircle, 
  PlayCircle, Calculator, Phone, UserCheck, ShieldAlert 
} from 'lucide-react';
import { api } from '../api';

export default function CustomerTable({ onOpenPauseModal, onOpenBillModal, onResumeSubscription, refreshTrigger }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('ASC');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomers({
        page,
        limit,
        search,
        status: statusFilter,
        sortBy,
        order
      });
      setCustomers(data.customers);
      setTotalPages(data.pagination.totalPages || 1);
      setTotalCount(data.pagination.total || 0);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, limit, search, statusFilter, sortBy, order, refreshTrigger]);

  const handleSort = (col) => {
    if (sortBy === col) {
      setOrder(order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(col);
      setOrder('ASC');
    }
    setPage(1);
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      
      {/* Top Filter & Search Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
            <input
              type="text"
              className="input-control"
              placeholder="Search by name, phone, address..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: '38px', fontSize: '0.9rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <select
            className="input-control"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ width: '140px', fontSize: '0.88rem' }}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span>Show</span>
          <select
            className="input-control"
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            style={{ width: '70px', padding: '6px 8px', fontSize: '0.85rem' }}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
          <span>per page ({totalCount} total)</span>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th 
                onClick={() => handleSort('name')} 
                style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Customer Name <ArrowUpDown size={14} color={sortBy === 'name' ? '#f59e0b' : 'currentColor'} />
                </div>
              </th>

              <th 
                onClick={() => handleSort('phone')} 
                style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Phone <ArrowUpDown size={14} color={sortBy === 'phone' ? '#f59e0b' : 'currentColor'} />
                </div>
              </th>

              <th 
                onClick={() => handleSort('plan_price')} 
                style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Plan & Price <ArrowUpDown size={14} color={sortBy === 'plan_price' ? '#f59e0b' : 'currentColor'} />
                </div>
              </th>

              <th 
                onClick={() => handleSort('status')} 
                style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Status <ArrowUpDown size={14} color={sortBy === 'status' ? '#f59e0b' : 'currentColor'} />
                </div>
              </th>

              <th style={{ padding: '12px 14px', textAlign: 'right' }}>
                Actions & Pro-Rated Billing
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading subscribers...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No subscribers match your search criteria.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr 
                  key={c.id} 
                  style={{ 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Customer Info */}
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{c.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.address}</div>
                    {c.dietary_notes && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-amber-light)' }}>
                        🥗 {c.dietary_notes}
                      </div>
                    )}
                  </td>

                  {/* Phone */}
                  <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} />
                      <span style={{ fontFamily: 'monospace' }}>{c.phone}</span>
                    </div>
                  </td>

                  {/* Plan */}
                  <td style={{ padding: '14px' }}>
                    <div style={{ color: '#fff', fontWeight: 500 }}>{c.plan_name || 'Standard Thali'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-amber)' }}>
                      ₹{c.monthly_price}/mo ({c.meal_type})
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '14px' }}>
                    {c.subscription_status === 'PAUSED' ? (
                      <span className="badge badge-paused">
                        <PauseCircle size={12} /> Paused
                      </span>
                    ) : (
                      <span className="badge badge-active">
                        <UserCheck size={12} /> Active
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      
                      {c.subscription_status === 'PAUSED' ? (
                        <button
                          onClick={() => onResumeSubscription(c.subscription_id)}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
                          title="Resume active deliveries immediately"
                        >
                          <PlayCircle size={14} /> Resume
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenPauseModal(c)}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          title="Set pause dates for vacations/festivals"
                        >
                          <PauseCircle size={14} /> Pause
                        </button>
                      )}

                      <button
                        onClick={() => onOpenBillModal(c)}
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        title="Calculate pro-rated month-end bill"
                      >
                        <Calculator size={14} /> Bill
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)'
      }}>
        <div>
          Showing page <strong>{page}</strong> of <strong>{totalPages}</strong>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary"
            style={{ padding: '6px 12px', opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={16} /> Prev
          </button>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn-secondary"
            style={{ padding: '6px 12px', opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
}
